import { join } from 'path';
import { Architecture } from 'aws-cdk-lib/aws-lambda';
import { LogLevel, NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { NEXTJS_BUILD_INDEX_FILE } from './constants';
import { NextjsBaseProps } from './NextjsBase';
import type { NextjsBuild } from './NextjsBuild';
import { getCommonNodejsFunctionProps } from './utils/common-lambda-props';
import { fixPath } from './utils/convert-path';

export interface NextjsImageProps extends NextjsBaseProps {
  /**
   * The S3 bucket holding application images.
   */
  readonly bucket: IBucket;
  /**
   * Override function properties.
   */
  readonly lambdaOptions?: NodejsFunctionProps;
  /**
   * The `NextjsBuild` instance representing the built Nextjs application.
   */
  readonly nextBuild: NextjsBuild;
}

/**
 * This lambda handles image optimization.
 */
export class NextjsImage extends NodejsFunction {
  constructor(scope: Construct, id: string, props: NextjsImageProps) {
    const { lambdaOptions = {}, bucket } = props;
    const { architecture, ...lambdaOptionsWithoutArchitecture } = lambdaOptions;

    const nodejsFnProps = getCommonNodejsFunctionProps(scope);
    super(scope, id, {
      ...nodejsFnProps,
      bundling: {
        ...nodejsFnProps.bundling,
        logLevel: LogLevel.SILENT, // silence error on use of `eval` in node_module
        externalModules: ['sharp'],
        nodeModules: ['sharp'],
        commandHooks: {
          afterBundling: (_inputDir, outputDir) => [
            `cd ${outputDir}`,
            'rm -rf node_modules/sharp && npm install --no-save --arch=x86 --platform=linux sharp',
          ],
          beforeBundling: (_inputDir, outputDir) => [
            // copy non-bundled assets into zip. use node -e so cross-os compatible
            `node -e "fs.cpSync('${fixPath(props.nextBuild.nextImageFnDir)}', '${fixPath(
              outputDir
            )}', { recursive: true, filter: (src) => !src.includes('/node_modules') && !src.endsWith('index.mjs') })"`,
          ],
          beforeInstall: () => [],
        },
      },
      entry: join(props.nextBuild.nextImageFnDir, NEXTJS_BUILD_INDEX_FILE),
      handler: 'index.handler',
      description: 'Next.js Image Optimization Function',
      ...lambdaOptionsWithoutArchitecture,
      architecture: Architecture.ARM_64,
      environment: {
        BUCKET_NAME: bucket.bucketName,
        ...lambdaOptionsWithoutArchitecture?.environment,
      },
    });

    bucket.grantRead(this);
  }
}
