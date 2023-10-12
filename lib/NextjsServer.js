"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextjsServer = void 0;
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_lambda_1 = require("aws-cdk-lib/aws-lambda");
const aws_s3_assets_1 = require("aws-cdk-lib/aws-s3-assets");
const constructs_1 = require("constructs");
const constants_1 = require("./constants");
const NextjsBucketDeployment_1 = require("./NextjsBucketDeployment");
const common_lambda_props_1 = require("./utils/common-lambda-props");
const create_archive_1 = require("./utils/create-archive");
/**
 * Build a lambda function from a NextJS application to handle server-side rendering, API routes, and image optimization.
 */
class NextjsServer extends constructs_1.Construct {
    get environment() {
        return {
            ...this.props.environment,
            ...this.props.lambda?.environment,
            CACHE_BUCKET_NAME: this.props.staticAssetBucket.bucketName,
            CACHE_BUCKET_REGION: aws_cdk_lib_1.Stack.of(this.props.staticAssetBucket).region,
            CACHE_BUCKET_KEY_PREFIX: constants_1.CACHE_BUCKET_KEY_PREFIX,
        };
    }
    constructor(scope, id, props) {
        super(scope, id);
        this.props = props;
        // must create code asset separately (typically it is implicitly created in
        //`Function` construct) b/c we need to substitute unresolve env vars
        const sourceAsset = this.createSourceCodeAsset();
        // source and destination assets are defined separately so that source
        // assets are immutable (easier debugging). Technically we could overwrite
        // source asset
        const destinationAsset = this.createDestinationCodeAsset();
        const bucketDeployment = this.createBucketDeployment(sourceAsset, destinationAsset);
        this.lambdaFunction = this.createFunction(destinationAsset);
        // don't update lambda function until bucket deployment is complete
        this.lambdaFunction.node.addDependency(bucketDeployment);
    }
    createSourceCodeAsset() {
        const archivePath = (0, create_archive_1.createArchive)({
            directory: this.props.nextBuild.nextServerFnDir,
            quiet: this.props.quiet,
            zipFileName: 'server-fn.zip',
        });
        const asset = new aws_s3_assets_1.Asset(this, 'SourceCodeAsset', {
            path: archivePath,
        });
        // new Asset() creates copy of zip into cdk.out/. This cleans up tmp folder
        (0, node_fs_1.rmSync)(archivePath, { recursive: true });
        return asset;
    }
    createDestinationCodeAsset() {
        // create dummy directory to upload with random values so it's uploaded each time
        // TODO: look into caching?
        const assetsTmpDir = (0, node_fs_1.mkdtempSync)((0, node_path_1.resolve)((0, node_os_1.tmpdir)(), 'bucket-deployment-dest-asset-'));
        // this code will never run b/c we explicitly declare dependency between
        // lambda function and bucket deployment.
        (0, node_fs_1.writeFileSync)((0, node_path_1.resolve)(assetsTmpDir, 'index.mjs'), `export function handler() { return '${(0, node_crypto_1.randomUUID)()}' }`);
        const destinationAsset = new aws_s3_assets_1.Asset(this, 'DestinationCodeAsset', {
            path: assetsTmpDir,
        });
        (0, node_fs_1.rmSync)(assetsTmpDir, { recursive: true });
        return destinationAsset;
    }
    createBucketDeployment(sourceAsset, destinationAsset) {
        const bucketDeployment = new NextjsBucketDeployment_1.NextjsBucketDeployment(this, 'BucketDeployment', {
            asset: sourceAsset,
            debug: true,
            destinationBucket: destinationAsset.bucket,
            destinationKeyPrefix: destinationAsset.s3ObjectKey,
            prune: true,
            // this.props.environment is for build time, not this.environment which is for runtime
            substitutionConfig: NextjsBucketDeployment_1.NextjsBucketDeployment.getSubstitutionConfig(this.props.environment || {}),
            zip: true,
        });
        return bucketDeployment;
    }
    createFunction(asset) {
        // cannot use NodejsFunction because we must wait to deploy the function
        // until after the build time env vars in code zip asset are substituted
        const fn = new aws_lambda_1.Function(this, 'Fn', {
            ...(0, common_lambda_props_1.getCommonFunctionProps)(this),
            code: aws_lambda_1.Code.fromBucket(asset.bucket, asset.s3ObjectKey),
            handler: 'index.handler',
            ...this.props.lambda,
            // `environment` needs to go after `this.props.lambda` b/c if
            // `this.props.lambda.environment` is defined, it will override
            // CACHE_* environment variables which are required
            environment: { ...this.environment, ...this.props.lambda?.environment },
        });
        this.props.staticAssetBucket.grantReadWrite(fn);
        return fn;
    }
}
_a = JSII_RTTI_SYMBOL_1;
NextjsServer[_a] = { fqn: "cdk-nextjs-standalone.NextjsServer", version: "4.0.0-beta.3" };
exports.NextjsServer = NextjsServer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTmV4dGpzU2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL05leHRqc1NlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDZDQUF5QztBQUN6QyxxQ0FBNkQ7QUFDN0QscUNBQWlDO0FBQ2pDLHlDQUFvQztBQUNwQyw2Q0FBb0M7QUFDcEMsdURBQXlFO0FBRXpFLDZEQUFrRDtBQUNsRCwyQ0FBdUM7QUFDdkMsMkNBQXNEO0FBRXRELHFFQUFrRTtBQUVsRSxxRUFBcUU7QUFDckUsMkRBQXVEO0FBcUJ2RDs7R0FFRztBQUNILE1BQWEsWUFBYSxTQUFRLHNCQUFTO0lBS3pDLElBQVksV0FBVztRQUNyQixPQUFPO1lBQ0wsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVc7WUFDekIsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxXQUFXO1lBQ2pDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsVUFBVTtZQUMxRCxtQkFBbUIsRUFBRSxtQkFBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUMsTUFBTTtZQUNsRSx1QkFBdUIsRUFBdkIsbUNBQXVCO1NBQ3hCLENBQUM7SUFDSixDQUFDO0lBRUQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUF3QjtRQUNoRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ2pCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBRW5CLDJFQUEyRTtRQUMzRSxvRUFBb0U7UUFDcEUsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDakQsc0VBQXNFO1FBQ3RFLDBFQUEwRTtRQUMxRSxlQUFlO1FBQ2YsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztRQUMzRCxNQUFNLGdCQUFnQixHQUFH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QUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUU7U0FDeEUsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFaEQsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDOzs7O0FBMUZVLG9DQUFZIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmFuZG9tVVVJRCB9IGZyb20gJ25vZGU6Y3J5cHRvJztcbmltcG9ydCB7IG1rZHRlbXBTeW5jLCBybVN5bmMsIHdyaXRlRmlsZVN5bmMgfSBmcm9tICdub2RlOmZzJztcbmltcG9ydCB7IHRtcGRpciB9IGZyb20gJ25vZGU6b3MnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBTdGFjayB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvZGUsIEZ1bmN0aW9uLCBGdW5jdGlvbk9wdGlvbnMgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCB7IEJ1Y2tldCwgSUJ1Y2tldCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgeyBBc3NldCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMy1hc3NldHMnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBDQUNIRV9CVUNLRVRfS0VZX1BSRUZJWCB9IGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCB7IE5leHRqc0Jhc2VQcm9wcyB9IGZyb20gJy4vTmV4dGpzQmFzZSc7XG5pbXBvcnQgeyBOZXh0anNCdWNrZXREZXBsb3ltZW50IH0gZnJvbSAnLi9OZXh0anNCdWNrZXREZXBsb3ltZW50JztcbmltcG9ydCB7IE5leHRqc0J1aWxkIH0gZnJvbSAnLi9OZXh0anNCdWlsZCc7XG5pbXBvcnQgeyBnZXRDb21tb25GdW5jdGlvblByb3BzIH0gZnJvbSAnLi91dGlscy9jb21tb24tbGFtYmRhLXByb3BzJztcbmltcG9ydCB7IGNyZWF0ZUFyY2hpdmUgfSBmcm9tICcuL3V0aWxzL2NyZWF0ZS1hcmNoaXZlJztcblxuZXhwb3J0IHR5cGUgRW52aXJvbm1lbnRWYXJzID0gUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcblxuZXhwb3J0IGludGVyZmFjZSBOZXh0anNTZXJ2ZXJQcm9wcyBleHRlbmRzIE5leHRqc0Jhc2VQcm9wcyB7XG4gIC8qKlxuICAgKiBCdWlsdCBuZXh0SlMgYXBwbGljYXRpb24uXG4gICAqL1xuICByZWFkb25seSBuZXh0QnVpbGQ6IE5leHRqc0J1aWxkO1xuXG4gIC8qKlxuICAgKiBPdmVycmlkZSBmdW5jdGlvbiBwcm9wZXJ0aWVzLlxuICAgKi9cbiAgcmVhZG9ubHkgbGFtYmRhPzogRnVuY3Rpb25PcHRpb25zO1xuXG4gIC8qKlxuICAgKiBTdGF0aWMgYXNzZXQgYnVja2V0LiBGdW5jdGlvbiBuZWVkcyBidWNrZXQgdG8gcmVhZCBmcm9tIGNhY2hlLlxuICAgKi9cbiAgcmVhZG9ubHkgc3RhdGljQXNzZXRCdWNrZXQ6IElCdWNrZXQ7XG59XG5cbi8qKlxuICogQnVpbGQgYSBsYW1iZGEgZnVuY3Rpb24gZnJvbSBhIE5leHRKUyBhcHBsaWNhdGlvbiB0byBoYW5kbGUgc2VydmVyLXNpZGUgcmVuZGVyaW5nLCBBUEkgcm91dGVzLCBhbmQgaW1hZ2Ugb3B0aW1pemF0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgTmV4dGpzU2VydmVyIGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgY29uZmlnQnVja2V0PzogQnVja2V0O1xuICBsYW1iZGFGdW5jdGlvbjogRnVuY3Rpb247XG5cbiAgcHJpdmF0ZSBwcm9wczogTmV4dGpzU2VydmVyUHJvcHM7XG4gIHByaXZhdGUgZ2V0IGVudmlyb25tZW50KCk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4ge1xuICAgIHJldHVybiB7XG4gICAgICAuLi50aGlzLnByb3BzLmVudmlyb25tZW50LFxuICAgICAgLi4udGhpcy5wcm9wcy5sYW1iZGE/LmVudmlyb25tZW50LFxuICAgICAgQ0FDSEVfQlVDS0VUX05BTUU6IHRoaXMucHJvcHMuc3RhdGljQXNzZXRCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIENBQ0hFX0JVQ0tFVF9SRUdJT046IFN0YWNrLm9mKHRoaXMucHJvcHMuc3RhdGljQXNzZXRCdWNrZXQpLnJlZ2lvbixcbiAgICAgIENBQ0hFX0JVQ0tFVF9LRVlfUFJFRklYLFxuICAgIH07XG4gIH1cblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogTmV4dGpzU2VydmVyUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuICAgIHRoaXMucHJvcHMgPSBwcm9wcztcblxuICAgIC8vIG11c3QgY3JlYXRlIGNvZGUgYXNzZXQgc2VwYXJhdGVseSAodHlwaWNhbGx5IGl0IGlzIGltcGxpY2l0bHkgY3JlYXRlZCBpblxuICAgIC8vYEZ1bmN0aW9uYCBjb25zdHJ1Y3QpIGIvYyB3ZSBuZWVkIHRvIHN1YnN0aXR1dGUgdW5yZXNvbHZlIGVudiB2YXJzXG4gICAgY29uc3Qgc291cmNlQXNzZXQgPSB0aGlzLmNyZWF0ZVNvdXJjZUNvZGVBc3NldCgpO1xuICAgIC8vIHNvdXJjZSBhbmQgZGVzdGluYXRpb24gYXNzZXRzIGFyZSBkZWZpbmVkIHNlcGFyYXRlbHkgc28gdGhhdCBzb3VyY2VcbiAgICAvLyBhc3NldHMgYXJlIGltbXV0YWJsZSAoZWFzaWVyIGRlYnVnZ2luZykuIFRlY2huaWNhbGx5IHdlIGNvdWxkIG92ZXJ3cml0ZVxuICAgIC8vIHNvdXJjZSBhc3NldFxuICAgIGNvbnN0IGRlc3RpbmF0aW9uQXNzZXQgPSB0aGlzLmNyZWF0ZURlc3RpbmF0aW9uQ29kZUFzc2V0KCk7XG4gICAgY29uc3QgYnVja2V0RGVwbG95bWVudCA9IHRoaXMuY3JlYXRlQnVja2V0RGVwbG95bWVudChzb3VyY2VBc3NldCwgZGVzdGluYXRpb25Bc3NldCk7XG4gICAgdGhpcy5sYW1iZGFGdW5jdGlvbiA9IHRoaXMuY3JlYXRlRnVuY3Rpb24oZGVzdGluYXRpb25Bc3NldCk7XG4gICAgLy8gZG9uJ3QgdXBkYXRlIGxhbWJkYSBmdW5jdGlvbiB1bnRpbCBidWNrZXQgZGVwbG95bWVudCBpcyBjb21wbGV0ZVxuICAgIHRoaXMubGFtYmRhRnVuY3Rpb24ubm9kZS5hZGREZXBlbmRlbmN5KGJ1Y2tldERlcGxveW1lbnQpO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVTb3VyY2VDb2RlQXNzZXQoKSB7XG4gICAgY29uc3QgYXJjaGl2ZVBhdGggPSBjcmVhdGVBcmNoaXZlKHtcbiAgICAgIGRpcmVjdG9yeTogdGhpcy5wcm9wcy5uZXh0QnVpbGQubmV4dFNlcnZlckZuRGlyLFxuICAgICAgcXVpZXQ6IHRoaXMucHJvcHMucXVpZXQsXG4gICAgICB6aXBGaWxlTmFtZTogJ3NlcnZlci1mbi56aXAnLFxuICAgIH0pO1xuICAgIGNvbnN0IGFzc2V0ID0gbmV3IEFzc2V0KHRoaXMsICdTb3VyY2VDb2RlQXNzZXQnLCB7XG4gICAgICBwYXRoOiBhcmNoaXZlUGF0aCxcbiAgICB9KTtcbiAgICAvLyBuZXcgQXNzZXQoKSBjcmVhdGVzIGNvcHkgb2YgemlwIGludG8gY2RrLm91dC8uIFRoaXMgY2xlYW5zIHVwIHRtcCBmb2xkZXJcbiAgICBybVN5bmMoYXJjaGl2ZVBhdGgsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIHJldHVybiBhc3NldDtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlRGVzdGluYXRpb25Db2RlQXNzZXQoKSB7XG4gICAgLy8gY3JlYXRlIGR1bW15IGRpcmVjdG9yeSB0byB1cGxvYWQgd2l0aCByYW5kb20gdmFsdWVzIHNvIGl0J3MgdXBsb2FkZWQgZWFjaCB0aW1lXG4gICAgLy8gVE9ETzogbG9vayBpbnRvIGNhY2hpbmc/XG4gICAgY29uc3QgYXNzZXRzVG1wRGlyID0gbWtkdGVtcFN5bmMocmVzb2x2ZSh0bXBkaXIoKSwgJ2J1Y2tldC1kZXBsb3ltZW50LWRlc3QtYXNzZXQtJykpO1xuICAgIC8vIHRoaXMgY29kZSB3aWxsIG5ldmVyIHJ1biBiL2Mgd2UgZXhwbGljaXRseSBkZWNsYXJlIGRlcGVuZGVuY3kgYmV0d2VlblxuICAgIC8vIGxhbWJkYSBmdW5jdGlvbiBhbmQgYnVja2V0IGRlcGxveW1lbnQuXG4gICAgd3JpdGVGaWxlU3luYyhyZXNvbHZlKGFzc2V0c1RtcERpciwgJ2luZGV4Lm1qcycpLCBgZXhwb3J0IGZ1bmN0aW9uIGhhbmRsZXIoKSB7IHJldHVybiAnJHtyYW5kb21VVUlEKCl9JyB9YCk7XG4gICAgY29uc3QgZGVzdGluYXRpb25Bc3NldCA9IG5ldyBBc3NldCh0aGlzLCAnRGVzdGluYXRpb25Db2RlQXNzZXQnLCB7XG4gICAgICBwYXRoOiBhc3NldHNUbXBEaXIsXG4gICAgfSk7XG4gICAgcm1TeW5jKGFzc2V0c1RtcERpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgcmV0dXJuIGRlc3RpbmF0aW9uQXNzZXQ7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUJ1Y2tldERlcGxveW1lbnQoc291cmNlQXNzZXQ6IEFzc2V0LCBkZXN0aW5hdGlvbkFzc2V0OiBBc3NldCkge1xuICAgIGNvbnN0IGJ1Y2tldERlcGxveW1lbnQgPSBuZXcgTmV4dGpzQnVja2V0RGVwbG95bWVudCh0aGlzLCAnQnVja2V0RGVwbG95bWVudCcsIHtcbiAgICAgIGFzc2V0OiBzb3VyY2VBc3NldCxcbiAgICAgIGRlYnVnOiB0cnVlLFxuICAgICAgZGVzdGluYXRpb25CdWNrZXQ6IGRlc3RpbmF0aW9uQXNzZXQuYnVja2V0LFxuICAgICAgZGVzdGluYXRpb25LZXlQcmVmaXg6IGRlc3RpbmF0aW9uQXNzZXQuczNPYmplY3RLZXksXG4gICAgICBwcnVuZTogdHJ1ZSxcbiAgICAgIC8vIHRoaXMucHJvcHMuZW52aXJvbm1lbnQgaXMgZm9yIGJ1aWxkIHRpbWUsIG5vdCB0aGlzLmVudmlyb25tZW50IHdoaWNoIGlzIGZvciBydW50aW1lXG4gICAgICBzdWJzdGl0dXRpb25Db25maWc6IE5leHRqc0J1Y2tldERlcGxveW1lbnQuZ2V0U3Vic3RpdHV0aW9uQ29uZmlnKHRoaXMucHJvcHMuZW52aXJvbm1lbnQgfHwge30pLFxuICAgICAgemlwOiB0cnVlLFxuICAgIH0pO1xuICAgIHJldHVybiBidWNrZXREZXBsb3ltZW50O1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVGdW5jdGlvbihhc3NldDogQXNzZXQpIHtcbiAgICAvLyBjYW5ub3QgdXNlIE5vZGVqc0Z1bmN0aW9uIGJlY2F1c2Ugd2UgbXVzdCB3YWl0IHRvIGRlcGxveSB0aGUgZnVuY3Rpb25cbiAgICAvLyB1bnRpbCBhZnRlciB0aGUgYnVpbGQgdGltZSBlbnYgdmFycyBpbiBjb2RlIHppcCBhc3NldCBhcmUgc3Vic3RpdHV0ZWRcbiAgICBjb25zdCBmbiA9IG5ldyBGdW5jdGlvbih0aGlzLCAnRm4nLCB7XG4gICAgICAuLi5nZXRDb21tb25GdW5jdGlvblByb3BzKHRoaXMpLFxuICAgICAgY29kZTogQ29kZS5mcm9tQnVja2V0KGFzc2V0LmJ1Y2tldCwgYXNzZXQuczNPYmplY3RLZXkpLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgLi4udGhpcy5wcm9wcy5sYW1iZGEsXG4gICAgICAvLyBgZW52aXJvbm1lbnRgIG5lZWRzIHRvIGdvIGFmdGVyIGB0aGlzLnByb3BzLmxhbWJkYWAgYi9jIGlmXG4gICAgICAvLyBgdGhpcy5wcm9wcy5sYW1iZGEuZW52aXJvbm1lbnRgIGlzIGRlZmluZWQsIGl0IHdpbGwgb3ZlcnJpZGVcbiAgICAgIC8vIENBQ0hFXyogZW52aXJvbm1lbnQgdmFyaWFibGVzIHdoaWNoIGFyZSByZXF1aXJlZFxuICAgICAgZW52aXJvbm1lbnQ6IHsgLi4udGhpcy5lbnZpcm9ubWVudCwgLi4udGhpcy5wcm9wcy5sYW1iZGE/LmVudmlyb25tZW50IH0sXG4gICAgfSk7XG4gICAgdGhpcy5wcm9wcy5zdGF0aWNBc3NldEJ1Y2tldC5ncmFudFJlYWRXcml0ZShmbik7XG5cbiAgICByZXR1cm4gZm47XG4gIH1cbn1cbiJdfQ==