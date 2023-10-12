"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommonNodejsFunctionProps = exports.getCommonFunctionProps = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_lambda_1 = require("aws-cdk-lib/aws-lambda");
const aws_lambda_nodejs_1 = require("aws-cdk-lib/aws-lambda-nodejs");
const common_build_options_1 = require("./common-build-options");
function getCommonFunctionProps(scope) {
    return {
        architecture: aws_lambda_1.Architecture.ARM_64,
        /**
         * 1536mb costs 1.5x but runs twice as fast for most scenarios.
         * @see {@link https://dev.to/dashbird/4-tips-for-aws-lambda-optimization-for-production-3if1}
         */
        memorySize: 1536,
        runtime: aws_lambda_1.Runtime.NODEJS_18_X,
        timeout: aws_cdk_lib_1.Duration.seconds(10),
        // prevents "Resolution error: Cannot use resource in a cross-environment
        // fashion, the resource's physical name must be explicit set or use
        // PhysicalName.GENERATE_IF_NEEDED."
        functionName: aws_cdk_lib_1.Stack.of(scope).region !== 'us-east-1' ? aws_cdk_lib_1.PhysicalName.GENERATE_IF_NEEDED : undefined,
    };
}
exports.getCommonFunctionProps = getCommonFunctionProps;
function getCommonNodejsFunctionProps(scope) {
    return {
        ...getCommonFunctionProps(scope),
        bundling: {
            ...common_build_options_1.commonBundlingOptions,
            // https://github.com/evanw/esbuild/issues/1921
            banner: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
            format: aws_lambda_nodejs_1.OutputFormat.ESM,
        },
    };
}
exports.getCommonNodejsFunctionProps = getCommonNodejsFunctionProps;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLWxhbWJkYS1wcm9wcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9jb21tb24tbGFtYmRhLXByb3BzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZDQUE0RDtBQUM1RCx1REFBOEU7QUFDOUUscUVBQWtGO0FBRWxGLGlFQUErRDtBQUUvRCxTQUFnQixzQkFBc0IsQ0FBQyxLQUFnQjtJQUNyRCxPQUFPO1FBQ0wsWUFBWSxFQUFFLHlCQUFZLENBQUMsTUFBTTtRQUNqQzs7O1dBR0c7UUFDSCxVQUFVLEVBQUUsSUFBSTtRQUNoQixPQUFPLEVBQUUsb0JBQU8sQ0FBQyxXQUFXO1FBQzVCLE9BQU8sRUFBRSxzQkFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDN0IseUVBQXlFO1FBQ3pFLG9FQUFvRTtRQUNwRSxvQ0FBb0M7UUFDcEMsWUFBWSxFQUFFLG1CQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLDBCQUFZLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLFNBQVM7S0FDbkcsQ0FBQztBQUNKLENBQUM7QUFmRCx3REFlQztBQUVELFNBQWdCLDRCQUE0QixDQUFDLEtBQWdCO0lBQzNELE9BQU87UUFDTCxHQUFHLHNCQUFzQixDQUFDLEtBQUssQ0FBQztRQUNoQyxRQUFRLEVBQUU7WUFDUixHQUFHLDRDQUFxQjtZQUN4QiwrQ0FBK0M7WUFDL0MsTUFBTSxFQUFFLHlGQUF5RjtZQUNqRyxNQUFNLEVBQUUsZ0NBQVksQ0FBQyxHQUFHO1NBQ3pCO0tBQ0YsQ0FBQztBQUNKLENBQUM7QUFWRCxvRUFVQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IER1cmF0aW9uLCBQaHlzaWNhbE5hbWUsIFN0YWNrIH0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQXJjaGl0ZWN0dXJlLCBGdW5jdGlvblByb3BzLCBSdW50aW1lIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBOb2RlanNGdW5jdGlvblByb3BzLCBPdXRwdXRGb3JtYXQgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhLW5vZGVqcyc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCB7IGNvbW1vbkJ1bmRsaW5nT3B0aW9ucyB9IGZyb20gJy4vY29tbW9uLWJ1aWxkLW9wdGlvbnMnO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tbW9uRnVuY3Rpb25Qcm9wcyhzY29wZTogQ29uc3RydWN0KTogT21pdDxGdW5jdGlvblByb3BzLCAnY29kZScgfCAnaGFuZGxlcic+IHtcbiAgcmV0dXJuIHtcbiAgICBhcmNoaXRlY3R1cmU6IEFyY2hpdGVjdHVyZS5BUk1fNjQsXG4gICAgLyoqXG4gICAgICogMTUzNm1iIGNvc3RzIDEuNXggYnV0IHJ1bnMgdHdpY2UgYXMgZmFzdCBmb3IgbW9zdCBzY2VuYXJpb3MuXG4gICAgICogQHNlZSB7QGxpbmsgaHR0cHM6Ly9kZXYudG8vZGFzaGJpcmQvNC10aXBzLWZvci1hd3MtbGFtYmRhLW9wdGltaXphdGlvbi1mb3ItcHJvZHVjdGlvbi0zaWYxfVxuICAgICAqL1xuICAgIG1lbW9yeVNpemU6IDE1MzYsXG4gICAgcnVudGltZTogUnVudGltZS5OT0RFSlNfMThfWCxcbiAgICB0aW1lb3V0OiBEdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICAvLyBwcmV2ZW50cyBcIlJlc29sdXRpb24gZXJyb3I6IENhbm5vdCB1c2UgcmVzb3VyY2UgaW4gYSBjcm9zcy1lbnZpcm9ubWVudFxuICAgIC8vIGZhc2hpb24sIHRoZSByZXNvdXJjZSdzIHBoeXNpY2FsIG5hbWUgbXVzdCBiZSBleHBsaWNpdCBzZXQgb3IgdXNlXG4gICAgLy8gUGh5c2ljYWxOYW1lLkdFTkVSQVRFX0lGX05FRURFRC5cIlxuICAgIGZ1bmN0aW9uTmFtZTogU3RhY2sub2Yoc2NvcGUpLnJlZ2lvbiAhPT0gJ3VzLWVhc3QtMScgPyBQaHlzaWNhbE5hbWUuR0VORVJBVEVfSUZfTkVFREVEIDogdW5kZWZpbmVkLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tbW9uTm9kZWpzRnVuY3Rpb25Qcm9wcyhzY29wZTogQ29uc3RydWN0KTogTm9kZWpzRnVuY3Rpb25Qcm9wcyB7XG4gIHJldHVybiB7XG4gICAgLi4uZ2V0Q29tbW9uRnVuY3Rpb25Qcm9wcyhzY29wZSksXG4gICAgYnVuZGxpbmc6IHtcbiAgICAgIC4uLmNvbW1vbkJ1bmRsaW5nT3B0aW9ucyxcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ldmFudy9lc2J1aWxkL2lzc3Vlcy8xOTIxXG4gICAgICBiYW5uZXI6IGBpbXBvcnQgeyBjcmVhdGVSZXF1aXJlIH0gZnJvbSAnbW9kdWxlJzsgY29uc3QgcmVxdWlyZSA9IGNyZWF0ZVJlcXVpcmUoaW1wb3J0Lm1ldGEudXJsKTtgLFxuICAgICAgZm9ybWF0OiBPdXRwdXRGb3JtYXQuRVNNLFxuICAgIH0sXG4gIH07XG59XG4iXX0=