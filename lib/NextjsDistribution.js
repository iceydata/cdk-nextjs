"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextjsDistribution = void 0;
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const fs = require("node:fs");
const path = require("path");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const acm = require("aws-cdk-lib/aws-certificatemanager");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const aws_cloudfront_1 = require("aws-cdk-lib/aws-cloudfront");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const lambda = require("aws-cdk-lib/aws-lambda");
const aws_lambda_1 = require("aws-cdk-lib/aws-lambda");
const route53 = require("aws-cdk-lib/aws-route53");
const route53Patterns = require("aws-cdk-lib/aws-route53-patterns");
const route53Targets = require("aws-cdk-lib/aws-route53-targets");
const constructs_1 = require("constructs");
const constants_1 = require("./constants");
/**
 * Create a CloudFront distribution to serve a Next.js application.
 */
class NextjsDistribution extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        this.commonBehaviorOptions = {
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            compress: true,
        };
        this.edgeLambdas = [];
        this.props = props;
        // Create Custom Domain
        this.validateCustomDomainSettings();
        this.hostedZone = this.lookupHostedZone();
        this.certificate = this.createCertificate();
        // Create Behaviors
        this.s3Origin = new origins.S3Origin(this.props.staticAssetsBucket);
        this.staticBehaviorOptions = this.createStaticBehaviorOptions();
        if (this.isFnUrlIamAuth) {
            this.edgeLambdas.push(this.createEdgeLambda());
        }
        this.serverBehaviorOptions = this.createServerBehaviorOptions();
        this.imageBehaviorOptions = this.createImageBehaviorOptions();
        // Create CloudFront Distribution
        this.distribution = this.createCloudFrontDistribution();
        this.addStaticBehaviorsToDistribution();
        // Connect Custom Domain to CloudFront Distribution
        this.createRoute53Records();
    }
    /**
     * The CloudFront URL of the website.
     */
    get url() {
        return `https://${this.distribution.distributionDomainName}`;
    }
    get customDomainName() {
        const { customDomain } = this.props;
        if (!customDomain) {
            return;
        }
        if (typeof customDomain === 'string') {
            return customDomain;
        }
        return customDomain.domainName;
    }
    /**
     * If the custom domain is enabled, this is the URL of the website with the
     * custom domain.
     */
    get customDomainUrl() {
        const customDomainName = this.customDomainName;
        return customDomainName ? `https://${customDomainName}` : undefined;
    }
    /**
     * The ID of the internally created CloudFront Distribution.
     */
    get distributionId() {
        return this.distribution.distributionId;
    }
    /**
     * The domain name of the internally created CloudFront Distribution.
     */
    get distributionDomain() {
        return this.distribution.distributionDomainName;
    }
    get isFnUrlIamAuth() {
        return this.props.functionUrlAuthType === lambda.FunctionUrlAuthType.AWS_IAM;
    }
    createStaticBehaviorOptions() {
        const staticClientMaxAge = this.props.cachePolicies?.staticClientMaxAgeDefault || constants_1.DEFAULT_STATIC_MAX_AGE;
        // TODO: remove this response headers policy once S3 files have correct cache control headers with new asset deployment technique
        const responseHeadersPolicy = new aws_cloudfront_1.ResponseHeadersPolicy(this, 'StaticResponseHeadersPolicy', {
            // add default header for static assets
            customHeadersBehavior: {
                customHeaders: [
                    {
                        header: 'cache-control',
                        override: false,
                        // by default tell browser to cache static files for this long
                        // this is separate from the origin cache policy
                        value: `public,max-age=${staticClientMaxAge},immutable`,
                    },
                ],
            },
        });
        const cachePolicy = this.props.cachePolicies?.staticCachePolicy ?? cloudfront.CachePolicy.CACHING_OPTIMIZED;
        return {
            ...this.commonBehaviorOptions,
            origin: this.s3Origin,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
            cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
            cachePolicy,
            responseHeadersPolicy,
        };
    }
    get fnUrlAuthType() {
        return this.props.functionUrlAuthType || lambda.FunctionUrlAuthType.NONE;
    }
    /**
     * Once CloudFront OAC is released, remove this to reduce latency.
     */
    createEdgeLambda() {
        const signFnUrlDir = path.resolve(__dirname, '..', 'assets', 'lambdas', 'sign-fn-url');
        const originRequestEdgeFn = new cloudfront.experimental.EdgeFunction(this, 'EdgeFn', {
            runtime: aws_lambda_1.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(signFnUrlDir),
            currentVersionOptions: {
                removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
                retryAttempts: 1, // async retry attempts
            },
        });
        originRequestEdgeFn.currentVersion.grantInvoke(new aws_iam_1.ServicePrincipal('edgelambda.amazonaws.com'));
        originRequestEdgeFn.currentVersion.grantInvoke(new aws_iam_1.ServicePrincipal('lambda.amazonaws.com'));
        originRequestEdgeFn.addToRolePolicy(new aws_iam_1.PolicyStatement({
            actions: ['lambda:InvokeFunctionUrl'],
            resources: [this.props.serverFunction.functionArn, this.props.imageOptFunction.functionArn],
        }));
        const originRequestEdgeFnVersion = lambda.Version.fromVersionArn(this, 'Version', originRequestEdgeFn.currentVersion.functionArn);
        return {
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
            functionVersion: originRequestEdgeFnVersion,
            includeBody: true,
        };
    }
    createServerBehaviorOptions() {
        const fnUrl = this.props.serverFunction.addFunctionUrl({ authType: this.fnUrlAuthType });
        const origin = new origins.HttpOrigin(aws_cdk_lib_1.Fn.parseDomainName(fnUrl.url));
        const originRequestPolicy = this.props.originRequestPolicies?.serverOriginRequestPolicy ??
            cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER;
        const cachePolicy = this.props.cachePolicies?.serverCachePolicy ??
            new cloudfront.CachePolicy(this, 'ServerCachePolicy', NextjsDistribution.serverCachePolicyProps);
        return {
            ...this.commonBehaviorOptions,
            origin,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
            originRequestPolicy,
            cachePolicy,
            edgeLambdas: this.edgeLambdas.length ? this.edgeLambdas : undefined,
            functionAssociations: this.createCloudFrontFnAssociations(),
        };
    }
    /**
     * If this doesn't run, then Next.js Server's `request.url` will be Lambda Function
     * URL instead of domain
     */
    createCloudFrontFnAssociations() {
        const cloudFrontFn = new cloudfront.Function(this, 'CloudFrontFn', {
            code: cloudfront.FunctionCode.fromInline(`
      function handler(event) {
        var request = event.request;
        request.headers["x-forwarded-host"] = request.headers.host;
        return request;
      }
      `),
        });
        return [{ eventType: cloudfront.FunctionEventType.VIEWER_REQUEST, function: cloudFrontFn }];
    }
    createImageBehaviorOptions() {
        const imageOptFnUrl = this.props.imageOptFunction.addFunctionUrl({ authType: this.fnUrlAuthType });
        const origin = new origins.HttpOrigin(aws_cdk_lib_1.Fn.parseDomainName(imageOptFnUrl.url));
        const originRequestPolicy = this.props.originRequestPolicies?.imageOptimizationOriginRequestPolicy ??
            cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER;
        const cachePolicy = this.props.cachePolicies?.imageCachePolicy ??
            new cloudfront.CachePolicy(this, 'ImageCachePolicy', NextjsDistribution.imageCachePolicyProps);
        return {
            ...this.commonBehaviorOptions,
            origin,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
            cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
            cachePolicy,
            originRequestPolicy,
            edgeLambdas: this.edgeLambdas,
        };
    }
    /////////////////////
    // CloudFront Distribution
    /////////////////////
    createCloudFrontDistribution() {
        const { cdk: cdkProps } = this.props;
        const cfDistributionProps = cdkProps?.distribution;
        // build domainNames
        const domainNames = this.buildDistributionDomainNames();
        // if we don't have a static file called index.html then we should
        // redirect to the lambda handler
        const hasIndexHtml = this.props.nextBuild.readPublicFileList().includes('index.html');
        const distribution = new cloudfront.Distribution(this, 'Distribution', {
            // defaultRootObject: "index.html",
            defaultRootObject: '',
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            // Override props.
            ...cfDistributionProps,
            // these values can NOT be overwritten by cfDistributionProps
            domainNames,
            certificate: this.certificate,
            defaultBehavior: this.serverBehaviorOptions,
            additionalBehaviors: {
                // is index.html static or dynamic?
                ...(hasIndexHtml ? {} : { '/': this.serverBehaviorOptions }),
                // known dynamic routes
                'api/*': this.serverBehaviorOptions,
                '_next/data/*': this.serverBehaviorOptions,
                // dynamic images go to lambda
                '_next/image*': this.imageBehaviorOptions,
            },
        });
        return distribution;
    }
    addStaticBehaviorsToDistribution() {
        const publicFiles = fs.readdirSync(path.join(this.props.nextjsPath, constants_1.NEXTJS_BUILD_DIR, constants_1.NEXTJS_STATIC_DIR), {
            withFileTypes: true,
        });
        if (publicFiles.length >= 25) {
            throw new Error(`Too many public/ files in Next.js build. CloudFront limits Distributions to 25 Cache Behaviors. See documented limit here: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-limits.html#limits-web-distributions`);
        }
        for (const publicFile of publicFiles) {
            const pathPattern = publicFile.isDirectory() ? `${publicFile.name}/*` : publicFile.name;
            if (!/^[a-zA-Z0-9_\-\.\*\$/~"'@:+?&]+$/.test(pathPattern)) {
                throw new Error(`Invalid CloudFront Distribution Cache Behavior Path Pattern: ${pathPattern}. Please see documentation here: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#DownloadDistValuesPathPattern`);
            }
            this.distribution.addBehavior(pathPattern, this.s3Origin, this.staticBehaviorOptions);
        }
    }
    buildDistributionDomainNames() {
        const customDomain = typeof this.props.customDomain === 'string' ? this.props.customDomain : this.props.customDomain?.domainName;
        const alternateNames = typeof this.props.customDomain === 'string' ? [] : this.props.customDomain?.alternateNames || [];
        return customDomain ? [customDomain, ...alternateNames] : [];
    }
    /////////////////////
    // Custom Domain
    /////////////////////
    validateCustomDomainSettings() {
        const { customDomain } = this.props;
        if (!customDomain) {
            return;
        }
        if (typeof customDomain === 'string') {
            return;
        }
        if (customDomain.isExternalDomain === true) {
            if (!customDomain.certificate) {
                throw new Error('A valid certificate is required when "isExternalDomain" is set to "true".');
            }
            if (customDomain.domainAlias) {
                throw new Error('Domain alias is only supported for domains hosted on Amazon Route 53. Do not set the "customDomain.domainAlias" when "isExternalDomain" is enabled.');
            }
            if (customDomain.hostedZone) {
                throw new Error('Hosted zones can only be configured for domains hosted on Amazon Route 53. Do not set the "customDomain.hostedZone" when "isExternalDomain" is enabled.');
            }
        }
    }
    lookupHostedZone() {
        const { customDomain } = this.props;
        // Skip if customDomain is not configured
        if (!customDomain) {
            return;
        }
        let hostedZone;
        if (typeof customDomain === 'string') {
            hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
                domainName: customDomain,
            });
        }
        else if (typeof customDomain.hostedZone === 'string') {
            hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
                domainName: customDomain.hostedZone,
            });
        }
        else if (customDomain.hostedZone) {
            hostedZone = customDomain.hostedZone;
        }
        else if (typeof customDomain.domainName === 'string') {
            // Skip if domain is not a Route53 domain
            if (customDomain.isExternalDomain === true) {
                return;
            }
            hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
                domainName: customDomain.domainName,
            });
        }
        else {
            hostedZone = customDomain.hostedZone;
        }
        return hostedZone;
    }
    createCertificate() {
        const { customDomain } = this.props;
        if (!customDomain) {
            return;
        }
        let acmCertificate;
        // HostedZone is set for Route 53 domains
        if (this.hostedZone) {
            if (typeof customDomain === 'string') {
                acmCertificate = new acm.DnsValidatedCertificate(this, 'Certificate', {
                    domainName: customDomain,
                    hostedZone: this.hostedZone,
                    region: 'us-east-1',
                });
            }
            else if (customDomain.certificate) {
                acmCertificate = customDomain.certificate;
            }
            else {
                acmCertificate = new acm.DnsValidatedCertificate(this, 'Certificate', {
                    domainName: customDomain.domainName,
                    hostedZone: this.hostedZone,
                    region: 'us-east-1',
                });
            }
        }
        // HostedZone is NOT set for non-Route 53 domains
        else {
            if (typeof customDomain !== 'string') {
                acmCertificate = customDomain.certificate;
            }
        }
        return acmCertificate;
    }
    createRoute53Records() {
        const { customDomain } = this.props;
        if (!customDomain || !this.hostedZone) {
            return;
        }
        let recordName;
        let domainAlias;
        if (typeof customDomain === 'string') {
            recordName = customDomain;
        }
        else {
            recordName = customDomain.domainName;
            domainAlias = customDomain.domainAlias;
        }
        // Create DNS record
        const recordProps = {
            recordName,
            zone: this.hostedZone,
            target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(this.distribution)),
        };
        new route53.ARecord(this, 'AliasRecord', recordProps);
        new route53.AaaaRecord(this, 'AliasRecordAAAA', recordProps);
        // Create Alias redirect record
        if (domainAlias) {
            new route53Patterns.HttpsRedirect(this, 'Redirect', {
                zone: this.hostedZone,
                recordNames: [domainAlias],
                targetDomain: recordName,
            });
        }
    }
}
_a = JSII_RTTI_SYMBOL_1;
NextjsDistribution[_a] = { fqn: "cdk-nextjs-standalone.NextjsDistribution", version: "4.0.0-beta.3" };
/**
 * The default CloudFront cache policy properties for dynamic requests to server handler.
 */
NextjsDistribution.serverCachePolicyProps = {
    queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
    headerBehavior: cloudfront.CacheHeaderBehavior.allowList('accept', 'rsc', 'next-router-prefetch', 'next-router-state-tree', 'next-url'),
    cookieBehavior: cloudfront.CacheCookieBehavior.all(),
    defaultTtl: aws_cdk_lib_1.Duration.seconds(0),
    maxTtl: aws_cdk_lib_1.Duration.days(365),
    minTtl: aws_cdk_lib_1.Duration.seconds(0),
    enableAcceptEncodingBrotli: true,
    enableAcceptEncodingGzip: true,
    comment: 'Nextjs Server Default Cache Policy',
};
/**
 * The default CloudFront Cache Policy properties for images.
 */
NextjsDistribution.imageCachePolicyProps = {
    queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
    headerBehavior: cloudfront.CacheHeaderBehavior.allowList('accept'),
    cookieBehavior: cloudfront.CacheCookieBehavior.all(),
    defaultTtl: aws_cdk_lib_1.Duration.days(1),
    maxTtl: aws_cdk_lib_1.Duration.days(365),
    minTtl: aws_cdk_lib_1.Duration.days(0),
    enableAcceptEncodingBrotli: true,
    enableAcceptEncodingGzip: true,
    comment: 'Nextjs Image Default Cache Policy',
};
exports.NextjsDistribution = NextjsDistribution;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTmV4dGpzRGlzdHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL05leHRqc0Rpc3RyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDhCQUE4QjtBQUM5Qiw2QkFBNkI7QUFDN0IsNkNBQTBEO0FBQzFELDBEQUEwRDtBQUMxRCx5REFBeUQ7QUFDekQsK0RBQWlGO0FBQ2pGLDhEQUE4RDtBQUM5RCxpREFBd0U7QUFDeEUsaURBQWlEO0FBQ2pELHVEQUFpRDtBQUNqRCxtREFBbUQ7QUFDbkQsb0VBQW9FO0FBQ3BFLGtFQUFrRTtBQUVsRSwyQ0FBdUM7QUFDdkMsMkNBQTBGO0FBa0gxRjs7R0FFRztBQUNILE1BQWEsa0JBQW1CLFNBQVEsc0JBQVM7SUFzRS9DLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBOEI7UUFDdEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQWhCWCwwQkFBcUIsR0FBMEU7WUFDckcsb0JBQW9CLEVBQUUsVUFBVSxDQUFDLG9CQUFvQixDQUFDLGlCQUFpQjtZQUN2RSxRQUFRLEVBQUUsSUFBSTtTQUNmLENBQUM7UUFNTSxnQkFBVyxHQUE0QixFQUFFLENBQUM7UUFTaEQsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFFbkIsdUJBQXVCO1FBQ3ZCLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxDQUFDO1FBQ3BDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDMUMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUU1QyxtQkFBbUI7UUFDbkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3BFLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUMsMkJB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LFVBQVUsQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLEVBQUU7SUFDOUQsY0FBYyxFQUFFLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO0lBQ2xFLGNBQWMsRUFBRSxVQUFVLENBQUMsbUJBQW1CLENBQUMsR0FBRyxFQUFFO0lBQ3BELFVBQVUsRUFBRSxzQkFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDNUIsTUFBTSxFQUFFLHNCQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztJQUMxQixNQUFNLEVBQUUsc0JBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3hCLDBCQUEwQixFQUFFLElBQUk7SUFDaEMsd0JBQXdCLEVBQUUsSUFBSTtJQUM5QixPQUFPLEVBQUUsbUNBQW1DO0NBQzdDLEFBVmtDLENBVWpDO0FBbkNTLGdEQUFrQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZzIGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IER1cmF0aW9uLCBGbiwgUmVtb3ZhbFBvbGljeSB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGFjbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2VydGlmaWNhdGVtYW5hZ2VyJztcbmltcG9ydCAqIGFzIGNsb3VkZnJvbnQgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQnO1xuaW1wb3J0IHsgRGlzdHJpYnV0aW9uLCBSZXNwb25zZUhlYWRlcnNQb2xpY3kgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udCc7XG5pbXBvcnQgKiBhcyBvcmlnaW5zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250LW9yaWdpbnMnO1xuaW1wb3J0IHsgUG9saWN5U3RhdGVtZW50LCBTZXJ2aWNlUHJpbmNpcGFsIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBSdW50aW1lIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyByb3V0ZTUzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yb3V0ZTUzJztcbmltcG9ydCAqIGFzIHJvdXRlNTNQYXR0ZXJucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtcm91dGU1My1wYXR0ZXJucyc7XG5pbXBvcnQgKiBhcyByb3V0ZTUzVGFyZ2V0cyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtcm91dGU1My10YXJnZXRzJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCB7IERFRkFVTFRfU1RBVElDX01BWF9BR0UsIE5FWFRKU19CVUlMRF9ESVIsIE5FWFRKU19TVEFUSUNfRElSIH0gZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IHsgQmFzZVNpdGVEb21haW5Qcm9wcywgTmV4dGpzQmFzZVByb3BzIH0gZnJvbSAnLi9OZXh0anNCYXNlJztcbmltcG9ydCB7IE5leHRqc0J1aWxkIH0gZnJvbSAnLi9OZXh0anNCdWlsZCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTmV4dGpzRG9tYWluUHJvcHMgZXh0ZW5kcyBCYXNlU2l0ZURvbWFpblByb3BzIHt9XG5cbmV4cG9ydCB0eXBlIE5leHRqc0Rpc3RyaWJ1dGlvbkNka092ZXJyaWRlUHJvcHMgPSBjbG91ZGZyb250LkRpc3RyaWJ1dGlvblByb3BzO1xuXG5leHBvcnQgaW50ZXJmYWNlIE5leHRqc0Rpc3RyaWJ1dGlvbkNka1Byb3BzIHtcbiAgLyoqXG4gICAqIFBhc3MgaW4gYSB2YWx1ZSB0byBvdmVycmlkZSB0aGUgZGVmYXVsdCBzZXR0aW5ncyB0aGlzIGNvbnN0cnVjdCB1c2VzIHRvXG4gICAqIGNyZWF0ZSB0aGUgQ2xvdWRGcm9udCBgRGlzdHJpYnV0aW9uYCBpbnRlcm5hbGx5LlxuICAgKi9cbiAgcmVhZG9ubHkgZGlzdHJpYnV0aW9uPzogTmV4dGpzRGlzdHJpYnV0aW9uQ2RrT3ZlcnJpZGVQcm9wcztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBOZXh0anNDYWNoZVBvbGljeVByb3BzIHtcbiAgcmVhZG9ubHkgc3RhdGljQ2FjaGVQb2xpY3k/OiBjbG91ZGZyb250LklDYWNoZVBvbGljeTtcbiAgcmVhZG9ubHkgc2VydmVyQ2FjaGVQb2xpY3k/OiBjbG91ZGZyb250LklDYWNoZVBvbGljeTtcbiAgcmVhZG9ubHkgaW1hZ2VDYWNoZVBvbGljeT86IGNsb3VkZnJvbnQuSUNhY2hlUG9saWN5O1xuXG4gIC8qKlxuICAgKiBDYWNoZS1jb250cm9sIG1heC1hZ2UgZGVmYXVsdCBmb3Igc3RhdGljIGFzc2V0cyAoL19uZXh0LyopLlxuICAgKiBEZWZhdWx0OiAzMCBkYXlzLlxuICAgKi9cbiAgcmVhZG9ubHkgc3RhdGljQ2xpZW50TWF4QWdlRGVmYXVsdD86IER1cmF0aW9uO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE5leHRqc09yaWdpblJlcXVlc3RQb2xpY3lQcm9wcyB7XG4gIHJlYWRvbmx5IHNlcnZlck9yaWdpblJlcXVlc3RQb2xpY3k/OiBjbG91ZGZyb250LklPcmlnaW5SZXF1ZXN0UG9saWN5O1xuICByZWFkb25seSBpbWFnZU9wdGltaXphdGlvbk9yaWdpblJlcXVlc3RQb2xpY3k/OiBjbG91ZGZyb250LklPcmlnaW5SZXF1ZXN0UG9saWN5O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE5leHRqc0Rpc3RyaWJ1dGlvblByb3BzIGV4dGVuZHMgTmV4dGpzQmFzZVByb3BzIHtcbiAgLyoqXG4gICAqIEJ1Y2tldCBjb250YWluaW5nIHN0YXRpYyBhc3NldHMuXG4gICAqIE11c3QgYmUgcHJvdmlkZWQgaWYgeW91IHdhbnQgdG8gc2VydmUgc3RhdGljIGZpbGVzLlxuICAgKi9cbiAgcmVhZG9ubHkgc3RhdGljQXNzZXRzQnVja2V0OiBzMy5JQnVja2V0O1xuXG4gIC8qKlxuICAgKiBMYW1iZGEgZnVuY3Rpb24gdG8gcm91dGUgYWxsIG5vbi1zdGF0aWMgcmVxdWVzdHMgdG8uXG4gICAqIE11c3QgYmUgcHJvdmlkZWQgaWYgeW91IHdhbnQgdG8gc2VydmUgZHluYW1pYyByZXF1ZXN0cy5cbiAgICovXG4gIHJlYWRvbmx5IHNlcnZlckZ1bmN0aW9uOiBsYW1iZGEuSUZ1bmN0aW9uO1xuXG4gIC8qKlxuICAgKiBMYW1iZGEgZnVuY3Rpb24gdG8gb3B0aW1pemUgaW1hZ2VzLlxuICAgKiBNdXN0IGJlIHByb3ZpZGVkIGlmIHlvdSB3YW50IHRvIHNlcnZlIGR5bmFtaWMgcmVxdWVzdHMuXG4gICAqL1xuICByZWFkb25seSBpbWFnZU9wdEZ1bmN0aW9uOiBsYW1iZGEuSUZ1bmN0aW9uO1xuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgZm9yIGNyZWF0ZWQgQ0RLIHJlc291cmNlcy5cbiAgICovXG4gIHJlYWRvbmx5IGNkaz86IE5leHRqc0Rpc3RyaWJ1dGlvbkNka1Byb3BzO1xuXG4gIC8qKlxuICAgKiBCdWlsdCBOZXh0SlMgYXBwLlxuICAgKi9cbiAgcmVhZG9ubHkgbmV4dEJ1aWxkOiBOZXh0anNCdWlsZDtcblxuICAvKipcbiAgICogT3ZlcnJpZGUgdGhlIGRlZmF1bHQgQ2xvdWRGcm9udCBjYWNoZSBwb2xpY2llcyBjcmVhdGVkIGludGVybmFsbHkuXG4gICAqL1xuICByZWFkb25seSBjYWNoZVBvbGljaWVzPzogTmV4dGpzQ2FjaGVQb2xpY3lQcm9wcztcblxuICAvKipcbiAgICogT3ZlcnJpZGUgdGhlIGRlZmF1bHQgQ2xvdWRGcm9udCBvcmlnaW4gcmVxdWVzdCBwb2xpY2llcyBjcmVhdGVkIGludGVybmFsbHkuXG4gICAqL1xuICByZWFkb25seSBvcmlnaW5SZXF1ZXN0UG9saWNpZXM/OiBOZXh0anNPcmlnaW5SZXF1ZXN0UG9saWN5UHJvcHM7XG5cbiAgLyoqXG4gICAqIFRoZSBjdXN0b21Eb21haW4gZm9yIHRoaXMgd2Vic2l0ZS4gU3VwcG9ydHMgZG9tYWlucyB0aGF0IGFyZSBob3N0ZWRcbiAgICogZWl0aGVyIG9uIFtSb3V0ZSA1M10oaHR0cHM6Ly9hd3MuYW1hem9uLmNvbS9yb3V0ZTUzLykgb3IgZXh0ZXJuYWxseS5cbiAgICpcbiAgICogTm90ZSB0aGF0IHlvdSBjYW4gYWxzbyBtaWdyYXRlIGV4dGVybmFsbHkgaG9zdGVkIGRvbWFpbnMgdG8gUm91dGUgNTMgYnlcbiAgICogW2ZvbGxvd2luZyB0aGlzIGd1aWRlXShodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vUm91dGU1My9sYXRlc3QvRGV2ZWxvcGVyR3VpZGUvTWlncmF0aW5nRE5TLmh0bWwpLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBuZXcgTmV4dGpzRGlzdHJpYnV0aW9uKHRoaXMsIFwiRGlzdFwiLCB7XG4gICAqICAgY3VzdG9tRG9tYWluOiBcImRvbWFpbi5jb21cIixcbiAgICogfSk7XG4gICAqXG4gICAqIG5ldyBOZXh0anNEaXN0cmlidXRpb24odGhpcywgXCJEaXN0XCIsIHtcbiAgICogICBjdXN0b21Eb21haW46IHtcbiAgICogICAgIGRvbWFpbk5hbWU6IFwiZG9tYWluLmNvbVwiLFxuICAgKiAgICAgZG9tYWluQWxpYXM6IFwid3d3LmRvbWFpbi5jb21cIixcbiAgICogICAgIGhvc3RlZFpvbmU6IFwiZG9tYWluLmNvbVwiXG4gICAqICAgfSxcbiAgICogfSk7XG4gICAqL1xuICByZWFkb25seSBjdXN0b21Eb21haW4/OiBzdHJpbmcgfCBOZXh0anNEb21haW5Qcm9wcztcblxuICAvKipcbiAgICogSW5jbHVkZSB0aGUgbmFtZSBvZiB5b3VyIGRlcGxveW1lbnQgc3RhZ2UgaWYgcHJlc2VudC5cbiAgICogVXNlZCB0byBuYW1lIHRoZSBlZGdlIGZ1bmN0aW9ucyBzdGFjay5cbiAgICogUmVxdWlyZWQgaWYgdXNpbmcgU1NULlxuICAgKi9cbiAgcmVhZG9ubHkgc3RhZ2VOYW1lPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBPcHRpb25hbCB2YWx1ZSB0byBwcmVmaXggdGhlIGVkZ2UgZnVuY3Rpb24gc3RhY2tcbiAgICogSXQgZGVmYXVsdHMgdG8gXCJOZXh0anNcIlxuICAgKi9cbiAgcmVhZG9ubHkgc3RhY2tQcmVmaXg/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlIGxhbWJkYSBmdW5jdGlvbiB1cmwgYXV0aCB0eXBlXG4gICAqIEBkZWZhdWx0IFwiTk9ORVwiXG4gICAqL1xuICByZWFkb25seSBmdW5jdGlvblVybEF1dGhUeXBlPzogbGFtYmRhLkZ1bmN0aW9uVXJsQXV0aFR5cGU7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgQ2xvdWRGcm9udCBkaXN0cmlidXRpb24gdG8gc2VydmUgYSBOZXh0LmpzIGFwcGxpY2F0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgTmV4dGpzRGlzdHJpYnV0aW9uIGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgLyoqXG4gICAqIFRoZSBkZWZhdWx0IENsb3VkRnJvbnQgY2FjaGUgcG9saWN5IHByb3BlcnRpZXMgZm9yIGR5bmFtaWMgcmVxdWVzdHMgdG8gc2VydmVyIGhhbmRsZXIuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHNlcnZlckNhY2hlUG9saWN5UHJvcHM6IGNsb3VkZnJvbnQuQ2FjaGVQb2xpY3lQcm9wcyA9IHtcbiAgICBxdWVyeVN0cmluZ0JlaGF2aW9yOiBjbG91ZGZyb250LkNhY2hlUXVlcnlTdHJpbmdCZWhhdmlvci5hbGwoKSxcbiAgICBoZWFkZXJCZWhhdmlvcjogY2xvdWRmcm9udC5DYWNoZUhlYWRlckJlaGF2aW9yLmFsbG93TGlzdChcbiAgICAgICdhY2NlcHQnLFxuICAgICAgJ3JzYycsXG4gICAgICAnbmV4dC1yb3V0ZXItcHJlZmV0Y2gnLFxuICAgICAgJ25leHQtcm91dGVyLXN0YXRlLXRyZWUnLFxuICAgICAgJ25leHQtdXJsJ1xuICAgICksXG4gICAgY29va2llQmVoYXZpb3I6IGNsb3VkZnJvbnQuQ2FjaGVDb29raWVCZWhhdmlvci5hbGwoKSxcbiAgICBkZWZhdWx0VHRsOiBEdXJhdGlvbi5zZWNvbmRzKDApLFxuICAgIG1heFR0bDogRHVyYXRpb24uZGF5cygzNjUpLFxuICAgIG1pblR0bDogRHVyYXRpb24uc2Vjb25kcygwKSxcbiAgICBlbmFibGVBY2NlcHRFbmNvZGluZ0Jyb3RsaTogdHJ1ZSxcbiAgICBlbmFibGVBY2NlcHRFbmNvZGluZ0d6aXA6IHRydWUsXG4gICAgY29tbWVudDogJ05leHRqcyBTZXJ2ZXIgRGVmYXVsdCBDYWNoZSBQb2xpY3knLFxuICB9O1xuXG4gIC8qKlxuICAgKiBUaGUgZGVmYXVsdCBDbG91ZEZyb250IENhY2hlIFBvbGljeSBwcm9wZXJ0aWVzIGZvciBpbWFnZXMuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGltYWdlQ2FjaGVQb2xpY3lQcm9wczogY2xvdWRmcm9udC5DYWNoZVBvbGljeVByb3BzID0ge1xuICAgIHF1ZXJ5U3RyaW5nQmVoYXZpb3I6IGNsb3VkZnJvbnQuQ2FjaGVRdWVyeVN0cmluZ0JlaGF2aW9yLmFsbCgpLFxuICAgIGhlYWRlckJlaGF2aW9yOiBjbG91ZGZyb250LkNhY2hlSGVhZGVyQmVoYXZpb3IuYWxsb3dMaXN0KCdhY2NlcHQnKSxcbiAgICBjb29raWVCZWhhdmlvcjogY2xvdWRmcm9udC5DYWNoZUNvb2tpZUJlaGF2aW9yLmFsbCgpLFxuICAgIGRlZmF1bHRUdGw6IER1cmF0aW9uLmRheXMoMSksXG4gICAgbWF4VHRsOiBEdXJhdGlvbi5kYXlzKDM2NSksXG4gICAgbWluVHRsOiBEdXJhdGlvbi5kYXlzKDApLFxuICAgIGVuYWJsZUFjY2VwdEVuY29kaW5nQnJvdGxpOiB0cnVlLFxuICAgIGVuYWJsZUFjY2VwdEVuY29kaW5nR3ppcDogdHJ1ZSxcbiAgICBjb21tZW50OiAnTmV4dGpzIEltYWdlIERlZmF1bHQgQ2FjaGUgUG9saWN5JyxcbiAgfTtcblxuICBwcm90ZWN0ZWQgcHJvcHM6IE5leHRqc0Rpc3RyaWJ1dGlvblByb3BzO1xuXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAvLyBQdWJsaWMgUHJvcGVydGllc1xuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgLyoqXG4gICAqIFRoZSBpbnRlcm5hbGx5IGNyZWF0ZWQgQ2xvdWRGcm9udCBgRGlzdHJpYnV0aW9uYCBpbnN0YW5jZS5cbiAgICovXG4gIHB1YmxpYyBkaXN0cmlidXRpb246IERpc3RyaWJ1dGlvbjtcbiAgLyoqXG4gICAqIFRoZSBSb3V0ZSA1MyBob3N0ZWQgem9uZSBmb3IgdGhlIGN1c3RvbSBkb21haW4uXG4gICAqL1xuICBob3N0ZWRab25lPzogcm91dGU1My5JSG9zdGVkWm9uZTtcbiAgLyoqXG4gICAqIFRoZSBBV1MgQ2VydGlmaWNhdGUgTWFuYWdlciBjZXJ0aWZpY2F0ZSBmb3IgdGhlIGN1c3RvbSBkb21haW4uXG4gICAqL1xuICBjZXJ0aWZpY2F0ZT86IGFjbS5JQ2VydGlmaWNhdGU7XG5cbiAgcHJpdmF0ZSBjb21tb25CZWhhdmlvck9wdGlvbnM6IFBpY2s8Y2xvdWRmcm9udC5CZWhhdmlvck9wdGlvbnMsICd2aWV3ZXJQcm90b2NvbFBvbGljeScgfCAnY29tcHJlc3MnPiA9IHtcbiAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTogY2xvdWRmcm9udC5WaWV3ZXJQcm90b2NvbFBvbGljeS5SRURJUkVDVF9UT19IVFRQUyxcbiAgICBjb21wcmVzczogdHJ1ZSxcbiAgfTtcblxuICBwcml2YXRlIHMzT3JpZ2luOiBvcmlnaW5zLlMzT3JpZ2luO1xuXG4gIHByaXZhdGUgc3RhdGljQmVoYXZpb3JPcHRpb25zOiBjbG91ZGZyb250LkJlaGF2aW9yT3B0aW9ucztcblxuICBwcml2YXRlIGVkZ2VMYW1iZGFzOiBjbG91ZGZyb250LkVkZ2VMYW1iZGFbXSA9IFtdO1xuXG4gIHByaXZhdGUgc2VydmVyQmVoYXZpb3JPcHRpb25zOiBjbG91ZGZyb250LkJlaGF2aW9yT3B0aW9ucztcblxuICBwcml2YXRlIGltYWdlQmVoYXZpb3JPcHRpb25zOiBjbG91ZGZyb250LkJlaGF2aW9yT3B0aW9ucztcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogTmV4dGpzRGlzdHJpYnV0aW9uUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgdGhpcy5wcm9wcyA9IHByb3BzO1xuXG4gICAgLy8gQ3JlYXRlIEN1c3RvbSBEb21haW5cbiAgICB0aGlzLnZhbGlkYXRlQ3VzdG9tRG9tYWluU2V0dGluZ3MoKTtcbiAgICB0aGlzLmhvc3RlZFpvbmUgPSB0aGlzLmxvb2t1cEhvc3RlZFpvbmUoKTtcbiAgICB0aGlzLmNlcnRpZmljYXRlID0gdGhpcy5jcmVhdGVDZXJ0aWZpY2F0ZSgpO1xuXG4gICAgLy8gQ3JlYXRlIEJlaGF2aW9yc1xuICAgIHRoaXMuczNPcmlnaW4gPSBuZXcgb3JpZ2lucy5TM09yaWdpbih0aGlzLnByb3BzLnN0YXRpY0Fzc2V0c0J1Y2tldCk7XG4gICAgdGhpcy5zdGF0aWNCZWhhdmlvck9wdGlvbnMgPSB0aGlzLmNyZWF0ZVN0YXRpY0JlaGF2aW9yT3B0aW9ucygpO1xuICAgIGlmICh0aGlzLmlzRm5VcmxJYW1BdXRoKSB7XG4gICAgICB0aGlzLmVkZ2VMYW1iZGFzLnB1c2godGhpcy5jcmVhdGVFZGdlTGFtYmRhKCkpO1xuICAgIH1cbiAgICB0aGlzLnNlcnZlckJlaGF2aW9yT3B0aW9ucyA9IHRoaXMuY3JlYXRlU2VydmVyQmVoYXZpb3JPcHRpb25zKCk7XG4gICAgdGhpcy5pbWFnZUJlaGF2aW9yT3B0aW9ucyA9IHRoaXMuY3JlYXRlSW1hZ2VCZWhhdmlvck9wdGlvbnMoKTtcblxuICAgIC8vIENyZWF0ZSBDbG91ZEZyb250IERpc3RyaWJ1dGlvblxuICAgIHRoaXMuZGlzdHJpYnV0aW9uID0gdGhpcy5jcmVhdGVDbG91ZEZyb250RGlzdHJpYnV0aW9uKCk7XG4gICAgdGhpcy5hZGRTdGF0aWNCZWhhdmlvcnNUb0Rpc3RyaWJ1dGlvbigpO1xuXG4gICAgLy8gQ29ubmVjdCBDdXN0b20gRG9tYWluIHRvIENsb3VkRnJvbnQgRGlzdHJpYnV0aW9uXG4gICAgdGhpcy5jcmVhdGVSb3V0ZTUzUmVjb3JkcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBDbG91ZEZyb250IFVSTCBvZiB0aGUgd2Vic2l0ZS5cbiAgICovXG4gIHB1YmxpYyBnZXQgdXJsKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBodHRwczovLyR7dGhpcy5kaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uRG9tYWluTmFtZX1gO1xuICB9XG5cbiAgZ2V0IGN1c3RvbURvbWFpbk5hbWUoKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCB7IGN1c3RvbURvbWFpbiB9ID0gdGhpcy5wcm9wcztcblxuICAgIGlmICghY3VzdG9tRG9tYWluKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBjdXN0b21Eb21haW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gY3VzdG9tRG9tYWluO1xuICAgIH1cblxuICAgIHJldHVybiBjdXN0b21Eb21haW4uZG9tYWluTmFtZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiB0aGUgY3VzdG9tIGRvbWFpbiBpcyBlbmFibGVkLCB0aGlzIGlzIHRoZSBVUkwgb2YgdGhlIHdlYnNpdGUgd2l0aCB0aGVcbiAgICogY3VzdG9tIGRvbWFpbi5cbiAgICovXG4gIHB1YmxpYyBnZXQgY3VzdG9tRG9tYWluVXJsKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgY3VzdG9tRG9tYWluTmFtZSA9IHRoaXMuY3VzdG9tRG9tYWluTmFtZTtcbiAgICByZXR1cm4gY3VzdG9tRG9tYWluTmFtZSA/IGBodHRwczovLyR7Y3VzdG9tRG9tYWluTmFtZX1gIDogdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBJRCBvZiB0aGUgaW50ZXJuYWxseSBjcmVhdGVkIENsb3VkRnJvbnQgRGlzdHJpYnV0aW9uLlxuICAgKi9cbiAgcHVibGljIGdldCBkaXN0cmlidXRpb25JZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmRpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25JZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgZG9tYWluIG5hbWUgb2YgdGhlIGludGVybmFsbHkgY3JlYXRlZCBDbG91ZEZyb250IERpc3RyaWJ1dGlvbi5cbiAgICovXG4gIHB1YmxpYyBnZXQgZGlzdHJpYnV0aW9uRG9tYWluKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbkRvbWFpbk5hbWU7XG4gIH1cblxuICBwcml2YXRlIGdldCBpc0ZuVXJsSWFtQXV0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5wcm9wcy5mdW5jdGlvblVybEF1dGhUeXBlID09PSBsYW1iZGEuRnVuY3Rpb25VcmxBdXRoVHlwZS5BV1NfSUFNO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVTdGF0aWNCZWhhdmlvck9wdGlvbnMoKTogY2xvdWRmcm9udC5CZWhhdmlvck9wdGlvbnMge1xuICAgIGNvbnN0IHN0YXRpY0NsaWVudE1heEFnZSA9IHRoaXMucHJvcHMuY2FjaGVQb2xpY2llcz8uc3RhdGljQ2xpZW50TWF4QWdlRGVmYXVsdCB8fCBERUZBVUxUX1NUQVRJQ19NQVhfQUdFO1xuICAgIC8vIFRPRE86IHJlbW92ZSB0aGlzIHJlc3BvbnNlIGhlYWRlcnMgcG9saWN5IG9uY2UgUzMgZmlsZXMgaGF2ZSBjb3JyZWN0IGNhY2hlIGNvbnRyb2wgaGVhZGVycyB3aXRoIG5ldyBhc3NldCBkZXBsb3ltZW50IHRlY2huaXF1ZVxuICAgIGNvbnN0IHJlc3BvbnNlSGVhZGVyc1BvbGljeSA9IG5ldyBSZXNwb25zZUhlYWRlcnNQb2xpY3kodGhpcywgJ1N0YXRpY1Jlc3BvbnNlSGVhZGVyc1BvbGljeScsIHtcbiAgICAgIC8vIGFkZCBkZWZhdWx0IGhlYWRlciBmb3Igc3RhdGljIGFzc2V0c1xuICAgICAgY3VzdG9tSGVhZGVyc0JlaGF2aW9yOiB7XG4gICAgICAgIGN1c3RvbUhlYWRlcnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBoZWFkZXI6ICdjYWNoZS1jb250cm9sJyxcbiAgICAgICAgICAgIG92ZXJyaWRlOiBmYWxzZSxcbiAgICAgICAgICAgIC8vIGJ5IGRlZmF1bHQgdGVsbCBicm93c2VyIHRvIGNhY2hlIHN0YXRpYyBmaWxlcyBmb3IgdGhpcyBsb25nXG4gICAgICAgICAgICAvLyB0aGlzIGlzIHNlcGFyYXRlIGZyb20gdGhlIG9yaWdpbiBjYWNoZSBwb2xpY3lcbiAgICAgICAgICAgIHZhbHVlOiBgcHVibGljLG1heC1hZ2U9JHtzdGF0aWNDbGllbnRNYXhBZ2V9LGltbXV0YWJsZWAsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgY29uc3QgY2FjaGVQb2xpY3kgPSB0aGlzLnByb3BzLmNhY2hlUG9saWNpZXM/LnN0YXRpY0NhY2hlUG9saWN5ID8/IGNsb3VkZnJvbnQuQ2FjaGVQb2xpY3kuQ0FDSElOR19PUFRJTUlaRUQ7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLnRoaXMuY29tbW9uQmVoYXZpb3JPcHRpb25zLFxuICAgICAgb3JpZ2luOiB0aGlzLnMzT3JpZ2luLFxuICAgICAgYWxsb3dlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQWxsb3dlZE1ldGhvZHMuQUxMT1dfR0VUX0hFQURfT1BUSU9OUyxcbiAgICAgIGNhY2hlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQ2FjaGVkTWV0aG9kcy5DQUNIRV9HRVRfSEVBRF9PUFRJT05TLFxuICAgICAgY2FjaGVQb2xpY3ksXG4gICAgICByZXNwb25zZUhlYWRlcnNQb2xpY3ksXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0IGZuVXJsQXV0aFR5cGUoKTogbGFtYmRhLkZ1bmN0aW9uVXJsQXV0aFR5cGUge1xuICAgIHJldHVybiB0aGlzLnByb3BzLmZ1bmN0aW9uVXJsQXV0aFR5cGUgfHwgbGFtYmRhLkZ1bmN0aW9uVXJsQXV0aFR5cGUuTk9ORTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPbmNlIENsb3VkRnJvbnQgT0FDIGlzIHJlbGVhc2VkLCByZW1vdmUgdGhpcyB0byByZWR1Y2UgbGF0ZW5jeS5cbiAgICovXG4gIHByaXZhdGUgY3JlYXRlRWRnZUxhbWJkYSgpOiBjbG91ZGZyb250LkVkZ2VMYW1iZGEge1xuICAgIGNvbnN0IHNpZ25GblVybERpciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLicsICdhc3NldHMnLCAnbGFtYmRhcycsICdzaWduLWZuLXVybCcpO1xuICAgIGNvbnN0IG9yaWdpblJlcXVlc3RFZGdlRm4gPSBuZXcgY2xvdWRmcm9udC5leHBlcmltZW50YWwuRWRnZUZ1bmN0aW9uKHRoaXMsICdFZGdlRm4nLCB7XG4gICAgICBydW50aW1lOiBSdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHNpZ25GblVybERpciksXG4gICAgICBjdXJyZW50VmVyc2lvbk9wdGlvbnM6IHtcbiAgICAgICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLCAvLyBkZXN0cm95IG9sZCB2ZXJzaW9uc1xuICAgICAgICByZXRyeUF0dGVtcHRzOiAxLCAvLyBhc3luYyByZXRyeSBhdHRlbXB0c1xuICAgICAgfSxcbiAgICB9KTtcbiAgICBvcmlnaW5SZXF1ZXN0RWRnZUZuLmN1cnJlbnRWZXJzaW9uLmdyYW50SW52b2tlKG5ldyBTZXJ2aWNlUHJpbmNpcGFsKCdlZGdlbGFtYmRhLmFtYXpvbmF3cy5jb20nKSk7XG4gICAgb3JpZ2luUmVxdWVzdEVkZ2VGbi5jdXJyZW50VmVyc2lvbi5ncmFudEludm9rZShuZXcgU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSk7XG4gICAgb3JpZ2luUmVxdWVzdEVkZ2VGbi5hZGRUb1JvbGVQb2xpY3koXG4gICAgICBuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgYWN0aW9uczogWydsYW1iZGE6SW52b2tlRnVuY3Rpb25VcmwnXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbdGhpcy5wcm9wcy5zZXJ2ZXJGdW5jdGlvbi5mdW5jdGlvbkFybiwgdGhpcy5wcm9wcy5pbWFnZU9wdEZ1bmN0aW9uLmZ1bmN0aW9uQXJuXSxcbiAgICAgIH0pXG4gICAgKTtcbiAgICBjb25zdCBvcmlnaW5SZXF1ZXN0RWRnZUZuVmVyc2lvbiA9IGxhbWJkYS5WZXJzaW9uLmZyb21WZXJzaW9uQXJuKFxuICAgICAgdGhpcyxcbiAgICAgICdWZXJzaW9uJyxcbiAgICAgIG9yaWdpblJlcXVlc3RFZGdlRm4uY3VycmVudFZlcnNpb24uZnVuY3Rpb25Bcm5cbiAgICApO1xuICAgIHJldHVybiB7XG4gICAgICBldmVudFR5cGU6IGNsb3VkZnJvbnQuTGFtYmRhRWRnZUV2ZW50VHlwZS5PUklHSU5fUkVRVUVTVCxcbiAgICAgIGZ1bmN0aW9uVmVyc2lvbjogb3JpZ2luUmVxdWVzdEVkZ2VGblZlcnNpb24sXG4gICAgICBpbmNsdWRlQm9keTogdHJ1ZSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVTZXJ2ZXJCZWhhdmlvck9wdGlvbnMoKTogY2xvdWRmcm9udC5CZWhhdmlvck9wdGlvbnMge1xuICAgIGNvbnN0IGZuVXJsID0gdGhpcy5wcm9wcy5zZXJ2ZXJGdW5jdGlvbi5hZGRGdW5jdGlvblVybCh7IGF1dGhUeXBlOiB0aGlzLmZuVXJsQXV0aFR5cGUgfSk7XG4gICAgY29uc3Qgb3JpZ2luID0gbmV3IG9yaWdpbnMuSHR0cE9yaWdpbihGbi5wYXJzZURvbWFpbk5hbWUoZm5VcmwudXJsKSk7XG4gICAgY29uc3Qgb3JpZ2luUmVxdWVzdFBvbGljeSA9XG4gICAgICB0aGlzLnByb3BzLm9yaWdpblJlcXVlc3RQb2xpY2llcz8uc2VydmVyT3JpZ2luUmVxdWVzdFBvbGljeSA/P1xuICAgICAgY2xvdWRmcm9udC5PcmlnaW5SZXF1ZXN0UG9saWN5LkFMTF9WSUVXRVJfRVhDRVBUX0hPU1RfSEVBREVSO1xuICAgIGNvbnN0IGNhY2hlUG9saWN5ID1cbiAgICAgIHRoaXMucHJvcHMuY2FjaGVQb2xpY2llcz8uc2VydmVyQ2FjaGVQb2xpY3kgPz9cbiAgICAgIG5ldyBjbG91ZGZyb250LkNhY2hlUG9saWN5KHRoaXMsICdTZXJ2ZXJDYWNoZVBvbGljeScsIE5leHRqc0Rpc3RyaWJ1dGlvbi5zZXJ2ZXJDYWNoZVBvbGljeVByb3BzKTtcbiAgICByZXR1cm4ge1xuICAgICAgLi4udGhpcy5jb21tb25CZWhhdmlvck9wdGlvbnMsXG4gICAgICBvcmlnaW4sXG4gICAgICBhbGxvd2VkTWV0aG9kczogY2xvdWRmcm9udC5BbGxvd2VkTWV0aG9kcy5BTExPV19BTEwsXG4gICAgICBvcmlnaW5SZXF1ZXN0UG9saWN5LFxuICAgICAgY2FjaGVQb2xpY3ksXG4gICAgICBlZGdlTGFtYmRhczogdGhpcy5lZGdlTGFtYmRhcy5sZW5ndGggPyB0aGlzLmVkZ2VMYW1iZGFzIDogdW5kZWZpbmVkLFxuICAgICAgZnVuY3Rpb25Bc3NvY2lhdGlvbnM6IHRoaXMuY3JlYXRlQ2xvdWRGcm9udEZuQXNzb2NpYXRpb25zKCksXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiB0aGlzIGRvZXNuJ3QgcnVuLCB0aGVuIE5leHQuanMgU2VydmVyJ3MgYHJlcXVlc3QudXJsYCB3aWxsIGJlIExhbWJkYSBGdW5jdGlvblxuICAgKiBVUkwgaW5zdGVhZCBvZiBkb21haW5cbiAgICovXG4gIHByaXZhdGUgY3JlYXRlQ2xvdWRGcm9udEZuQXNzb2NpYXRpb25zKCkge1xuICAgIGNvbnN0IGNsb3VkRnJvbnRGbiA9IG5ldyBjbG91ZGZyb250LkZ1bmN0aW9uKHRoaXMsICdDbG91ZEZyb250Rm4nLCB7XG4gICAgICBjb2RlOiBjbG91ZGZyb250LkZ1bmN0aW9uQ29kZS5mcm9tSW5saW5lKGBcbiAgICAgIGZ1bmN0aW9uIGhhbmRsZXIoZXZlbnQpIHtcbiAgICAgICAgdmFyIHJlcXVlc3QgPSBldmVudC5yZXF1ZXN0O1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnNbXCJ4LWZvcndhcmRlZC1ob3N0XCJdID0gcmVxdWVzdC5oZWFkZXJzLmhvc3Q7XG4gICAgICAgIHJldHVybiByZXF1ZXN0O1xuICAgICAgfVxuICAgICAgYCksXG4gICAgfSk7XG4gICAgcmV0dXJuIFt7IGV2ZW50VHlwZTogY2xvdWRmcm9udC5GdW5jdGlvbkV2ZW50VHlwZS5WSUVXRVJfUkVRVUVTVCwgZnVuY3Rpb246IGNsb3VkRnJvbnRGbiB9XTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlSW1hZ2VCZWhhdmlvck9wdGlvbnMoKTogY2xvdWRmcm9udC5CZWhhdmlvck9wdGlvbnMge1xuICAgIGNvbnN0IGltYWdlT3B0Rm5VcmwgPSB0aGlzLnByb3BzLmltYWdlT3B0RnVuY3Rpb24uYWRkRnVuY3Rpb25VcmwoeyBhdXRoVHlwZTogdGhpcy5mblVybEF1dGhUeXBlIH0pO1xuICAgIGNvbnN0IG9yaWdpbiA9IG5ldyBvcmlnaW5zLkh0dHBPcmlnaW4oRm4ucGFyc2VEb21haW5OYW1lKGltYWdlT3B0Rm5VcmwudXJsKSk7XG4gICAgY29uc3Qgb3JpZ2luUmVxdWVzdFBvbGljeSA9XG4gICAgICB0aGlzLnByb3BzLm9yaWdpblJlcXVlc3RQb2xpY2llcz8uaW1hZ2VPcHRpbWl6YXRpb25PcmlnaW5SZXF1ZXN0UG9saWN5ID8/XG4gICAgICBjbG91ZGZyb250Lk9yaWdpblJlcXVlc3RQb2xpY3kuQUxMX1ZJRVdFUl9FWENFUFRfSE9TVF9IRUFERVI7XG4gICAgY29uc3QgY2FjaGVQb2xpY3kgPVxuICAgICAgdGhpcy5wcm9wcy5jYWNoZVBvbGljaWVzPy5pbWFnZUNhY2hlUG9saWN5ID8/XG4gICAgICBuZXcgY2xvdWRmcm9udC5DYWNoZVBvbGljeSh0aGlzLCAnSW1hZ2VDYWNoZVBvbGljeScsIE5leHRqc0Rpc3RyaWJ1dGlvbi5pbWFnZUNhY2hlUG9saWN5UHJvcHMpO1xuICAgIHJldHVybiB7XG4gICAgICAuLi50aGlzLmNvbW1vbkJlaGF2aW9yT3B0aW9ucyxcbiAgICAgIG9yaWdpbixcbiAgICAgIGFsbG93ZWRNZXRob2RzOiBjbG91ZGZyb250LkFsbG93ZWRNZXRob2RzLkFMTE9XX0dFVF9IRUFEX09QVElPTlMsXG4gICAgICBjYWNoZWRNZXRob2RzOiBjbG91ZGZyb250LkNhY2hlZE1ldGhvZHMuQ0FDSEVfR0VUX0hFQURfT1BUSU9OUyxcbiAgICAgIGNhY2hlUG9saWN5LFxuICAgICAgb3JpZ2luUmVxdWVzdFBvbGljeSxcbiAgICAgIGVkZ2VMYW1iZGFzOiB0aGlzLmVkZ2VMYW1iZGFzLFxuICAgIH07XG4gIH1cblxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gQ2xvdWRGcm9udCBEaXN0cmlidXRpb25cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgcHJpdmF0ZSBjcmVhdGVDbG91ZEZyb250RGlzdHJpYnV0aW9uKCk6IGNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uIHtcbiAgICBjb25zdCB7IGNkazogY2RrUHJvcHMgfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3QgY2ZEaXN0cmlidXRpb25Qcm9wcyA9IGNka1Byb3BzPy5kaXN0cmlidXRpb247XG5cbiAgICAvLyBidWlsZCBkb21haW5OYW1lc1xuICAgIGNvbnN0IGRvbWFpbk5hbWVzID0gdGhpcy5idWlsZERpc3RyaWJ1dGlvbkRvbWFpbk5hbWVzKCk7XG5cbiAgICAvLyBpZiB3ZSBkb24ndCBoYXZlIGEgc3RhdGljIGZpbGUgY2FsbGVkIGluZGV4Lmh0bWwgdGhlbiB3ZSBzaG91bGRcbiAgICAvLyByZWRpcmVjdCB0byB0aGUgbGFtYmRhIGhhbmRsZXJcbiAgICBjb25zdCBoYXNJbmRleEh0bWwgPSB0aGlzLnByb3BzLm5leHRCdWlsZC5yZWFkUHVibGljRmlsZUxpc3QoKS5pbmNsdWRlcygnaW5kZXguaHRtbCcpO1xuXG4gICAgY29uc3QgZGlzdHJpYnV0aW9uID0gbmV3IGNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uKHRoaXMsICdEaXN0cmlidXRpb24nLCB7XG4gICAgICAvLyBkZWZhdWx0Um9vdE9iamVjdDogXCJpbmRleC5odG1sXCIsXG4gICAgICBkZWZhdWx0Um9vdE9iamVjdDogJycsXG4gICAgICBtaW5pbXVtUHJvdG9jb2xWZXJzaW9uOiBjbG91ZGZyb250LlNlY3VyaXR5UG9saWN5UHJvdG9jb2wuVExTX1YxXzJfMjAyMSxcblxuICAgICAgLy8gT3ZlcnJpZGUgcHJvcHMuXG4gICAgICAuLi5jZkRpc3RyaWJ1dGlvblByb3BzLFxuXG4gICAgICAvLyB0aGVzZSB2YWx1ZXMgY2FuIE5PVCBiZSBvdmVyd3JpdHRlbiBieSBjZkRpc3RyaWJ1dGlvblByb3BzXG4gICAgICBkb21haW5OYW1lcyxcbiAgICAgIGNlcnRpZmljYXRlOiB0aGlzLmNlcnRpZmljYXRlLFxuICAgICAgZGVmYXVsdEJlaGF2aW9yOiB0aGlzLnNlcnZlckJlaGF2aW9yT3B0aW9ucyxcblxuICAgICAgYWRkaXRpb25hbEJlaGF2aW9yczoge1xuICAgICAgICAvLyBpcyBpbmRleC5odG1sIHN0YXRpYyBvciBkeW5hbWljP1xuICAgICAgICAuLi4oaGFzSW5kZXhIdG1sID8ge30gOiB7ICcvJzogdGhpcy5zZXJ2ZXJCZWhhdmlvck9wdGlvbnMgfSksXG5cbiAgICAgICAgLy8ga25vd24gZHluYW1pYyByb3V0ZXNcbiAgICAgICAgJ2FwaS8qJzogdGhpcy5zZXJ2ZXJCZWhhdmlvck9wdGlvbnMsXG4gICAgICAgICdfbmV4dC9kYXRhLyonOiB0aGlzLnNlcnZlckJlaGF2aW9yT3B0aW9ucyxcblxuICAgICAgICAvLyBkeW5hbWljIGltYWdlcyBnbyB0byBsYW1iZGFcbiAgICAgICAgJ19uZXh0L2ltYWdlKic6IHRoaXMuaW1hZ2VCZWhhdmlvck9wdGlvbnMsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIHJldHVybiBkaXN0cmlidXRpb247XG4gIH1cblxuICBwcml2YXRlIGFkZFN0YXRpY0JlaGF2aW9yc1RvRGlzdHJpYnV0aW9uKCkge1xuICAgIGNvbnN0IHB1YmxpY0ZpbGVzID0gZnMucmVhZGRpclN5bmMocGF0aC5qb2luKHRoaXMucHJvcHMubmV4dGpzUGF0aCwgTkVYVEpTX0JVSUxEX0RJUiwgTkVYVEpTX1NUQVRJQ19ESVIpLCB7XG4gICAgICB3aXRoRmlsZVR5cGVzOiB0cnVlLFxuICAgIH0pO1xuICAgIGlmIChwdWJsaWNGaWxlcy5sZW5ndGggPj0gMjUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYFRvbyBtYW55IHB1YmxpYy8gZmlsZXMgaW4gTmV4dC5qcyBidWlsZC4gQ2xvdWRGcm9udCBsaW1pdHMgRGlzdHJpYnV0aW9ucyB0byAyNSBDYWNoZSBCZWhhdmlvcnMuIFNlZSBkb2N1bWVudGVkIGxpbWl0IGhlcmU6IGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9BbWF6b25DbG91ZEZyb250L2xhdGVzdC9EZXZlbG9wZXJHdWlkZS9jbG91ZGZyb250LWxpbWl0cy5odG1sI2xpbWl0cy13ZWItZGlzdHJpYnV0aW9uc2BcbiAgICAgICk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgcHVibGljRmlsZSBvZiBwdWJsaWNGaWxlcykge1xuICAgICAgY29uc3QgcGF0aFBhdHRlcm4gPSBwdWJsaWNGaWxlLmlzRGlyZWN0b3J5KCkgPyBgJHtwdWJsaWNGaWxlLm5hbWV9LypgIDogcHVibGljRmlsZS5uYW1lO1xuICAgICAgaWYgKCEvXlthLXpBLVowLTlfXFwtXFwuXFwqXFwkL35cIidAOis/Jl0rJC8udGVzdChwYXRoUGF0dGVybikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBJbnZhbGlkIENsb3VkRnJvbnQgRGlzdHJpYnV0aW9uIENhY2hlIEJlaGF2aW9yIFBhdGggUGF0dGVybjogJHtwYXRoUGF0dGVybn0uIFBsZWFzZSBzZWUgZG9jdW1lbnRhdGlvbiBoZXJlOiBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vQW1hem9uQ2xvdWRGcm9udC9sYXRlc3QvRGV2ZWxvcGVyR3VpZGUvZGlzdHJpYnV0aW9uLXdlYi12YWx1ZXMtc3BlY2lmeS5odG1sI0Rvd25sb2FkRGlzdFZhbHVlc1BhdGhQYXR0ZXJuYFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgdGhpcy5kaXN0cmlidXRpb24uYWRkQmVoYXZpb3IocGF0aFBhdHRlcm4sIHRoaXMuczNPcmlnaW4sIHRoaXMuc3RhdGljQmVoYXZpb3JPcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkRGlzdHJpYnV0aW9uRG9tYWluTmFtZXMoKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGN1c3RvbURvbWFpbiA9XG4gICAgICB0eXBlb2YgdGhpcy5wcm9wcy5jdXN0b21Eb21haW4gPT09ICdzdHJpbmcnID8gdGhpcy5wcm9wcy5jdXN0b21Eb21haW4gOiB0aGlzLnByb3BzLmN1c3RvbURvbWFpbj8uZG9tYWluTmFtZTtcblxuICAgIGNvbnN0IGFsdGVybmF0ZU5hbWVzID1cbiAgICAgIHR5cGVvZiB0aGlzLnByb3BzLmN1c3RvbURvbWFpbiA9PT0gJ3N0cmluZycgPyBbXSA6IHRoaXMucHJvcHMuY3VzdG9tRG9tYWluPy5hbHRlcm5hdGVOYW1lcyB8fCBbXTtcblxuICAgIHJldHVybiBjdXN0b21Eb21haW4gPyBbY3VzdG9tRG9tYWluLCAuLi5hbHRlcm5hdGVOYW1lc10gOiBbXTtcbiAgfVxuXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAvLyBDdXN0b20gRG9tYWluXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gIHByb3RlY3RlZCB2YWxpZGF0ZUN1c3RvbURvbWFpblNldHRpbmdzKCkge1xuICAgIGNvbnN0IHsgY3VzdG9tRG9tYWluIH0gPSB0aGlzLnByb3BzO1xuXG4gICAgaWYgKCFjdXN0b21Eb21haW4pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGN1c3RvbURvbWFpbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoY3VzdG9tRG9tYWluLmlzRXh0ZXJuYWxEb21haW4gPT09IHRydWUpIHtcbiAgICAgIGlmICghY3VzdG9tRG9tYWluLmNlcnRpZmljYXRlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQSB2YWxpZCBjZXJ0aWZpY2F0ZSBpcyByZXF1aXJlZCB3aGVuIFwiaXNFeHRlcm5hbERvbWFpblwiIGlzIHNldCB0byBcInRydWVcIi4nKTtcbiAgICAgIH1cbiAgICAgIGlmIChjdXN0b21Eb21haW4uZG9tYWluQWxpYXMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICdEb21haW4gYWxpYXMgaXMgb25seSBzdXBwb3J0ZWQgZm9yIGRvbWFpbnMgaG9zdGVkIG9uIEFtYXpvbiBSb3V0ZSA1My4gRG8gbm90IHNldCB0aGUgXCJjdXN0b21Eb21haW4uZG9tYWluQWxpYXNcIiB3aGVuIFwiaXNFeHRlcm5hbERvbWFpblwiIGlzIGVuYWJsZWQuJ1xuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKGN1c3RvbURvbWFpbi5ob3N0ZWRab25lKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnSG9zdGVkIHpvbmVzIGNhbiBvbmx5IGJlIGNvbmZpZ3VyZWQgZm9yIGRvbWFpbnMgaG9zdGVkIG9uIEFtYXpvbiBSb3V0ZSA1My4gRG8gbm90IHNldCB0aGUgXCJjdXN0b21Eb21haW4uaG9zdGVkWm9uZVwiIHdoZW4gXCJpc0V4dGVybmFsRG9tYWluXCIgaXMgZW5hYmxlZC4nXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIGxvb2t1cEhvc3RlZFpvbmUoKTogcm91dGU1My5JSG9zdGVkWm9uZSB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgeyBjdXN0b21Eb21haW4gfSA9IHRoaXMucHJvcHM7XG5cbiAgICAvLyBTa2lwIGlmIGN1c3RvbURvbWFpbiBpcyBub3QgY29uZmlndXJlZFxuICAgIGlmICghY3VzdG9tRG9tYWluKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGhvc3RlZFpvbmU7XG5cbiAgICBpZiAodHlwZW9mIGN1c3RvbURvbWFpbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGhvc3RlZFpvbmUgPSByb3V0ZTUzLkhvc3RlZFpvbmUuZnJvbUxvb2t1cCh0aGlzLCAnSG9zdGVkWm9uZScsIHtcbiAgICAgICAgZG9tYWluTmFtZTogY3VzdG9tRG9tYWluLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgY3VzdG9tRG9tYWluLmhvc3RlZFpvbmUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBob3N0ZWRab25lID0gcm91dGU1My5Ib3N0ZWRab25lLmZyb21Mb29rdXAodGhpcywgJ0hvc3RlZFpvbmUnLCB7XG4gICAgICAgIGRvbWFpbk5hbWU6IGN1c3RvbURvbWFpbi5ob3N0ZWRab25lLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChjdXN0b21Eb21haW4uaG9zdGVkWm9uZSkge1xuICAgICAgaG9zdGVkWm9uZSA9IGN1c3RvbURvbWFpbi5ob3N0ZWRab25lO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGN1c3RvbURvbWFpbi5kb21haW5OYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgLy8gU2tpcCBpZiBkb21haW4gaXMgbm90IGEgUm91dGU1MyBkb21haW5cbiAgICAgIGlmIChjdXN0b21Eb21haW4uaXNFeHRlcm5hbERvbWFpbiA9PT0gdHJ1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGhvc3RlZFpvbmUgPSByb3V0ZTUzLkhvc3RlZFpvbmUuZnJvbUxvb2t1cCh0aGlzLCAnSG9zdGVkWm9uZScsIHtcbiAgICAgICAgZG9tYWluTmFtZTogY3VzdG9tRG9tYWluLmRvbWFpbk5hbWUsXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaG9zdGVkWm9uZSA9IGN1c3RvbURvbWFpbi5ob3N0ZWRab25lO1xuICAgIH1cblxuICAgIHJldHVybiBob3N0ZWRab25lO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVDZXJ0aWZpY2F0ZSgpOiBhY20uSUNlcnRpZmljYXRlIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCB7IGN1c3RvbURvbWFpbiB9ID0gdGhpcy5wcm9wcztcblxuICAgIGlmICghY3VzdG9tRG9tYWluKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGFjbUNlcnRpZmljYXRlO1xuXG4gICAgLy8gSG9zdGVkWm9uZSBpcyBzZXQgZm9yIFJvdXRlIDUzIGRvbWFpbnNcbiAgICBpZiAodGhpcy5ob3N0ZWRab25lKSB7XG4gICAgICBpZiAodHlwZW9mIGN1c3RvbURvbWFpbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgYWNtQ2VydGlmaWNhdGUgPSBuZXcgYWNtLkRuc1ZhbGlkYXRlZENlcnRpZmljYXRlKHRoaXMsICdDZXJ0aWZpY2F0ZScsIHtcbiAgICAgICAgICBkb21haW5OYW1lOiBjdXN0b21Eb21haW4sXG4gICAgICAgICAgaG9zdGVkWm9uZTogdGhpcy5ob3N0ZWRab25lLFxuICAgICAgICAgIHJlZ2lvbjogJ3VzLWVhc3QtMScsXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmIChjdXN0b21Eb21haW4uY2VydGlmaWNhdGUpIHtcbiAgICAgICAgYWNtQ2VydGlmaWNhdGUgPSBjdXN0b21Eb21haW4uY2VydGlmaWNhdGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhY21DZXJ0aWZpY2F0ZSA9IG5ldyBhY20uRG5zVmFsaWRhdGVkQ2VydGlmaWNhdGUodGhpcywgJ0NlcnRpZmljYXRlJywge1xuICAgICAgICAgIGRvbWFpbk5hbWU6IGN1c3RvbURvbWFpbi5kb21haW5OYW1lLFxuICAgICAgICAgIGhvc3RlZFpvbmU6IHRoaXMuaG9zdGVkWm9uZSxcbiAgICAgICAgICByZWdpb246ICd1cy1lYXN0LTEnLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gSG9zdGVkWm9uZSBpcyBOT1Qgc2V0IGZvciBub24tUm91dGUgNTMgZG9tYWluc1xuICAgIGVsc2Uge1xuICAgICAgaWYgKHR5cGVvZiBjdXN0b21Eb21haW4gIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGFjbUNlcnRpZmljYXRlID0gY3VzdG9tRG9tYWluLmNlcnRpZmljYXRlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBhY21DZXJ0aWZpY2F0ZTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlUm91dGU1M1JlY29yZHMoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjdXN0b21Eb21haW4gfSA9IHRoaXMucHJvcHM7XG5cbiAgICBpZiAoIWN1c3RvbURvbWFpbiB8fCAhdGhpcy5ob3N0ZWRab25lKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IHJlY29yZE5hbWU7XG4gICAgbGV0IGRvbWFpbkFsaWFzO1xuICAgIGlmICh0eXBlb2YgY3VzdG9tRG9tYWluID09PSAnc3RyaW5nJykge1xuICAgICAgcmVjb3JkTmFtZSA9IGN1c3RvbURvbWFpbjtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVjb3JkTmFtZSA9IGN1c3RvbURvbWFpbi5kb21haW5OYW1lO1xuICAgICAgZG9tYWluQWxpYXMgPSBjdXN0b21Eb21haW4uZG9tYWluQWxpYXM7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIEROUyByZWNvcmRcbiAgICBjb25zdCByZWNvcmRQcm9wcyA9IHtcbiAgICAgIHJlY29yZE5hbWUsXG4gICAgICB6b25lOiB0aGlzLmhvc3RlZFpvbmUsXG4gICAgICB0YXJnZXQ6IHJvdXRlNTMuUmVjb3JkVGFyZ2V0LmZyb21BbGlhcyhuZXcgcm91dGU1M1RhcmdldHMuQ2xvdWRGcm9udFRhcmdldCh0aGlzLmRpc3RyaWJ1dGlvbikpLFxuICAgIH07XG4gICAgbmV3IHJvdXRlNTMuQVJlY29yZCh0aGlzLCAnQWxpYXNSZWNvcmQnLCByZWNvcmRQcm9wcyk7XG4gICAgbmV3IHJvdXRlNTMuQWFhYVJlY29yZCh0aGlzLCAnQWxpYXNSZWNvcmRBQUFBJywgcmVjb3JkUHJvcHMpO1xuXG4gICAgLy8gQ3JlYXRlIEFsaWFzIHJlZGlyZWN0IHJlY29yZFxuICAgIGlmIChkb21haW5BbGlhcykge1xuICAgICAgbmV3IHJvdXRlNTNQYXR0ZXJucy5IdHRwc1JlZGlyZWN0KHRoaXMsICdSZWRpcmVjdCcsIHtcbiAgICAgICAgem9uZTogdGhpcy5ob3N0ZWRab25lLFxuICAgICAgICByZWNvcmROYW1lczogW2RvbWFpbkFsaWFzXSxcbiAgICAgICAgdGFyZ2V0RG9tYWluOiByZWNvcmROYW1lLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG4iXX0=