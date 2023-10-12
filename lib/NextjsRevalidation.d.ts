import { FunctionOptions } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { NextjsBaseProps } from './NextjsBase';
import { NextjsBuild } from './NextjsBuild';
import { NextjsServer } from './NextjsServer';
export interface NextjsRevalidationProps extends NextjsBaseProps {
    /**
     * Override function properties.
     */
    readonly lambdaOptions?: FunctionOptions;
    /**
     * The `NextjsBuild` instance representing the built Nextjs application.
     */
    readonly nextBuild: NextjsBuild;
    /**
     * The main NextJS server handler lambda function.
     */
    readonly serverFunction: NextjsServer;
}
/**
 * Builds the system for revalidating Next.js resources. This includes a Lambda function handler and queue system.
 *
 * @see {@link https://github.com/serverless-stack/open-next/blob/main/README.md?plain=1#L65}
 *
 */
export declare class NextjsRevalidation extends Construct {
    queue: Queue;
    function: NodejsFunction;
    private props;
    constructor(scope: Construct, id: string, props: NextjsRevalidationProps);
    private createQueue;
    private createFunction;
}
