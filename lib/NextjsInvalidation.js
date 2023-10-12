"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextjsInvalidation = void 0;
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const custom_resources_1 = require("aws-cdk-lib/custom-resources");
const constructs_1 = require("constructs");
class NextjsInvalidation extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        const awsSdkCall = {
            // make `physicalResourceId` change each time to invalidate CloudFront
            // distribution on each change
            physicalResourceId: custom_resources_1.PhysicalResourceId.of(`${props.distribution.distributionId}-${Date.now()}`),
            action: 'CreateInvalidationCommand',
            service: '@aws-sdk/client-cloudfront',
            parameters: {
                DistributionId: props.distribution.distributionId,
                InvalidationBatch: {
                    CallerReference: new Date().toISOString(),
                    Paths: {
                        Quantity: 1,
                        Items: ['/*'],
                    },
                },
            },
        };
        const awsCustomResource = new custom_resources_1.AwsCustomResource(this, 'AwsCR', {
            onCreate: awsSdkCall,
            onUpdate: awsSdkCall,
            policy: custom_resources_1.AwsCustomResourcePolicy.fromStatements([
                new aws_iam_1.PolicyStatement({
                    actions: ['cloudfront:CreateInvalidation'],
                    resources: [
                        aws_cdk_lib_1.Stack.of(this).formatArn({
                            resource: `distribution/${props.distribution.distributionId}`,
                            service: 'cloudfront',
                            region: '',
                        }),
                    ],
                }),
            ]),
        });
        for (const dependency of props.dependencies) {
            dependency.node.addDependency(awsCustomResource);
        }
    }
}
_a = JSII_RTTI_SYMBOL_1;
NextjsInvalidation[_a] = { fqn: "cdk-nextjs-standalone.NextjsInvalidation", version: "4.0.0-beta.3" };
exports.NextjsInvalidation = NextjsInvalidation;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTmV4dGpzSW52YWxpZGF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL05leHRqc0ludmFsaWRhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDZDQUFvQztBQUVwQyxpREFBc0Q7QUFDdEQsbUVBS3NDO0FBQ3RDLDJDQUF1QztBQWV2QyxNQUFhLGtCQUFtQixTQUFRLHNCQUFTO0lBQy9DLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBOEI7UUFDdEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNqQixNQUFNLFVBQVUsR0FBZTtZQUM3QixzRUFBc0U7WUFDdEUsOEJBQThCO1lBQzlCLGtCQUFrQixFQUFFLHFDQUFrQixDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsY0FBYyxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDO1lBQy9GLE1BQU0sRUFBRSwyQkFBMkI7WUFDbkMsT0FBTyxFQUFFLDRCQUE0QjtZQUNyQyxVQUFVLEVBQUU7Z0JBQ1YsY0FBYyxFQUFFLEtBQUssQ0FBQyxZQUFZLENBQUMsY0FBYztnQkFDakQsaUJBQWlCLEVBQUU7b0JBQ2pCLGVBQWUsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtvQkFDekMsS0FBSyxFQUFFO3dCQUNMLFFBQVEsRUFBRSxDQUFDO3dCQUNYLEtBQUssRUFBRSxDQUFDLElBQUksQ0FBQztxQkFDZDtpQkFDRjthQUNGO1NBQ0YsQ0FBQztRQUNGLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxvQ0FBaUIsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFO1lBQzdELFFBQVEsRUFBRSxVQUFVO1lBQ3BCLFFBQVEsRUFBRSxVQUFVO1lBQ3BCLE1BQU0sRUFBRSwwQ0FBdUIsQ0FBQyxjQUFjLENBQUM7Z0JBQzdDLElBQUkseUJBQWUsQ0FBQztvQkFDbEIsT0FBTyxFQUFFLENBQUMsK0JBQStCLENBQUM7b0JBQzFDLFNBQVMsRUFBRTt3QkFDVCxtQkFBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUM7NEJBQ3ZCLFFBQVEsRUFBRSxnQkFBZ0IsS0FBSyxDQUFDLFlBQVksQ0FBQyxjQUFjLEVBQUU7NEJBQzdELE9BQU8sRUFBRSxZQUFZOzRCQUNyQixNQUFNLEVBQUUsRUFBRTt5QkFDWCxDQUFDO3FCQUNIO2lCQUNGLENBQUM7YUFDSCxDQUFDO1NBQ0gsQ0FBQyxDQUFDO1FBQ0gsS0FBSyxNQUFNLFVBQVUsSUFBSSxLQUFLLENBQUMsWUFBWSxFQUFFO1lBQzNDLFVBQVUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUM7U0FDbEQ7SUFDSCxDQUFDOzs7O0FBdkNVLGdEQUFrQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFN0YWNrIH0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgSURpc3RyaWJ1dGlvbiB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250JztcbmltcG9ydCB7IFBvbGljeVN0YXRlbWVudCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0IHtcbiAgQXdzQ3VzdG9tUmVzb3VyY2UsXG4gIEF3c1Nka0NhbGwsXG4gIEF3c0N1c3RvbVJlc291cmNlUG9saWN5LFxuICBQaHlzaWNhbFJlc291cmNlSWQsXG59IGZyb20gJ2F3cy1jZGstbGliL2N1c3RvbS1yZXNvdXJjZXMnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTmV4dGpzSW52YWxpZGF0aW9uUHJvcHMge1xuICAvKipcbiAgICogQ2xvdWRGcm9udCBEaXN0cmlidXRpb24gdG8gaW52YWxpZGF0ZVxuICAgKi9cbiAgcmVhZG9ubHkgZGlzdHJpYnV0aW9uOiBJRGlzdHJpYnV0aW9uO1xuICAvKipcbiAgICogQ29uc3RydWN0cyB0aGF0IHNob3VsZCBjb21wbGV0ZSBiZWZvcmUgaW52YWxpZGF0aW5nIENsb3VkRnJvbnQgRGlzdHJpYnV0aW9uLlxuICAgKlxuICAgKiBVc2VmdWwgZm9yIGFzc2V0cyB0aGF0IG11c3QgYmUgZGVwbG95ZWQvdXBkYXRlZCBiZWZvcmUgaW52YWxpZGF0aW5nLlxuICAgKi9cbiAgcmVhZG9ubHkgZGVwZW5kZW5jaWVzOiBDb25zdHJ1Y3RbXTtcbn1cblxuZXhwb3J0IGNsYXNzIE5leHRqc0ludmFsaWRhdGlvbiBleHRlbmRzIENvbnN0cnVjdCB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBOZXh0anNJbnZhbGlkYXRpb25Qcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG4gICAgY29uc3QgYXdzU2RrQ2FsbDogQXdzU2RrQ2FsbCA9IHtcbiAgICAgIC8vIG1ha2UgYHBoeXNpY2FsUmVzb3VyY2VJZGAgY2hhbmdlIGVhY2ggdGltZSB0byBpbnZhbGlkYXRlIENsb3VkRnJvbnRcbiAgICAgIC8vIGRpc3RyaWJ1dGlvbiBvbiBlYWNoIGNoYW5nZVxuICAgICAgcGh5c2ljYWxSZXNvdXJjZUlkOiBQaHlzaWNhbFJlc291cmNlSWQub2YoYCR7cHJvcHMuZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkfS0ke0RhdGUubm93KCl9YCksXG4gICAgICBhY3Rpb246ICdDcmVhdGVJbnZhbGlkYXRpb25Db21tYW5kJyxcbiAgICAgIHNlcnZpY2U6ICdAYXdzLXNkay9jbGllbnQtY2xvdWRmcm9udCcsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIERpc3RyaWJ1dGlvbklkOiBwcm9wcy5kaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uSWQsXG4gICAgICAgIEludmFsaWRhdGlvbkJhdGNoOiB7XG4gICAgICAgICAgQ2FsbGVyUmVmZXJlbmNlOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgUGF0aHM6IHtcbiAgICAgICAgICAgIFF1YW50aXR5OiAxLFxuICAgICAgICAgICAgSXRlbXM6IFsnLyonXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IGF3c0N1c3RvbVJlc291cmNlID0gbmV3IEF3c0N1c3RvbVJlc291cmNlKHRoaXMsICdBd3NDUicsIHtcbiAgICAgIG9uQ3JlYXRlOiBhd3NTZGtDYWxsLFxuICAgICAgb25VcGRhdGU6IGF3c1Nka0NhbGwsXG4gICAgICBwb2xpY3k6IEF3c0N1c3RvbVJlc291cmNlUG9saWN5LmZyb21TdGF0ZW1lbnRzKFtcbiAgICAgICAgbmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgYWN0aW9uczogWydjbG91ZGZyb250OkNyZWF0ZUludmFsaWRhdGlvbiddLFxuICAgICAgICAgIHJlc291cmNlczogW1xuICAgICAgICAgICAgU3RhY2sub2YodGhpcykuZm9ybWF0QXJuKHtcbiAgICAgICAgICAgICAgcmVzb3VyY2U6IGBkaXN0cmlidXRpb24vJHtwcm9wcy5kaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uSWR9YCxcbiAgICAgICAgICAgICAgc2VydmljZTogJ2Nsb3VkZnJvbnQnLFxuICAgICAgICAgICAgICByZWdpb246ICcnLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICBdKSxcbiAgICB9KTtcbiAgICBmb3IgKGNvbnN0IGRlcGVuZGVuY3kgb2YgcHJvcHMuZGVwZW5kZW5jaWVzKSB7XG4gICAgICBkZXBlbmRlbmN5Lm5vZGUuYWRkRGVwZW5kZW5jeShhd3NDdXN0b21SZXNvdXJjZSk7XG4gICAgfVxuICB9XG59XG4iXX0=