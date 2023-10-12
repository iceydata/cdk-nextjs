export interface CreateArchiveArgs {
    readonly directory: string;
    readonly zipFileName: string;
    readonly fileGlob?: string;
    readonly quiet?: boolean;
}
/**
 * Zip up a directory and return path to zip file
 *
 * Cannot rely on native CDK zipping b/c it disregards symlinks which is necessary
 * for PNPM monorepos. See more here: https://github.com/aws/aws-cdk/issues/9251
 */
export declare function createArchive({ directory, zipFileName, fileGlob, quiet }: CreateArchiveArgs): string;
