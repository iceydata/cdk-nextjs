"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextjsRevalidation = void 0;
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const path_1 = require("path");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const aws_lambda_event_sources_1 = require("aws-cdk-lib/aws-lambda-event-sources");
const aws_lambda_nodejs_1 = require("aws-cdk-lib/aws-lambda-nodejs");
const aws_sqs_1 = require("aws-cdk-lib/aws-sqs");
const constructs_1 = require("constructs");
const constants_1 = require("./constants");
const common_lambda_props_1 = require("./utils/common-lambda-props");
const convert_path_1 = require("./utils/convert-path");
/**
 * Builds the system for revalidating Next.js resources. This includes a Lambda function handler and queue system.
 *
 * @see {@link https://github.com/serverless-stack/open-next/blob/main/README.md?plain=1#L65}
 *
 */
class NextjsRevalidation extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        this.props = props;
        this.queue = this.createQueue();
        this.function = this.createFunction();
        // allow server fn to send messages to queue
        props.serverFunction.lambdaFunction?.addEnvironment('REVALIDATION_QUEUE_URL', this.queue.queueUrl);
        props.serverFunction.lambdaFunction?.addEnvironment('REVALIDATION_QUEUE_REGION', aws_cdk_lib_1.Stack.of(this).region);
    }
    createQueue() {
        const queue = new aws_sqs_1.Queue(this, 'Queue', {
            fifo: true,
            receiveMessageWaitTime: aws_cdk_lib_1.Duration.seconds(20),
        });
        // https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-least-privilege-policy.html
        queue.addToResourcePolicy(new aws_iam_1.PolicyStatement({
            sid: 'DenyUnsecureTransport',
            actions: ['sqs:*'],
            effect: aws_iam_1.Effect.DENY,
            principals: [new aws_iam_1.AnyPrincipal()],
            resources: [queue.queueArn],
            conditions: {
                Bool: { 'aws:SecureTransport': 'false' },
            },
        }));
        // Allow server to send messages to the queue
        queue.grantSendMessages(this.props.serverFunction.lambdaFunction);
        return queue;
    }
    createFunction() {
        const nodejsFnProps = (0, common_lambda_props_1.getCommonNodejsFunctionProps)(this);
        const fn = new aws_lambda_nodejs_1.NodejsFunction(this, 'Fn', {
            ...nodejsFnProps,
            bundling: {
                ...nodejsFnProps.bundling,
                commandHooks: {
                    afterBundling: () => [],
                    beforeBundling: (_inputDir, outputDir) => [
                        // copy non-bundled assets into zip. use node -e so cross-os compatible
                        `node -e "fs.cpSync('${(0, convert_path_1.fixPath)(this.props.nextBuild.nextRevalidateFnDir)}', '${(0, convert_path_1.fixPath)(outputDir)}', { recursive: true, filter: (src) => !src.endsWith('index.mjs') })"`,
                    ],
                    beforeInstall: () => [],
                },
            },
            // open-next revalidation-function
            // see: https://github.com/serverless-stack/open-next/blob/274d446ed7e940cfbe7ce05a21108f4c854ee37a/README.md?plain=1#L65
            entry: (0, path_1.join)(this.props.nextBuild.nextRevalidateFnDir, constants_1.NEXTJS_BUILD_INDEX_FILE),
            handler: 'index.handler',
            description: 'Next.js revalidation function',
            timeout: aws_cdk_lib_1.Duration.seconds(30),
        });
        fn.addEventSource(new aws_lambda_event_sources_1.SqsEventSource(this.queue, { batchSize: 5 }));
        return fn;
    }
}
_a = JSII_RTTI_SYMBOL_1;
NextjsRevalidation[_a] = { fqn: "cdk-nextjs-standalone.NextjsRevalidation", version: "4.0.0-beta.3" };
exports.NextjsRevalidation = NextjsRevalidation;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTmV4dGpzUmV2YWxpZGF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL05leHRqc1JldmFsaWRhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLCtCQUE0QjtBQUM1Qiw2Q0FBOEM7QUFDOUMsaURBQTRFO0FBRTVFLG1GQUFzRTtBQUN0RSxxRUFBK0Q7QUFDL0QsaURBQTRDO0FBQzVDLDJDQUF1QztBQUN2QywyQ0FBc0Q7QUFJdEQscUVBQTJFO0FBQzNFLHVEQUErQztBQW1CL0M7Ozs7O0dBS0c7QUFDSCxNQUFhLGtCQUFtQixTQUFRLHNCQUFTO0lBSy9DLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBOEI7UUFDdEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUVuQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNoQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUV0Qyw0Q0FBNEM7UUFDNUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDLHdCQUF3QixFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDLDJCQUEyQixFQUFFLG1CQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzFHLENBQUM7SUFFTyxXQUFXO1FBQ2pCLE1BQU0sS0FBSyxHQUFHLElBQUksZUFBSyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUU7WUFDckMsSUFBSSxFQUFFLElBQUk7WUFDVixzQkFBc0IsRUFBRSxzQkFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7U0FDN0MsQ0FBQyxDQUFDO1FBQ0gsNkdBQTZHO1FBQzdHLEtBQUssQ0FBQyxtQkFBbUIsQ0FDdkIsSUFBSSx5QkFBZSxDQUFDO1lBQ2xCLEdBQUcsRUFBRSx1QkFBdUI7WUFDNUIsT0FBTyxFQUFFLENBQUMsT0FBTyxDQUFDO1lBQ2xCLE1BQU0sRUFBRSxnQkFBTSxDQUFDLElBQUk7WUFDbkIsVUFBVSxFQUFFLENBQUMsSUFBSSxzQkFBWSxFQUFFLENBQUM7WUFDaEMsU0FBUyxFQUFFLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQztZQUMzQixVQUFVLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLEVBQUUscUJBQXFCLEVBQUUsT0FBTyxFQUFFO2FBQ3pDO1NBQ0YsQ0FBQyxDQUNILENBQUM7UUFDRiw2Q0FBNkM7UUFDN0MsS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ2xFLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVPLGNBQWM7UUFDcEIsTUFBTSxhQUFhLEdBQUcsSUFBQSxrREFBNEIsRUFBQyxJQUFJLENBQUMsQ0FBQztRQUN6RCxNQUFNLEVBQUUsR0FBRyxJQUFJLGtDQUFjLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRTtZQUN4QyxHQUFHLGFBQWE7WUFDaEIsUUFBUSxFQUFFO2dCQUNSLEdBQUcsYUFBYSxDQUFDLFFBQVE7Z0JBQ3pCLFlBQVksRUFBRTtvQkFDWixhQUFhLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRTtvQkFDdkIsY0FBYyxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUM7d0JBQ3hDLHVFQUF1RTt3QkFDdkUsdUJBQXVCLElBQUEsc0JBQU8sRUFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLElBQUEsc0JBQU8sRUFDcEYsU0FBUyxDQUNWLHVFQUF1RTtxQkFDekU7b0JBQ0QsYUFBYSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUU7aUJBQ3hCO2FBQ0Y7WUFDRCxrQ0FBa0M7WUFDbEMseUhBQXlIO1lBQ3pILEtBQUssRUFBRSxJQUFBLFdBQUksRUFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxtQ0FBdUIsQ0FBQztZQUM5RSxPQUFPLEVBQUUsZUFBZTtZQUN4QixXQUFXLEVBQUUsK0JBQStCO1lBQzVDLE9BQU8sRUFBRSxzQkFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7U0FDOUIsQ0FBQyxDQUFDO1FBQ0gsRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLHlDQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDcEUsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDOzs7O0FBbEVVLGdEQUFrQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IER1cmF0aW9uLCBTdGFjayB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IEFueVByaW5jaXBhbCwgRWZmZWN0LCBQb2xpY3lTdGF0ZW1lbnQgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCB7IEZ1bmN0aW9uT3B0aW9ucyB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgU3FzRXZlbnRTb3VyY2UgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhLWV2ZW50LXNvdXJjZXMnO1xuaW1wb3J0IHsgTm9kZWpzRnVuY3Rpb24gfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhLW5vZGVqcyc7XG5pbXBvcnQgeyBRdWV1ZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zcXMnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBORVhUSlNfQlVJTERfSU5ERVhfRklMRSB9IGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCB7IE5leHRqc0Jhc2VQcm9wcyB9IGZyb20gJy4vTmV4dGpzQmFzZSc7XG5pbXBvcnQgeyBOZXh0anNCdWlsZCB9IGZyb20gJy4vTmV4dGpzQnVpbGQnO1xuaW1wb3J0IHsgTmV4dGpzU2VydmVyIH0gZnJvbSAnLi9OZXh0anNTZXJ2ZXInO1xuaW1wb3J0IHsgZ2V0Q29tbW9uTm9kZWpzRnVuY3Rpb25Qcm9wcyB9IGZyb20gJy4vdXRpbHMvY29tbW9uLWxhbWJkYS1wcm9wcyc7XG5pbXBvcnQgeyBmaXhQYXRoIH0gZnJvbSAnLi91dGlscy9jb252ZXJ0LXBhdGgnO1xuXG5leHBvcnQgaW50ZXJmYWNlIE5leHRqc1JldmFsaWRhdGlvblByb3BzIGV4dGVuZHMgTmV4dGpzQmFzZVByb3BzIHtcbiAgLyoqXG4gICAqIE92ZXJyaWRlIGZ1bmN0aW9uIHByb3BlcnRpZXMuXG4gICAqL1xuICByZWFkb25seSBsYW1iZGFPcHRpb25zPzogRnVuY3Rpb25PcHRpb25zO1xuXG4gIC8qKlxuICAgKiBUaGUgYE5leHRqc0J1aWxkYCBpbnN0YW5jZSByZXByZXNlbnRpbmcgdGhlIGJ1aWx0IE5leHRqcyBhcHBsaWNhdGlvbi5cbiAgICovXG4gIHJlYWRvbmx5IG5leHRCdWlsZDogTmV4dGpzQnVpbGQ7XG5cbiAgLyoqXG4gICAqIFRoZSBtYWluIE5leHRKUyBzZXJ2ZXIgaGFuZGxlciBsYW1iZGEgZnVuY3Rpb24uXG4gICAqL1xuICByZWFkb25seSBzZXJ2ZXJGdW5jdGlvbjogTmV4dGpzU2VydmVyO1xufVxuXG4vKipcbiAqIEJ1aWxkcyB0aGUgc3lzdGVtIGZvciByZXZhbGlkYXRpbmcgTmV4dC5qcyByZXNvdXJjZXMuIFRoaXMgaW5jbHVkZXMgYSBMYW1iZGEgZnVuY3Rpb24gaGFuZGxlciBhbmQgcXVldWUgc3lzdGVtLlxuICpcbiAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9zZXJ2ZXJsZXNzLXN0YWNrL29wZW4tbmV4dC9ibG9iL21haW4vUkVBRE1FLm1kP3BsYWluPTEjTDY1fVxuICpcbiAqL1xuZXhwb3J0IGNsYXNzIE5leHRqc1JldmFsaWRhdGlvbiBleHRlbmRzIENvbnN0cnVjdCB7XG4gIHF1ZXVlOiBRdWV1ZTtcbiAgZnVuY3Rpb246IE5vZGVqc0Z1bmN0aW9uO1xuICBwcml2YXRlIHByb3BzOiBOZXh0anNSZXZhbGlkYXRpb25Qcm9wcztcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogTmV4dGpzUmV2YWxpZGF0aW9uUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuICAgIHRoaXMucHJvcHMgPSBwcm9wcztcblxuICAgIHRoaXMucXVldWUgPSB0aGlzLmNyZWF0ZVF1ZXVlKCk7XG4gICAgdGhpcy5mdW5jdGlvbiA9IHRoaXMuY3JlYXRlRnVuY3Rpb24oKTtcblxuICAgIC8vIGFsbG93IHNlcnZlciBmbiB0byBzZW5kIG1lc3NhZ2VzIHRvIHF1ZXVlXG4gICAgcHJvcHMuc2VydmVyRnVuY3Rpb24ubGFtYmRhRnVuY3Rpb24/LmFkZEVudmlyb25tZW50KCdSRVZBTElEQVRJT05fUVVFVUVfVVJMJywgdGhpcy5xdWV1ZS5xdWV1ZVVybCk7XG4gICAgcHJvcHMuc2VydmVyRnVuY3Rpb24ubGFtYmRhRnVuY3Rpb24/LmFkZEVudmlyb25tZW50KCdSRVZBTElEQVRJT05fUVVFVUVfUkVHSU9OJywgU3RhY2sub2YodGhpcykucmVnaW9uKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlUXVldWUoKTogUXVldWUge1xuICAgIGNvbnN0IHF1ZXVlID0gbmV3IFF1ZXVlKHRoaXMsICdRdWV1ZScsIHtcbiAgICAgIGZpZm86IHRydWUsXG4gICAgICByZWNlaXZlTWVzc2FnZVdhaXRUaW1lOiBEdXJhdGlvbi5zZWNvbmRzKDIwKSxcbiAgICB9KTtcbiAgICAvLyBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vQVdTU2ltcGxlUXVldWVTZXJ2aWNlL2xhdGVzdC9TUVNEZXZlbG9wZXJHdWlkZS9zcXMtbGVhc3QtcHJpdmlsZWdlLXBvbGljeS5odG1sXG4gICAgcXVldWUuYWRkVG9SZXNvdXJjZVBvbGljeShcbiAgICAgIG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBzaWQ6ICdEZW55VW5zZWN1cmVUcmFuc3BvcnQnLFxuICAgICAgICBhY3Rpb25zOiBbJ3NxczoqJ10sXG4gICAgICAgIGVmZmVjdDogRWZmZWN0LkRFTlksXG4gICAgICAgIHByaW5jaXBhbHM6IFtuZXcgQW55UHJpbmNpcGFsKCldLFxuICAgICAgICByZXNvdXJjZXM6IFtxdWV1ZS5xdWV1ZUFybl0sXG4gICAgICAgIGNvbmRpdGlvbnM6IHtcbiAgICAgICAgICBCb29sOiB7ICdhd3M6U2VjdXJlVHJhbnNwb3J0JzogJ2ZhbHNlJyB9LFxuICAgICAgICB9LFxuICAgICAgfSlcbiAgICApO1xuICAgIC8vIEFsbG93IHNlcnZlciB0byBzZW5kIG1lc3NhZ2VzIHRvIHRoZSBxdWV1ZVxuICAgIHF1ZXVlLmdyYW50U2VuZE1lc3NhZ2VzKHRoaXMucHJvcHMuc2VydmVyRnVuY3Rpb24ubGFtYmRhRnVuY3Rpb24pO1xuICAgIHJldHVybiBxdWV1ZTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlRnVuY3Rpb24oKTogTm9kZWpzRnVuY3Rpb24ge1xuICAgIGNvbnN0IG5vZGVqc0ZuUHJvcHMgPSBnZXRDb21tb25Ob2RlanNGdW5jdGlvblByb3BzKHRoaXMpO1xuICAgIGNvbnN0IGZuID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdGbicsIHtcbiAgICAgIC4uLm5vZGVqc0ZuUHJvcHMsXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICAuLi5ub2RlanNGblByb3BzLmJ1bmRsaW5nLFxuICAgICAgICBjb21tYW5kSG9va3M6IHtcbiAgICAgICAgICBhZnRlckJ1bmRsaW5nOiAoKSA9PiBbXSxcbiAgICAgICAgICBiZWZvcmVCdW5kbGluZzogKF9pbnB1dERpciwgb3V0cHV0RGlyKSA9PiBbXG4gICAgICAgICAgICAvLyBjb3B5IG5vbi1idW5kbGVkIGFzc2V0cyBpbnRvIHppcC4gdXNlIG5vZGUgLWUgc28gY3Jvc3Mtb3MgY29tcGF0aWJsZVxuICAgICAgICAgICAgYG5vZGUgLWUgXCJmcy5jcFN5bmMoJyR7Zml4UGF0aCh0aGlzLnByb3BzLm5leHRCdWlsZC5uZXh0UmV2YWxpZGF0ZUZuRGlyKX0nLCAnJHtmaXhQYXRoKFxuICAgICAgICAgICAgICBvdXRwdXREaXJcbiAgICAgICAgICAgICl9JywgeyByZWN1cnNpdmU6IHRydWUsIGZpbHRlcjogKHNyYykgPT4gIXNyYy5lbmRzV2l0aCgnaW5kZXgubWpzJykgfSlcImAsXG4gICAgICAgICAgXSxcbiAgICAgICAgICBiZWZvcmVJbnN0YWxsOiAoKSA9PiBbXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICAvLyBvcGVuLW5leHQgcmV2YWxpZGF0aW9uLWZ1bmN0aW9uXG4gICAgICAvLyBzZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9zZXJ2ZXJsZXNzLXN0YWNrL29wZW4tbmV4dC9ibG9iLzI3NGQ0NDZlZDdlOTQwY2ZiZTdjZTA1YTIxMTA4ZjRjODU0ZWUzN2EvUkVBRE1FLm1kP3BsYWluPTEjTDY1XG4gICAgICBlbnRyeTogam9pbih0aGlzLnByb3BzLm5leHRCdWlsZC5uZXh0UmV2YWxpZGF0ZUZuRGlyLCBORVhUSlNfQlVJTERfSU5ERVhfRklMRSksXG4gICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICBkZXNjcmlwdGlvbjogJ05leHQuanMgcmV2YWxpZGF0aW9uIGZ1bmN0aW9uJyxcbiAgICAgIHRpbWVvdXQ6IER1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgIH0pO1xuICAgIGZuLmFkZEV2ZW50U291cmNlKG5ldyBTcXNFdmVudFNvdXJjZSh0aGlzLnF1ZXVlLCB7IGJhdGNoU2l6ZTogNSB9KSk7XG4gICAgcmV0dXJuIGZuO1xuICB9XG59XG4iXX0=