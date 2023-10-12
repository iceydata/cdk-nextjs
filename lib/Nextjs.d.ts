import * as lambda from 'aws-cdk-lib/aws-lambda';
import { FunctionOptions } from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { BaseSiteDomainProps, NextjsBaseProps } from './NextjsBase';
import { NextjsBuild } from './NextjsBuild';
import { NextjsDistribution, NextjsDistributionProps } from './NextjsDistribution';
import { NextjsImage } from './NextjsImage';
import { NextjsRevalidation } from './NextjsRevalidation';
import { NextjsServer } from './NextjsServer';
import { NextjsStaticAssets, NextjsStaticAssetsProps } from './NextjsStaticAssets';
export interface NextjsDomainProps extends BaseSiteDomainProps {
}
/**
 * Defaults for created resources.
 * Why `any`? see https://github.com/aws/jsii/issues/2901
 */
export interface NextjsDefaultsProps {
    /**
     * Override static file deployment settings.
     */
    readonly assetDeployment?: NextjsStaticAssetsProps | any;
    /**
     * Override server lambda function settings.
     */
    readonly lambda?: FunctionOptions;
    /**
     * Override CloudFront distribution settings.
     *
     * These properties should all be optional but cannot be due to a limitation in jsii.
     */
    readonly distribution?: NextjsDistributionProps | any;
}
export interface NextjsProps extends NextjsBaseProps {
    /**
     * Optional S3 Bucket to use, defaults to assets bucket
     */
    readonly imageOptimizationBucket?: s3.IBucket;
    /**
     * Allows you to override defaults for the resources created by this
     * construct.
     */
    readonly defaults?: NextjsDefaultsProps;
    /**
     * Skips running Next.js build. Useful if you want to deploy `Nextjs` but
     * haven't made any changes to Next.js app code.
     * @default false
     */
    readonly skipBuild?: boolean;
}
/**
 * The `Nextjs` construct is a higher level construct that makes it easy to create a NextJS app.
 *
 * Your standalone server application will be bundled using o(utput tracing and will be deployed to a Lambda function.
 * Static assets will be deployed to an S3 bucket and served via CloudFront.
 * You must use Next.js 10.3.0 or newer.
 *
 * Please provide a `nextjsPath` to the Next.js app inside your project.
 *
 * @example
 * new Nextjs(this, "Web", {
 *   nextjsPath: path.resolve("packages/web"),
 * })
 */
export declare class Nextjs extends Construct {
    protected props: NextjsProps;
    /**
     * The main NextJS server handler lambda function.
     */
    serverFunction: NextjsServer;
    /**
     * The image optimization handler lambda function.
     */
    imageOptimizationFunction: NextjsImage;
    /**
     * Built NextJS project output.
     */
    nextBuild: NextjsBuild;
    /**
     * Asset deployment to S3.
     */
    staticAssets: NextjsStaticAssets;
    /**
     * CloudFront distribution.
     */
    distribution: NextjsDistribution;
    /**
     * Where build-time assets for deployment are stored.
     */
    get tempBuildDir(): string;
    /**
     * Revalidation handler and queue.
     */
    revalidation: NextjsRevalidation;
    lambdaFunctionUrl: lambda.FunctionUrl;
    imageOptimizationLambdaFunctionUrl: lambda.FunctionUrl;
    constructor(scope: Construct, id: string, props: NextjsProps);
    /**
     * URL of Next.js App.
     */
    get url(): string;
    /**
     * Convenience method to access `Nextjs.staticAssets.bucket`.
     */
    get bucket(): s3.IBucket;
}
