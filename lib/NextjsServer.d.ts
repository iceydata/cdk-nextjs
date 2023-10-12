import { Function, FunctionOptions } from 'aws-cdk-lib/aws-lambda';
import { Bucket, IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { NextjsBaseProps } from './NextjsBase';
import { NextjsBuild } from './NextjsBuild';
export type EnvironmentVars = Record<string, string>;
export interface NextjsServerProps extends NextjsBaseProps {
    /**
     * Built nextJS application.
     */
    readonly nextBuild: NextjsBuild;
    /**
     * Override function properties.
     */
    readonly lambda?: FunctionOptions;
    /**
     * Static asset bucket. Function needs bucket to read from cache.
     */
    readonly staticAssetBucket: IBucket;
}
/**
 * Build a lambda function from a NextJS application to handle server-side rendering, API routes, and image optimization.
 */
export declare class NextjsServer extends Construct {
    configBucket?: Bucket;
    lambdaFunction: Function;
    private props;
    private get environment();
    constructor(scope: Construct, id: string, props: NextjsServerProps);
    private createSourceCodeAsset;
    private createDestinationCodeAsset;
    private createBucketDeployment;
    private createFunction;
}
