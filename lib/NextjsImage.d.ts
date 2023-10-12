import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { NextjsBaseProps } from './NextjsBase';
import type { NextjsBuild } from './NextjsBuild';
export interface NextjsImageProps extends NextjsBaseProps {
    /**
     * The S3 bucket holding application images.
     */
    readonly bucket: IBucket;
    /**
     * Override function properties.
     */
    readonly lambdaOptions?: NodejsFunctionProps;
    /**
     * The `NextjsBuild` instance representing the built Nextjs application.
     */
    readonly nextBuild: NextjsBuild;
}
/**
 * This lambda handles image optimization.
 */
export declare class NextjsImage extends NodejsFunction {
    constructor(scope: Construct, id: string, props: NextjsImageProps);
}
