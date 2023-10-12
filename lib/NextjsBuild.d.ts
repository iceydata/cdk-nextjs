import { Construct } from 'constructs';
import { NextjsBaseProps } from './NextjsBase';
export interface NextjsBuildProps extends NextjsBaseProps {
    /**
     * @see `NextjsProps.skipBuild`
     */
    readonly skipBuild?: boolean;
}
/**
 * Build Next.js app.
 */
export declare class NextjsBuild extends Construct {
    /**
     * Contains server code and dependencies.
     */
    get nextServerFnDir(): string;
    /**
     * Contains function for processessing image requests.
     * Should be arm64.
     */
    get nextImageFnDir(): string;
    /**
     * Contains function for processing items from revalidation queue.
     */
    get nextRevalidateFnDir(): string;
    /**
     * Static files containing client-side code.
     */
    get nextStaticDir(): string;
    /**
     * Cache directory for generated data.
     */
    get nextCacheDir(): string;
    props: NextjsBuildProps;
    constructor(scope: Construct, id: string, props: NextjsBuildProps);
    /**
     * Validate required paths/files for NextjsBuild
     */
    private validatePaths;
    private build;
    /**
     * Gets environment variables for build time (when `open-next build` is called).
     * Unresolved tokens are replace with placeholders like {{ TOKEN_NAME }} and
     * will be resolved later in `NextjsBucketDeployment` custom resource.
     */
    private getBuildEnvVars;
    readPublicFileList(): string[];
    private getNextBuildDir;
    private warnIfMissing;
}
