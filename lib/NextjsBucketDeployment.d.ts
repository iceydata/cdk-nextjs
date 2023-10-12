import { Function } from 'aws-cdk-lib/aws-lambda';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { Construct } from 'constructs';
export interface NextjsBucketDeploymentProps {
    /**
     * Source `Asset`
     */
    readonly asset: Asset;
    /**
     * Enable verbose output of Custom Resource Lambda
     * @default false
     */
    readonly debug?: boolean | undefined;
    /**
     * If `true`, then delete files in `destinationBucket`/`destinationKeyPrefix`
     * before uploading new objects
     * @default true
     */
    readonly prune?: boolean | undefined;
    /**
     * Mapping of files to PUT options for `PutObjectCommand`. Keys of
     * record must be a glob pattern (uses micromatch). Values of record are options
     * for PUT command for AWS SDK JS V3. See [here](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-s3/Interface/PutObjectRequest/)
     * for options. If a file matches multiple globs, configuration will be
     * merged. Later entries override earlier entries.
     *
     * `Bucket`, `Key`, and `Body` PUT options cannot be set.
     */
    readonly putConfig?: Record<string, Record<string, string>>;
    /**
     * Destination S3 Bucket
     */
    readonly destinationBucket: IBucket;
    /**
     * Destination S3 Bucket Key Prefix
     */
    readonly destinationKeyPrefix?: string | undefined;
    /**
     * Replace placeholders in all files in `asset`. Placeholder targets are
     * defined by keys of record. Values to replace placeholders with are defined
     * by values of record.
     */
    readonly substitutionConfig?: Record<string, string>;
    /**
     * If `true` then files will be zipped before writing to destination bucket.
     *
     * Useful for Lambda functions.
     * @default false
     */
    readonly zip?: boolean | undefined;
}
/**
 * @internal
 */
export interface CustomResourceProperties {
    destinationBucketName: string;
    destinationKeyPrefix?: string;
    prune?: boolean | undefined;
    putConfig?: NextjsBucketDeploymentProps['putConfig'];
    substitutionConfig?: NextjsBucketDeploymentProps['substitutionConfig'];
    sourceBucketName: string;
    sourceKeyPrefix?: string | undefined;
    zip?: boolean | undefined;
}
/**
 * Similar to CDK's `BucketDeployment` construct, but with a focus on replacing
 * template placeholders (i.e. environment variables) and configuring PUT
 * options like cache control.
 */
export declare class NextjsBucketDeployment extends Construct {
    /**
     * Formats a string as a template value so custom resource knows to replace.
     */
    static getSubstitutionValue(v: string): string;
    /**
     * Creates `substitutionConfig` an object by extracting unresolved tokens.
     */
    static getSubstitutionConfig(env: Record<string, string>): Record<string, string>;
    /**
     * Lambda Function Provider for Custom Resource
     */
    function: Function;
    private props;
    constructor(scope: Construct, id: string, props: NextjsBucketDeploymentProps);
    private createFunction;
    private createCustomResource;
}
