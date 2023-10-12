"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextjsBuild = void 0;
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const child_process_1 = require("child_process");
const fs = require("fs");
const path = require("path");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const constructs_1 = require("constructs");
const constants_1 = require("./constants");
const NextjsBucketDeployment_1 = require("./NextjsBucketDeployment");
const list_directories_1 = require("./utils/list-directories");
/**
 * Build Next.js app.
 */
class NextjsBuild extends constructs_1.Construct {
    /**
     * Contains server code and dependencies.
     */
    get nextServerFnDir() {
        const dir = path.join(this.getNextBuildDir(), constants_1.NEXTJS_BUILD_SERVER_FN_DIR);
        this.warnIfMissing(dir);
        return dir;
    }
    /**
     * Contains function for processessing image requests.
     * Should be arm64.
     */
    get nextImageFnDir() {
        const fnPath = path.join(this.getNextBuildDir(), constants_1.NEXTJS_BUILD_IMAGE_FN_DIR);
        this.warnIfMissing(fnPath);
        return fnPath;
    }
    /**
     * Contains function for processing items from revalidation queue.
     */
    get nextRevalidateFnDir() {
        const fnPath = path.join(this.getNextBuildDir(), constants_1.NEXTJS_BUILD_REVALIDATE_FN_DIR);
        this.warnIfMissing(fnPath);
        return fnPath;
    }
    /**
     * Static files containing client-side code.
     */
    get nextStaticDir() {
        const dir = path.join(this.getNextBuildDir(), constants_1.NEXTJS_STATIC_DIR);
        this.warnIfMissing(dir);
        return dir;
    }
    /**
     * Cache directory for generated data.
     */
    get nextCacheDir() {
        const dir = path.join(this.getNextBuildDir(), constants_1.NEXTJS_CACHE_DIR);
        this.warnIfMissing(dir);
        return dir;
    }
    constructor(scope, id, props) {
        super(scope, id);
        this.props = props;
        this.validatePaths();
        // when `cdk deploy "NonNextjsStack" --exclusively` is run, don't run build
        if (aws_cdk_lib_1.Stack.of(this).bundlingRequired && !this.props.skipBuild) {
            this.build();
        }
    }
    /**
     * Validate required paths/files for NextjsBuild
     */
    validatePaths() {
        const nextjsPath = this.props.nextjsPath;
        // validate site path exists
        if (!fs.existsSync(nextjsPath)) {
            throw new Error(`Invalid nextjsPath ${nextjsPath} - directory does not exist at "${path.resolve(nextjsPath)}"`);
        }
        // Ensure that the site has a build script defined
        if (!fs.existsSync(path.join(nextjsPath, 'package.json'))) {
            throw new Error(`No package.json found at "${nextjsPath}".`);
        }
        const packageJson = JSON.parse(fs.readFileSync(path.join(nextjsPath, 'package.json'), 'utf8'));
        if (!packageJson.scripts || !packageJson.scripts.build) {
            throw new Error(`No "build" script found within package.json in "${nextjsPath}".`);
        }
    }
    build() {
        const buildPath = this.props.buildPath ?? this.props.nextjsPath;
        const buildCommand = this.props.buildCommand ?? 'npx open-next@2 build';
        // run build
        if (!this.props.quiet) {
            console.debug(`├ Running "${buildCommand}" in`, buildPath);
        }
        // will throw if build fails - which is desired
        (0, child_process_1.execSync)(buildCommand, {
            cwd: buildPath,
            stdio: this.props.quiet ? 'ignore' : 'inherit',
            env: this.getBuildEnvVars(),
        });
    }
    /**
     * Gets environment variables for build time (when `open-next build` is called).
     * Unresolved tokens are replace with placeholders like {{ TOKEN_NAME }} and
     * will be resolved later in `NextjsBucketDeployment` custom resource.
     */
    getBuildEnvVars() {
        const env = {};
        for (const [k, v] of Object.entries(process.env)) {
            if (v) {
                env[k] = v;
            }
        }
        for (const [k, v] of Object.entries(this.props.environment || {})) {
            // don't replace server only env vars for static assets
            if (aws_cdk_lib_1.Token.isUnresolved(v) && k.startsWith('NEXT_PUBLIC_')) {
                env[k] = NextjsBucketDeployment_1.NextjsBucketDeployment.getSubstitutionValue(k);
            }
            else {
                env[k] = v;
            }
        }
        return env;
    }
    readPublicFileList() {
        if (!fs.existsSync(this.nextStaticDir))
            return [];
        return (0, list_directories_1.listDirectory)(this.nextStaticDir).map((file) => path.join('/', path.relative(this.nextStaticDir, file)));
    }
    getNextBuildDir() {
        const dir = path.resolve(this.props.nextjsPath, constants_1.NEXTJS_BUILD_DIR);
        this.warnIfMissing(dir);
        return dir;
    }
    warnIfMissing(dir) {
        if (!fs.existsSync(dir)) {
            console.warn(`Warning: ${dir} does not exist.`);
        }
    }
}
_a = JSII_RTTI_SYMBOL_1;
NextjsBuild[_a] = { fqn: "cdk-nextjs-standalone.NextjsBuild", version: "4.0.0-beta.3" };
exports.NextjsBuild = NextjsBuild;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTmV4dGpzQnVpbGQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvTmV4dGpzQnVpbGQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxpREFBeUM7QUFDekMseUJBQXlCO0FBQ3pCLDZCQUE2QjtBQUM3Qiw2Q0FBMkM7QUFDM0MsMkNBQXVDO0FBQ3ZDLDJDQU9xQjtBQUVyQixxRUFBa0U7QUFDbEUsK0RBQXlEO0FBU3pEOztHQUVHO0FBQ0gsTUFBYSxXQUFZLFNBQVEsc0JBQVM7SUFDeEM7O09BRUc7SUFDSCxJQUFXLGVBQWU7UUFDeEIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLEVBQUUsc0NBQTBCLENBQUMsQ0FBQztRQUMxRSxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQztJQUNEOzs7T0FHRztJQUNILElBQVcsY0FBYztRQUN2QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsRUFBRSxxQ0FBeUIsQ0FBQyxDQUFDO1FBQzVFLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0IsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUNEOztPQUVHO0lBQ0gsSUFBVyxtQkFBbUI7UUFDNUIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLEVBQUUsMENBQThCLENBQUMsQ0FBQztRQUNqRixJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNCLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFDRDs7T0FFRztJQUNILElBQVcsYUFBYTtRQUN0QixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsRUFBRSw2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LENBQUMsQ0FBQztRQUN4QixPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7SUFFTyxhQUFhLENBQUMsR0FBVztRQUMvQixJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUN2QixPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksR0FBRyxrQkFBa0IsQ0FBQyxDQUFDO1NBQ2pEO0lBQ0gsQ0FBQzs7OztBQS9IVSxrQ0FBVyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgU3RhY2ssIFRva2VuIH0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQge1xuICBORVhUSlNfQlVJTERfRElSLFxuICBORVhUSlNfQlVJTERfSU1BR0VfRk5fRElSLFxuICBORVhUSlNfQlVJTERfUkVWQUxJREFURV9GTl9ESVIsXG4gIE5FWFRKU19CVUlMRF9TRVJWRVJfRk5fRElSLFxuICBORVhUSlNfQ0FDSEVfRElSLFxuICBORVhUSlNfU1RBVElDX0RJUixcbn0gZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IHsgTmV4dGpzQmFzZVByb3BzIH0gZnJvbSAnLi9OZXh0anNCYXNlJztcbmltcG9ydCB7IE5leHRqc0J1Y2tldERlcGxveW1lbnQgfSBmcm9tICcuL05leHRqc0J1Y2tldERlcGxveW1lbnQnO1xuaW1wb3J0IHsgbGlzdERpcmVjdG9yeSB9IGZyb20gJy4vdXRpbHMvbGlzdC1kaXJlY3Rvcmllcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTmV4dGpzQnVpbGRQcm9wcyBleHRlbmRzIE5leHRqc0Jhc2VQcm9wcyB7XG4gIC8qKlxuICAgKiBAc2VlIGBOZXh0anNQcm9wcy5za2lwQnVpbGRgXG4gICAqL1xuICByZWFkb25seSBza2lwQnVpbGQ/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIEJ1aWxkIE5leHQuanMgYXBwLlxuICovXG5leHBvcnQgY2xhc3MgTmV4dGpzQnVpbGQgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICAvKipcbiAgICogQ29udGFpbnMgc2VydmVyIGNvZGUgYW5kIGRlcGVuZGVuY2llcy5cbiAgICovXG4gIHB1YmxpYyBnZXQgbmV4dFNlcnZlckZuRGlyKCk6IHN0cmluZyB7XG4gICAgY29uc3QgZGlyID0gcGF0aC5qb2luKHRoaXMuZ2V0TmV4dEJ1aWxkRGlyKCksIE5FWFRKU19CVUlMRF9TRVJWRVJfRk5fRElSKTtcbiAgICB0aGlzLndhcm5JZk1pc3NpbmcoZGlyKTtcbiAgICByZXR1cm4gZGlyO1xuICB9XG4gIC8qKlxuICAgKiBDb250YWlucyBmdW5jdGlvbiBmb3IgcHJvY2Vzc2Vzc2luZyBpbWFnZSByZXF1ZXN0cy5cbiAgICogU2hvdWxkIGJlIGFybTY0LlxuICAgKi9cbiAgcHVibGljIGdldCBuZXh0SW1hZ2VGbkRpcigpOiBzdHJpbmcge1xuICAgIGNvbnN0IGZuUGF0aCA9IHBhdGguam9pbih0aGlzLmdldE5leHRCdWlsZERpcigpLCBORVhUSlNfQlVJTERfSU1BR0VfRk5fRElSKTtcbiAgICB0aGlzLndhcm5JZk1pc3NpbmcoZm5QYXRoKTtcbiAgICByZXR1cm4gZm5QYXRoO1xuICB9XG4gIC8qKlxuICAgKiBDb250YWlucyBmdW5jdGlvbiBmb3IgcHJvY2Vzc2luZyBpdGVtcyBmcm9tIHJldmFsaWRhdGlvbiBxdWV1ZS5cbiAgICovXG4gIHB1YmxpYyBnZXQgbmV4dFJldmFsaWRhdGVGbkRpcigpOiBzdHJpbmcge1xuICAgIGNvbnN0IGZuUGF0aCA9IHBhdGguam9pbih0aGlzLmdldE5leHRCdWlsZERpcigpLCBORVhUSlNfQlVJTERfUkVWQUxJREFURV9GTl9ESVIpO1xuICAgIHRoaXMud2FybklmTWlzc2luZyhmblBhdGgpO1xuICAgIHJldHVybiBmblBhdGg7XG4gIH1cbiAgLyoqXG4gICAqIFN0YXRpYyBmaWxlcyBjb250YWluaW5nIGNsaWVudC1zaWRlIGNvZGUuXG4gICAqL1xuICBwdWJsaWMgZ2V0IG5leHRTdGF0aWNEaXIoKTogc3RyaW5nIHtcbiAgICBjb25zdCBkaXIgPSBwYXRoLmpvaW4odGhpcy5nZXROZXh0QnVpbGREaXIoKSwgTkVYVEpTX1NUQVRJQ19ESVIpO1xuICAgIHRoaXMud2FybklmTWlzc2luZyhkaXIpO1xuICAgIHJldHVybiBkaXI7XG4gIH1cbiAgLyoqXG4gICAqIENhY2hlIGRpcmVjdG9yeSBmb3IgZ2VuZXJhdGVkIGRhdGEuXG4gICAqL1xuICBwdWJsaWMgZ2V0IG5leHRDYWNoZURpcigpOiBzdHJpbmcge1xuICAgIGNvbnN0IGRpciA9IHBhdGguam9pbih0aGlzLmdldE5leHRCdWlsZERpcigpLCBORVhUSlNfQ0FDSEVfRElSKTtcbiAgICB0aGlzLndhcm5JZk1pc3NpbmcoZGlyKTtcbiAgICByZXR1cm4gZGlyO1xuICB9XG5cbiAgcHVibGljIHByb3BzOiBOZXh0anNCdWlsZFByb3BzO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBOZXh0anNCdWlsZFByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcbiAgICB0aGlzLnByb3BzID0gcHJvcHM7XG4gICAgdGhpcy52YWxpZGF0ZVBhdGhzKCk7XG4gICAgLy8gd2hlbiBgY2RrIGRlcGxveSBcIk5vbk5leHRqc1N0YWNrXCIgLS1leGNsdXNpdmVseWAgaXMgcnVuLCBkb24ndCBydW4gYnVpbGRcbiAgICBpZiAoU3RhY2sub2YodGhpcykuYnVuZGxpbmdSZXF1aXJlZCAmJiAhdGhpcy5wcm9wcy5za2lwQnVpbGQpIHtcbiAgICAgIHRoaXMuYnVpbGQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgcmVxdWlyZWQgcGF0aHMvZmlsZXMgZm9yIE5leHRqc0J1aWxkXG4gICAqL1xuICBwcml2YXRlIHZhbGlkYXRlUGF0aHMoKSB7XG4gICAgY29uc3QgbmV4dGpzUGF0aCA9IHRoaXMucHJvcHMubmV4dGpzUGF0aDtcbiAgICAvLyB2YWxpZGF0ZSBzaXRlIHBhdGggZXhpc3RzXG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKG5leHRqc1BhdGgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgbmV4dGpzUGF0aCAke25leHRqc1BhdGh9IC0gZGlyZWN0b3J5IGRvZXMgbm90IGV4aXN0IGF0IFwiJHtwYXRoLnJlc29sdmUobmV4dGpzUGF0aCl9XCJgKTtcbiAgICB9XG4gICAgLy8gRW5zdXJlIHRoYXQgdGhlIHNpdGUgaGFzIGEgYnVpbGQgc2NyaXB0IGRlZmluZWRcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMocGF0aC5qb2luKG5leHRqc1BhdGgsICdwYWNrYWdlLmpzb24nKSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gcGFja2FnZS5qc29uIGZvdW5kIGF0IFwiJHtuZXh0anNQYXRofVwiLmApO1xuICAgIH1cbiAgICBjb25zdCBwYWNrYWdlSnNvbiA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihuZXh0anNQYXRoLCAncGFja2FnZS5qc29uJyksICd1dGY4JykpO1xuICAgIGlmICghcGFja2FnZUpzb24uc2NyaXB0cyB8fCAhcGFja2FnZUpzb24uc2NyaXB0cy5idWlsZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBcImJ1aWxkXCIgc2NyaXB0IGZvdW5kIHdpdGhpbiBwYWNrYWdlLmpzb24gaW4gXCIke25leHRqc1BhdGh9XCIuYCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBidWlsZCgpIHtcbiAgICBjb25zdCBidWlsZFBhdGggPSB0aGlzLnByb3BzLmJ1aWxkUGF0aCA/PyB0aGlzLnByb3BzLm5leHRqc1BhdGg7XG4gICAgY29uc3QgYnVpbGRDb21tYW5kID0gdGhpcy5wcm9wcy5idWlsZENvbW1hbmQgPz8gJ25weCBvcGVuLW5leHRAMiBidWlsZCc7XG4gICAgLy8gcnVuIGJ1aWxkXG4gICAgaWYgKCF0aGlzLnByb3BzLnF1aWV0KSB7XG4gICAgICBjb25zb2xlLmRlYnVnKGDilJwgUnVubmluZyBcIiR7YnVpbGRDb21tYW5kfVwiIGluYCwgYnVpbGRQYXRoKTtcbiAgICB9XG4gICAgLy8gd2lsbCB0aHJvdyBpZiBidWlsZCBmYWlscyAtIHdoaWNoIGlzIGRlc2lyZWRcbiAgICBleGVjU3luYyhidWlsZENvbW1hbmQsIHtcbiAgICAgIGN3ZDogYnVpbGRQYXRoLFxuICAgICAgc3RkaW86IHRoaXMucHJvcHMucXVpZXQgPyAnaWdub3JlJyA6ICdpbmhlcml0JyxcbiAgICAgIGVudjogdGhpcy5nZXRCdWlsZEVudlZhcnMoKSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGVudmlyb25tZW50IHZhcmlhYmxlcyBmb3IgYnVpbGQgdGltZSAod2hlbiBgb3Blbi1uZXh0IGJ1aWxkYCBpcyBjYWxsZWQpLlxuICAgKiBVbnJlc29sdmVkIHRva2VucyBhcmUgcmVwbGFjZSB3aXRoIHBsYWNlaG9sZGVycyBsaWtlIHt7IFRPS0VOX05BTUUgfX0gYW5kXG4gICAqIHdpbGwgYmUgcmVzb2x2ZWQgbGF0ZXIgaW4gYE5leHRqc0J1Y2tldERlcGxveW1lbnRgIGN1c3RvbSByZXNvdXJjZS5cbiAgICovXG4gIHByaXZhdGUgZ2V0QnVpbGRFbnZWYXJzKCkge1xuICAgIGNvbnN0IGVudjogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKHByb2Nlc3MuZW52KSkge1xuICAgICAgaWYgKHYpIHtcbiAgICAgICAgZW52W2tdID0gdjtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXModGhpcy5wcm9wcy5lbnZpcm9ubWVudCB8fCB7fSkpIHtcbiAgICAgIC8vIGRvbid0IHJlcGxhY2Ugc2VydmVyIG9ubHkgZW52IHZhcnMgZm9yIHN0YXRpYyBhc3NldHNcbiAgICAgIGlmIChUb2tlbi5pc1VucmVzb2x2ZWQodikgJiYgay5zdGFydHNXaXRoKCdORVhUX1BVQkxJQ18nKSkge1xuICAgICAgICBlbnZba10gPSBOZXh0anNCdWNrZXREZXBsb3ltZW50LmdldFN1YnN0aXR1dGlvblZhbHVlKGspO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZW52W2tdID0gdjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVudjtcbiAgfVxuXG4gIHJlYWRQdWJsaWNGaWxlTGlzdCgpIHtcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmModGhpcy5uZXh0U3RhdGljRGlyKSkgcmV0dXJuIFtdO1xuICAgIHJldHVybiBsaXN0RGlyZWN0b3J5KHRoaXMubmV4dFN0YXRpY0RpcikubWFwKChmaWxlKSA9PiBwYXRoLmpvaW4oJy8nLCBwYXRoLnJlbGF0aXZlKHRoaXMubmV4dFN0YXRpY0RpciwgZmlsZSkpKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0TmV4dEJ1aWxkRGlyKCk6IHN0cmluZyB7XG4gICAgY29uc3QgZGlyID0gcGF0aC5yZXNvbHZlKHRoaXMucHJvcHMubmV4dGpzUGF0aCwgTkVYVEpTX0JVSUxEX0RJUik7XG4gICAgdGhpcy53YXJuSWZNaXNzaW5nKGRpcik7XG4gICAgcmV0dXJuIGRpcjtcbiAgfVxuXG4gIHByaXZhdGUgd2FybklmTWlzc2luZyhkaXI6IHN0cmluZykge1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhkaXIpKSB7XG4gICAgICBjb25zb2xlLndhcm4oYFdhcm5pbmc6ICR7ZGlyfSBkb2VzIG5vdCBleGlzdC5gKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==