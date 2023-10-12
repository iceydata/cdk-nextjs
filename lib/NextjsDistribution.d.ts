import { Duration } from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { BaseSiteDomainProps, NextjsBaseProps } from './NextjsBase';
import { NextjsBuild } from './NextjsBuild';
export interface NextjsDomainProps extends BaseSiteDomainProps {
}
export type NextjsDistributionCdkOverrideProps = cloudfront.DistributionProps;
export interface NextjsDistributionCdkProps {
    /**
     * Pass in a value to override the default settings this construct uses to
     * create the CloudFront `Distribution` internally.
     */
    readonly distribution?: NextjsDistributionCdkOverrideProps;
}
export interface NextjsCachePolicyProps {
    readonly staticCachePolicy?: cloudfront.ICachePolicy;
    readonly serverCachePolicy?: cloudfront.ICachePolicy;
    readonly imageCachePolicy?: cloudfront.ICachePolicy;
    /**
     * Cache-control max-age default for static assets (/_next/*).
     * Default: 30 days.
     */
    readonly staticClientMaxAgeDefault?: Duration;
}
export interface NextjsOriginRequestPolicyProps {
    readonly serverOriginRequestPolicy?: cloudfront.IOriginRequestPolicy;
    readonly imageOptimizationOriginRequestPolicy?: cloudfront.IOriginRequestPolicy;
}
export interface NextjsDistributionProps extends NextjsBaseProps {
    /**
     * Bucket containing static assets.
     * Must be provided if you want to serve static files.
     */
    readonly staticAssetsBucket: s3.IBucket;
    /**
     * Lambda function to route all non-static requests to.
     * Must be provided if you want to serve dynamic requests.
     */
    readonly serverFunction: lambda.IFunction;
    /**
     * Lambda function to optimize images.
     * Must be provided if you want to serve dynamic requests.
     */
    readonly imageOptFunction: lambda.IFunction;
    /**
     * Overrides for created CDK resources.
     */
    readonly cdk?: NextjsDistributionCdkProps;
    /**
     * Built NextJS app.
     */
    readonly nextBuild: NextjsBuild;
    /**
     * Override the default CloudFront cache policies created internally.
     */
    readonly cachePolicies?: NextjsCachePolicyProps;
    /**
     * Override the default CloudFront origin request policies created internally.
     */
    readonly originRequestPolicies?: NextjsOriginRequestPolicyProps;
    /**
     * The customDomain for this website. Supports domains that are hosted
     * either on [Route 53](https://aws.amazon.com/route53/) or externally.
     *
     * Note that you can also migrate externally hosted domains to Route 53 by
     * [following this guide](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/MigratingDNS.html).
     *
     * @example
     * new NextjsDistribution(this, "Dist", {
     *   customDomain: "domain.com",
     * });
     *
     * new NextjsDistribution(this, "Dist", {
     *   customDomain: {
     *     domainName: "domain.com",
     *     domainAlias: "www.domain.com",
     *     hostedZone: "domain.com"
     *   },
     * });
     */
    readonly customDomain?: string | NextjsDomainProps;
    /**
     * Include the name of your deployment stage if present.
     * Used to name the edge functions stack.
     * Required if using SST.
     */
    readonly stageName?: string;
    /**
     * Optional value to prefix the edge function stack
     * It defaults to "Nextjs"
     */
    readonly stackPrefix?: string;
    /**
     * Override lambda function url auth type
     * @default "NONE"
     */
    readonly functionUrlAuthType?: lambda.FunctionUrlAuthType;
}
/**
 * Create a CloudFront distribution to serve a Next.js application.
 */
export declare class NextjsDistribution extends Construct {
    /**
     * The default CloudFront cache policy properties for dynamic requests to server handler.
     */
    static serverCachePolicyProps: cloudfront.CachePolicyProps;
    /**
     * The default CloudFront Cache Policy properties for images.
     */
    static imageCachePolicyProps: cloudfront.CachePolicyProps;
    protected props: NextjsDistributionProps;
    /**
     * The internally created CloudFront `Distribution` instance.
     */
    distribution: Distribution;
    /**
     * The Route 53 hosted zone for the custom domain.
     */
    hostedZone?: route53.IHostedZone;
    /**
     * The AWS Certificate Manager certificate for the custom domain.
     */
    certificate?: acm.ICertificate;
    private commonBehaviorOptions;
    private s3Origin;
    private staticBehaviorOptions;
    private edgeLambdas;
    private serverBehaviorOptions;
    private imageBehaviorOptions;
    constructor(scope: Construct, id: string, props: NextjsDistributionProps);
    /**
     * The CloudFront URL of the website.
     */
    get url(): string;
    get customDomainName(): string | undefined;
    /**
     * If the custom domain is enabled, this is the URL of the website with the
     * custom domain.
     */
    get customDomainUrl(): string | undefined;
    /**
     * The ID of the internally created CloudFront Distribution.
     */
    get distributionId(): string;
    /**
     * The domain name of the internally created CloudFront Distribution.
     */
    get distributionDomain(): string;
    private get isFnUrlIamAuth();
    private createStaticBehaviorOptions;
    private get fnUrlAuthType();
    /**
     * Once CloudFront OAC is released, remove this to reduce latency.
     */
    private createEdgeLambda;
    private createServerBehaviorOptions;
    /**
     * If this doesn't run, then Next.js Server's `request.url` will be Lambda Function
     * URL instead of domain
     */
    private createCloudFrontFnAssociations;
    private createImageBehaviorOptions;
    private createCloudFrontDistribution;
    private addStaticBehaviorsToDistribution;
    private buildDistributionDomainNames;
    protected validateCustomDomainSettings(): void;
    protected lookupHostedZone(): route53.IHostedZone | undefined;
    private createCertificate;
    private createRoute53Records;
}
