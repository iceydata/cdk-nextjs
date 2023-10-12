import type { CloudFrontHeaders, CloudFrontRequest, CloudFrontRequestHandler } from 'aws-lambda';
/**
 * This Lambda@Edge handler fixes s3 requests, fixes the host header, and
 * signs requests as they're destined for Lambda Function URL that requires
 * IAM Auth.
 */
export declare const handler: CloudFrontRequestHandler;
/**
 * When `NextjsDistributionProps.functionUrlAuthType` is set to
 * `lambda.FunctionUrlAuthType.AWS_IAM` we need to sign the `CloudFrontRequest`s
 * with AWS IAM SigV4 so that CloudFront can invoke the Nextjs server and image
 * optimization functions via function URLs. When configured, this lambda@edge
 * function has the permission, lambda:InvokeFunctionUrl, to invoke both
 * functions.
 * @link https://medium.com/@dario_26152/restrict-access-to-lambda-functionurl-to-cloudfront-using-aws-iam-988583834705
 */
export declare function signRequest(request: CloudFrontRequest): Promise<void>;
export declare function getRegionFromLambdaUrl(url: string): string;
/**
 * Bag or Map used for HeaderBag or QueryStringParameterBag for `sigv4.sign()`
 */
type Bag = Record<string, string>;
/**
 * Converts CloudFront headers (can have array of header values) to simple
 * header bag (object) required by `sigv4.sign`
 *
 * NOTE: only includes headers allowed by origin policy to prevent signature
 * mismatch
 */
export declare function cfHeadersToHeaderBag(headers: CloudFrontHeaders): Bag;
/**
 * Converts simple header bag (object) to CloudFront headers
 */
export declare function headerBagToCfHeaders(headerBag: Bag): CloudFrontHeaders;
/**
 * Converts CloudFront querystring to QueryParamaterBag for IAM Sig V4
 */
export declare function queryStringToQueryParamBag(querystring: string): Bag;
export {};
