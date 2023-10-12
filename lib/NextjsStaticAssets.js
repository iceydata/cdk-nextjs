"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextjsStaticAssets = void 0;
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const fs = require("node:fs");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");
const aws_s3_assets_1 = require("aws-cdk-lib/aws-s3-assets");
const constructs_1 = require("constructs");
const constants_1 = require("./constants");
const NextjsBucketDeployment_1 = require("./NextjsBucketDeployment");
/**
 * Uploads Nextjs built static and public files to S3.
 *
 * Will inject resolved environment variables that are unresolved at synthesis
 * in CloudFormation Custom Resource.
 */
class NextjsStaticAssets extends constructs_1.Construct {
    get buildEnvVars() {
        const buildEnvVars = {};
        for (const [k, v] of Object.entries(this.props.environment || {})) {
            if (k.startsWith('NEXT_PUBLIC')) {
                buildEnvVars[k] = v;
            }
        }
        return buildEnvVars;
    }
    constructor(scope, id, props) {
        super(scope, id);
        this.props = props;
        this.bucket = this.createBucket();
        const asset = this.createAsset();
        this.createBucketDeployment(asset);
    }
    createBucket() {
        return (this.props.bucket ??
            new s3.Bucket(this, 'Bucket', {
                removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
                autoDeleteObjects: true,
                enforceSSL: true,
                blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
                encryption: s3.BucketEncryption.S3_MANAGED,
            }));
    }
    createAsset() {
        // create temporary directory to join open-next's static output with cache output
        const tmpAssetsDir = fs.mkdtempSync((0, node_path_1.resolve)((0, node_os_1.tmpdir)(), 'cdk-nextjs-assets-'));
        fs.cpSync(this.props.nextBuild.nextStaticDir, tmpAssetsDir, { recursive: true });
        fs.cpSync(this.props.nextBuild.nextCacheDir, (0, node_path_1.resolve)(tmpAssetsDir, constants_1.NEXTJS_CACHE_DIR), { recursive: true });
        const asset = new aws_s3_assets_1.Asset(this, 'Asset', {
            path: tmpAssetsDir,
        });
        fs.rmSync(tmpAssetsDir, { recursive: true });
        return asset;
    }
    createBucketDeployment(asset) {
        return new NextjsBucketDeployment_1.NextjsBucketDeployment(this, 'BucketDeployment', {
            asset,
            destinationBucket: this.bucket,
            debug: true,
            // only put env vars that are placeholders in custom resource properties
            // to be replaced. other env vars were injected at build time.
            substitutionConfig: NextjsBucketDeployment_1.NextjsBucketDeployment.getSubstitutionConfig(this.buildEnvVars),
            prune: true,
            putConfig: {
                '**/*': {
                    CacheControl: 'public, max-age=0, must-revalidate',
                },
                '_next/static/**/*': {
                    CacheControl: 'public, max-age=31536000, immutable',
                },
            },
        });
    }
}
_a = JSII_RTTI_SYMBOL_1;
NextjsStaticAssets[_a] = { fqn: "cdk-nextjs-standalone.NextjsStaticAssets", version: "4.0.0-beta.3" };
exports.NextjsStaticAssets = NextjsStaticAssets;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTmV4dGpzU3RhdGljQXNzZXRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL05leHRqc1N0YXRpY0Fzc2V0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDhCQUE4QjtBQUM5QixxQ0FBaUM7QUFDakMseUNBQW9DO0FBQ3BDLDZDQUE0QztBQUM1Qyx5Q0FBeUM7QUFDekMsNkRBQWtEO0FBQ2xELDJDQUF1QztBQUN2QywyQ0FBK0M7QUFDL0MscUVBQWtFO0FBa0JsRTs7Ozs7R0FLRztBQUNILE1BQWEsa0JBQW1CLFNBQVEsc0JBQVM7SUFRL0MsSUFBWSxZQUFZO1FBQ3RCLE1BQU0sWUFBWSxHQUEyQixFQUFFLENBQUM7UUFDaEQsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFDLEVBQUU7WUFDakUsSUFBSSxDQUFDLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxFQUFFO2dCQUMvQixZQUFZLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ3JCO1NBQ0Y7UUFDRCxPQUFPLFlBQVksQ0FBQztJQUN0QixDQUFDO0lBRUQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUE4QjtRQUN0RSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ2pCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBRW5CLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ2xDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNqQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVPLFlBQVk7UUFDbEIsT0FBTyxDQUNMLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTTtZQUNqQixJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtnQkFDNUIsYUFBYSxFQUFFLDJCQUFhLENBQUMsT0FBTztnQkFDcEMsaUJBQWlCLEVBQUUsSUFBSTtnQkFDdkIsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTO2dCQUNqRCxVQUFVLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFVBQVU7YUFDM0MsQ0FBQyxDQUNILENBQUM7SUFDSixDQUFDO0lBRU8sV0FBVztRQUNqQixpRkFBaUY7UUFDakYsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFBLG1CQUFPLEVBQUMsSUFBQSxnQkFBTSxHQUFFLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1FBQzdFLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLFlBQVksRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ2pGLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLElBQUEsbUJBQU8sRUFBQyxZQUFZLEVBQUUsNEJBQWdCLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzNHLE1BQU0sS0FBSyxHQUFHLElBQUkscUJBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFO1lBQ3JDLElBQUksRUFBRSxZQUFZO1NBQ25CLENBQUMsQ0FBQztRQUNILEVBQUUsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDN0MsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRU8sc0JBQXNCLENBQUMsS0FBWTtRQUN6QyxPQUFPLElBQUksK0NBQXNCLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQzFELEtBQUs7WUFDTCxpQkFBaUIsRUFBRSxJQUFJLENBQUMsTUFBTTtZQUM5QixLQUFLLEVBQUUsSUFBSTtZQUNYLHdFQUF3RTtZQUN4RSw4REFBOEQ7WUFDOUQsa0JBQWtCLEVBQUUsK0NBQXNCLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQztZQUNuRixLQUFLLEVBQUUsSUFBSTtZQUNYLFNBQVMsRUFBRTtnQkFDVCxNQUFNLEVBQUU7b0JBQ04sWUFBWSxFQUFFLG9DQUFvQztpQkFDbkQ7Z0JBQ0QsbUJBQW1CLEVBQUU7b0JBQ25CLFlBQVksRUFBRSxxQ0FBcUM7aUJBQ3BEO2FBQ0Y7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDOzs7O0FBdEVVLGdEQUFrQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZzIGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHsgdG1wZGlyIH0gZnJvbSAnbm9kZTpvcyc7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IFJlbW92YWxQb2xpY3kgfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0IHsgQXNzZXQgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMtYXNzZXRzJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgTkVYVEpTX0NBQ0hFX0RJUiB9IGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCB7IE5leHRqc0J1Y2tldERlcGxveW1lbnQgfSBmcm9tICcuL05leHRqc0J1Y2tldERlcGxveW1lbnQnO1xuaW1wb3J0IHsgTmV4dGpzQnVpbGQgfSBmcm9tICcuL05leHRqc0J1aWxkJztcblxuZXhwb3J0IGludGVyZmFjZSBOZXh0anNTdGF0aWNBc3NldHNQcm9wcyB7XG4gIC8qKlxuICAgKiBEZWZpbmUgeW91ciBvd24gYnVja2V0IHRvIHN0b3JlIHN0YXRpYyBhc3NldHMuXG4gICAqL1xuICByZWFkb25seSBidWNrZXQ/OiBzMy5JQnVja2V0IHwgdW5kZWZpbmVkO1xuICAvKipcbiAgICogVGhlIGBOZXh0anNCdWlsZGAgaW5zdGFuY2UgcmVwcmVzZW50aW5nIHRoZSBidWlsdCBOZXh0anMgYXBwbGljYXRpb24uXG4gICAqL1xuICByZWFkb25seSBuZXh0QnVpbGQ6IE5leHRqc0J1aWxkO1xuICAvKipcbiAgICogQ3VzdG9tIGVudmlyb25tZW50IHZhcmlhYmxlcyB0byBwYXNzIHRvIHRoZSBOZXh0SlMgYnVpbGQgYW5kIHJ1bnRpbWUuXG4gICAqL1xuICByZWFkb25seSBlbnZpcm9ubWVudD86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbi8qKlxuICogVXBsb2FkcyBOZXh0anMgYnVpbHQgc3RhdGljIGFuZCBwdWJsaWMgZmlsZXMgdG8gUzMuXG4gKlxuICogV2lsbCBpbmplY3QgcmVzb2x2ZWQgZW52aXJvbm1lbnQgdmFyaWFibGVzIHRoYXQgYXJlIHVucmVzb2x2ZWQgYXQgc3ludGhlc2lzXG4gKiBpbiBDbG91ZEZvcm1hdGlvbiBDdXN0b20gUmVzb3VyY2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBOZXh0anNTdGF0aWNBc3NldHMgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICAvKipcbiAgICogQnVja2V0IGNvbnRhaW5pbmcgYXNzZXRzLlxuICAgKi9cbiAgYnVja2V0OiBzMy5JQnVja2V0O1xuXG4gIHByb3RlY3RlZCBwcm9wczogTmV4dGpzU3RhdGljQXNzZXRzUHJvcHM7XG5cbiAgcHJpdmF0ZSBnZXQgYnVpbGRFbnZWYXJzKCkge1xuICAgIGNvbnN0IGJ1aWxkRW52VmFyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKHRoaXMucHJvcHMuZW52aXJvbm1lbnQgfHwge30pKSB7XG4gICAgICBpZiAoay5zdGFydHNXaXRoKCdORVhUX1BVQkxJQycpKSB7XG4gICAgICAgIGJ1aWxkRW52VmFyc1trXSA9IHY7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBidWlsZEVudlZhcnM7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogTmV4dGpzU3RhdGljQXNzZXRzUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuICAgIHRoaXMucHJvcHMgPSBwcm9wcztcblxuICAgIHRoaXMuYnVja2V0ID0gdGhpcy5jcmVhdGVCdWNrZXQoKTtcbiAgICBjb25zdCBhc3NldCA9IHRoaXMuY3JlYXRlQXNzZXQoKTtcbiAgICB0aGlzLmNyZWF0ZUJ1Y2tldERlcGxveW1lbnQoYXNzZXQpO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVCdWNrZXQoKTogczMuSUJ1Y2tldCB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMucHJvcHMuYnVja2V0ID8/XG4gICAgICBuZXcgczMuQnVja2V0KHRoaXMsICdCdWNrZXQnLCB7XG4gICAgICAgIHJlbW92YWxQb2xpY3k6IFJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IHRydWUsXG4gICAgICAgIGVuZm9yY2VTU0w6IHRydWUsXG4gICAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQXNzZXQoKTogQXNzZXQge1xuICAgIC8vIGNyZWF0ZSB0ZW1wb3JhcnkgZGlyZWN0b3J5IHRvIGpvaW4gb3Blbi1uZXh0J3Mgc3RhdGljIG91dHB1dCB3aXRoIGNhY2hlIG91dHB1dFxuICAgIGNvbnN0IHRtcEFzc2V0c0RpciA9IGZzLm1rZHRlbXBTeW5jKHJlc29sdmUodG1wZGlyKCksICdjZGstbmV4dGpzLWFzc2V0cy0nKSk7XG4gICAgZnMuY3BTeW5jKHRoaXMucHJvcHMubmV4dEJ1aWxkLm5leHRTdGF0aWNEaXIsIHRtcEFzc2V0c0RpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgZnMuY3BTeW5jKHRoaXMucHJvcHMubmV4dEJ1aWxkLm5leHRDYWNoZURpciwgcmVzb2x2ZSh0bXBBc3NldHNEaXIsIE5FWFRKU19DQUNIRV9ESVIpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBjb25zdCBhc3NldCA9IG5ldyBBc3NldCh0aGlzLCAnQXNzZXQnLCB7XG4gICAgICBwYXRoOiB0bXBBc3NldHNEaXIsXG4gICAgfSk7XG4gICAgZnMucm1TeW5jKHRtcEFzc2V0c0RpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgcmV0dXJuIGFzc2V0O1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVCdWNrZXREZXBsb3ltZW50KGFzc2V0OiBBc3NldCkge1xuICAgIHJldHVybiBuZXcgTmV4dGpzQnVja2V0RGVwbG95bWVudCh0aGlzLCAnQnVja2V0RGVwbG95bWVudCcsIHtcbiAgICAgIGFzc2V0LFxuICAgICAgZGVzdGluYXRpb25CdWNrZXQ6IHRoaXMuYnVja2V0LFxuICAgICAgZGVidWc6IHRydWUsXG4gICAgICAvLyBvbmx5IHB1dCBlbnYgdmFycyB0aGF0IGFyZSBwbGFjZWhvbGRlcnMgaW4gY3VzdG9tIHJlc291cmNlIHByb3BlcnRpZXNcbiAgICAgIC8vIHRvIGJlIHJlcGxhY2VkLiBvdGhlciBlbnYgdmFycyB3ZXJlIGluamVjdGVkIGF0IGJ1aWxkIHRpbWUuXG4gICAgICBzdWJzdGl0dXRpb25Db25maWc6IE5leHRqc0J1Y2tldERlcGxveW1lbnQuZ2V0U3Vic3RpdHV0aW9uQ29uZmlnKHRoaXMuYnVpbGRFbnZWYXJzKSxcbiAgICAgIHBydW5lOiB0cnVlLFxuICAgICAgcHV0Q29uZmlnOiB7XG4gICAgICAgICcqKi8qJzoge1xuICAgICAgICAgIENhY2hlQ29udHJvbDogJ3B1YmxpYywgbWF4LWFnZT0wLCBtdXN0LXJldmFsaWRhdGUnLFxuICAgICAgICB9LFxuICAgICAgICAnX25leHQvc3RhdGljLyoqLyonOiB7XG4gICAgICAgICAgQ2FjaGVDb250cm9sOiAncHVibGljLCBtYXgtYWdlPTMxNTM2MDAwLCBpbW11dGFibGUnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxufVxuIl19