import { IDistribution } from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
export interface NextjsInvalidationProps {
    /**
     * CloudFront Distribution to invalidate
     */
    readonly distribution: IDistribution;
    /**
     * Constructs that should complete before invalidating CloudFront Distribution.
     *
     * Useful for assets that must be deployed/updated before invalidating.
     */
    readonly dependencies: Construct[];
}
export declare class NextjsInvalidation extends Construct {
    constructor(scope: Construct, id: string, props: NextjsInvalidationProps);
}
