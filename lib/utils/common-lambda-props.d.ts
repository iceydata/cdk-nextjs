import { FunctionProps } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
export declare function getCommonFunctionProps(scope: Construct): Omit<FunctionProps, 'code' | 'handler'>;
export declare function getCommonNodejsFunctionProps(scope: Construct): NodejsFunctionProps;
