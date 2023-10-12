"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextjsImage = void 0;
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const path_1 = require("path");
const aws_lambda_nodejs_1 = require("aws-cdk-lib/aws-lambda-nodejs");
const constants_1 = require("./constants");
const common_lambda_props_1 = require("./utils/common-lambda-props");
const convert_path_1 = require("./utils/convert-path");
/**
 * This lambda handles image optimization.
 */
class NextjsImage extends aws_lambda_nodejs_1.NodejsFunction {
    constructor(scope, id, props) {
        const { lambdaOptions, bucket } = props;
        const nodejsFnProps = (0, common_lambda_props_1.getCommonNodejsFunctionProps)(scope);
        super(scope, id, {
            ...nodejsFnProps,
            bundling: {
                ...nodejsFnProps.bundling,
                logLevel: aws_lambda_nodejs_1.LogLevel.SILENT,
                externalModules: ['sharp'],
                nodeModules: ['sharp'],
                commandHooks: {
                    afterBundling: (_inputDir, outputDir) => [
                        `cd ${outputDir}`,
                        'rm -rf node_modules/sharp && npm install --no-save --arch=x86 --platform=linux sharp',
                    ],
                    beforeBundling: (_inputDir, outputDir) => [
                        // copy non-bundled assets into zip. use node -e so cross-os compatible
                        `node -e "fs.cpSync('${(0, convert_path_1.fixPath)(props.nextBuild.nextImageFnDir)}', '${(0, convert_path_1.fixPath)(outputDir)}', { recursive: true, filter: (src) => !src.includes('/node_modules') && !src.endsWith('index.mjs') })"`,
                    ],
                    beforeInstall: () => [],
                },
            },
            entry: (0, path_1.join)(props.nextBuild.nextImageFnDir, constants_1.NEXTJS_BUILD_INDEX_FILE),
            handler: 'index.handler',
            description: 'Next.js Image Optimization Function',
            ...lambdaOptions,
            environment: {
                BUCKET_NAME: bucket.bucketName,
                ...lambdaOptions?.environment,
            },
        });
        bucket.grantRead(this);
    }
}
_a = JSII_RTTI_SYMBOL_1;
NextjsImage[_a] = { fqn: "cdk-nextjs-standalone.NextjsImage", version: "0.0.0" };
exports.NextjsImage = NextjsImage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTmV4dGpzSW1hZ2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvTmV4dGpzSW1hZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwrQkFBNEI7QUFDNUIscUVBQThGO0FBRzlGLDJDQUFzRDtBQUd0RCxxRUFBMkU7QUFDM0UsdURBQStDO0FBaUIvQzs7R0FFRztBQUNILE1BQWEsV0FBWSxTQUFRLGtDQUFjO0lBQzdDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBdUI7UUFDL0QsTUFBTSxFQUFFLGFBQWEsRUFBRSxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFFeEMsTUFBTSxhQUFhLEdBQUcsSUFBQSxrREFBNEIsRUFBQyxLQUFLLENBQUMsQ0FBQztRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRTtZQUNmLEdBQUcsYUFBYTtZQUNoQixRQUFRLEVBQUU7Z0JBQ1IsR0FBRyxhQUFhLENBQUMsUUFBUTtnQkFDekIsUUFBUSxFQUFFLDRCQUFRLENBQUMsTUFBTTtnQkFDekIsZUFBZSxFQUFFLENBQUMsT0FBTyxDQUFDO2dCQUMxQixXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUM7Z0JBQ3RCLFlBQVksRUFBRTtvQkFDWixhQUFhLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQzt3QkFDdkMsTUFBTSxTQUFTLEVBQUU7d0JBQ2pCLHNGQUFzRjtxQkFDdkY7b0JBQ0QsY0FBYyxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUM7d0JBQ3hDLHVFQUF1RTt3QkFDdkUsdUJBQXVCLElBQUEsc0JBQU8sRUFBQyxLQUFLLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxPQUFPLElBQUEsc0JBQU8sRUFDMUUsU0FBUyxDQUNWLHlHQUF5RztxQkFDM0c7b0JBQ0QsYUFBYSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUU7aUJBQ3hCO2FBQ0Y7WUFDRCxLQUFLLEVBQUUsSUFBQSxXQUFJLEVBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUsbUNBQXVCLENBQUM7WUFDcEUsT0FBTyxFQUFFLGVBQWU7WUFDeEIsV0FBVyxFQUFFLHFDQUFxQztZQUNsRCxHQUFHLGFBQWE7WUFDaEIsV0FBVyxFQUFFO2dCQUNYLFdBQVcsRUFBRSxNQUFNLENBQUMsVUFBVTtnQkFDOUIsR0FBRyxhQUFhLEVBQUUsV0FBVzthQUM5QjtTQUNGLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDekIsQ0FBQzs7OztBQXJDVSxrQ0FBVyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IExvZ0xldmVsLCBOb2RlanNGdW5jdGlvbiwgTm9kZWpzRnVuY3Rpb25Qcm9wcyB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEtbm9kZWpzJztcbmltcG9ydCB7IElCdWNrZXQgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBORVhUSlNfQlVJTERfSU5ERVhfRklMRSB9IGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCB7IE5leHRqc0Jhc2VQcm9wcyB9IGZyb20gJy4vTmV4dGpzQmFzZSc7XG5pbXBvcnQgdHlwZSB7IE5leHRqc0J1aWxkIH0gZnJvbSAnLi9OZXh0anNCdWlsZCc7XG5pbXBvcnQgeyBnZXRDb21tb25Ob2RlanNGdW5jdGlvblByb3BzIH0gZnJvbSAnLi91dGlscy9jb21tb24tbGFtYmRhLXByb3BzJztcbmltcG9ydCB7IGZpeFBhdGggfSBmcm9tICcuL3V0aWxzL2NvbnZlcnQtcGF0aCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTmV4dGpzSW1hZ2VQcm9wcyBleHRlbmRzIE5leHRqc0Jhc2VQcm9wcyB7XG4gIC8qKlxuICAgKiBUaGUgUzMgYnVja2V0IGhvbGRpbmcgYXBwbGljYXRpb24gaW1hZ2VzLlxuICAgKi9cbiAgcmVhZG9ubHkgYnVja2V0OiBJQnVja2V0O1xuICAvKipcbiAgICogT3ZlcnJpZGUgZnVuY3Rpb24gcHJvcGVydGllcy5cbiAgICovXG4gIHJlYWRvbmx5IGxhbWJkYU9wdGlvbnM/OiBOb2RlanNGdW5jdGlvblByb3BzO1xuICAvKipcbiAgICogVGhlIGBOZXh0anNCdWlsZGAgaW5zdGFuY2UgcmVwcmVzZW50aW5nIHRoZSBidWlsdCBOZXh0anMgYXBwbGljYXRpb24uXG4gICAqL1xuICByZWFkb25seSBuZXh0QnVpbGQ6IE5leHRqc0J1aWxkO1xufVxuXG4vKipcbiAqIFRoaXMgbGFtYmRhIGhhbmRsZXMgaW1hZ2Ugb3B0aW1pemF0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgTmV4dGpzSW1hZ2UgZXh0ZW5kcyBOb2RlanNGdW5jdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBOZXh0anNJbWFnZVByb3BzKSB7XG4gICAgY29uc3QgeyBsYW1iZGFPcHRpb25zLCBidWNrZXQgfSA9IHByb3BzO1xuXG4gICAgY29uc3Qgbm9kZWpzRm5Qcm9wcyA9IGdldENvbW1vbk5vZGVqc0Z1bmN0aW9uUHJvcHMoc2NvcGUpO1xuICAgIHN1cGVyKHNjb3BlLCBpZCwge1xuICAgICAgLi4ubm9kZWpzRm5Qcm9wcyxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIC4uLm5vZGVqc0ZuUHJvcHMuYnVuZGxpbmcsXG4gICAgICAgIGxvZ0xldmVsOiBMb2dMZXZlbC5TSUxFTlQsIC8vIHNpbGVuY2UgZXJyb3Igb24gdXNlIG9mIGBldmFsYCBpbiBub2RlX21vZHVsZVxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnc2hhcnAnXSxcbiAgICAgICAgbm9kZU1vZHVsZXM6IFsnc2hhcnAnXSxcbiAgICAgICAgY29tbWFuZEhvb2tzOiB7XG4gICAgICAgICAgYWZ0ZXJCdW5kbGluZzogKF9pbnB1dERpciwgb3V0cHV0RGlyKSA9PiBbXG4gICAgICAgICAgICBgY2QgJHtvdXRwdXREaXJ9YCxcbiAgICAgICAgICAgICdybSAtcmYgbm9kZV9tb2R1bGVzL3NoYXJwICYmIG5wbSBpbnN0YWxsIC0tbm8tc2F2ZSAtLWFyY2g9eDg2IC0tcGxhdGZvcm09bGludXggc2hhcnAnLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgYmVmb3JlQnVuZGxpbmc6IChfaW5wdXREaXIsIG91dHB1dERpcikgPT4gW1xuICAgICAgICAgICAgLy8gY29weSBub24tYnVuZGxlZCBhc3NldHMgaW50byB6aXAuIHVzZSBub2RlIC1lIHNvIGNyb3NzLW9zIGNvbXBhdGlibGVcbiAgICAgICAgICAgIGBub2RlIC1lIFwiZnMuY3BTeW5jKCcke2ZpeFBhdGgocHJvcHMubmV4dEJ1aWxkLm5leHRJbWFnZUZuRGlyKX0nLCAnJHtmaXhQYXRoKFxuICAgICAgICAgICAgICBvdXRwdXREaXJcbiAgICAgICAgICAgICl9JywgeyByZWN1cnNpdmU6IHRydWUsIGZpbHRlcjogKHNyYykgPT4gIXNyYy5pbmNsdWRlcygnL25vZGVfbW9kdWxlcycpICYmICFzcmMuZW5kc1dpdGgoJ2luZGV4Lm1qcycpIH0pXCJgLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgYmVmb3JlSW5zdGFsbDogKCkgPT4gW10sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgZW50cnk6IGpvaW4ocHJvcHMubmV4dEJ1aWxkLm5leHRJbWFnZUZuRGlyLCBORVhUSlNfQlVJTERfSU5ERVhfRklMRSksXG4gICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICBkZXNjcmlwdGlvbjogJ05leHQuanMgSW1hZ2UgT3B0aW1pemF0aW9uIEZ1bmN0aW9uJyxcbiAgICAgIC4uLmxhbWJkYU9wdGlvbnMsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBCVUNLRVRfTkFNRTogYnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICAgIC4uLmxhbWJkYU9wdGlvbnM/LmVudmlyb25tZW50LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGJ1Y2tldC5ncmFudFJlYWQodGhpcyk7XG4gIH1cbn1cbiJdfQ==