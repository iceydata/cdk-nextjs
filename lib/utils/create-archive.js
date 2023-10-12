"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createArchive = void 0;
const node_child_process_1 = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
/**
 * Zip up a directory and return path to zip file
 *
 * Cannot rely on native CDK zipping b/c it disregards symlinks which is necessary
 * for PNPM monorepos. See more here: https://github.com/aws/aws-cdk/issues/9251
 */
function createArchive({ directory, zipFileName, fileGlob = '.', quiet }) {
    const zipOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdk-nextjs-archive-'));
    const zipFilePath = path.join(zipOutDir, zipFileName);
    // delete existing zip file
    if (fs.existsSync(zipFilePath)) {
        fs.unlinkSync(zipFilePath);
    }
    // run script to create zipfile, preserving symlinks for node_modules (e.g. pnpm structure)
    const isWindows = process.platform === 'win32';
    if (isWindows) {
        // TODO: test on windows
        (0, node_child_process_1.execSync)(`Compress-Archive -Path '${directory}\\*' -DestinationPath '${zipFilePath}' -CompressionLevel Optimal`, {
            stdio: 'inherit',
        });
    }
    else {
        (0, node_child_process_1.execSync)(`zip -ryq9 '${zipFilePath}' ${fileGlob}`, {
            stdio: quiet ? 'ignore' : 'inherit',
            cwd: directory,
        });
    }
    // check output
    if (!fs.existsSync(zipFilePath)) {
        throw new Error(`There was a problem generating the archive for ${directory}; the archive is missing in ${zipFilePath}.`);
    }
    return zipFilePath;
}
exports.createArchive = createArchive;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWFyY2hpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvY3JlYXRlLWFyY2hpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMkRBQThDO0FBQzlDLDhCQUE4QjtBQUM5Qiw4QkFBOEI7QUFDOUIsa0NBQWtDO0FBU2xDOzs7OztHQUtHO0FBQ0gsU0FBZ0IsYUFBYSxDQUFDLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxRQUFRLEdBQUcsR0FBRyxFQUFFLEtBQUssRUFBcUI7SUFDaEcsTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7SUFDaEYsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFFdEQsMkJBQTJCO0lBQzNCLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRTtRQUM5QixFQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQzVCO0lBRUQsMkZBQTJGO0lBQzNGLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTyxDQUFDO0lBQy9DLElBQUksU0FBUyxFQUFFO1FBQ2Isd0JBQXdCO1FBQ3hCLElBQUEsNkJBQVEsRUFBQywyQkFBMkIsU0FBUywwQkFBMEIsV0FBVyw2QkFBNkIsRUFBRTtZQUMvRyxLQUFLLEVBQUUsU0FBUztTQUNqQixDQUFDLENBQUM7S0FDSjtTQUFNO1FBQ0wsSUFBQSw2QkFBUSxFQUFDLGNBQWMsV0FBVyxLQUFLLFFBQVEsRUFBRSxFQUFFO1lBQ2pELEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBUztZQUNuQyxHQUFHLEVBQUUsU0FBUztTQUNmLENBQUMsQ0FBQztLQUNKO0lBQ0QsZUFBZTtJQUNmLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1FBQy9CLE1BQU0sSUFBSSxLQUFLLENBQ2Isa0RBQWtELFNBQVMsK0JBQStCLFdBQVcsR0FBRyxDQUN6RyxDQUFDO0tBQ0g7SUFFRCxPQUFPLFdBQVcsQ0FBQztBQUNyQixDQUFDO0FBOUJELHNDQThCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSAnbm9kZTpjaGlsZF9wcm9jZXNzJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0ICogYXMgb3MgZnJvbSAnbm9kZTpvcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ3JlYXRlQXJjaGl2ZUFyZ3Mge1xuICByZWFkb25seSBkaXJlY3Rvcnk6IHN0cmluZztcbiAgcmVhZG9ubHkgemlwRmlsZU5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgZmlsZUdsb2I/OiBzdHJpbmc7XG4gIHJlYWRvbmx5IHF1aWV0PzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBaaXAgdXAgYSBkaXJlY3RvcnkgYW5kIHJldHVybiBwYXRoIHRvIHppcCBmaWxlXG4gKlxuICogQ2Fubm90IHJlbHkgb24gbmF0aXZlIENESyB6aXBwaW5nIGIvYyBpdCBkaXNyZWdhcmRzIHN5bWxpbmtzIHdoaWNoIGlzIG5lY2Vzc2FyeVxuICogZm9yIFBOUE0gbW9ub3JlcG9zLiBTZWUgbW9yZSBoZXJlOiBodHRwczovL2dpdGh1Yi5jb20vYXdzL2F3cy1jZGsvaXNzdWVzLzkyNTFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUFyY2hpdmUoeyBkaXJlY3RvcnksIHppcEZpbGVOYW1lLCBmaWxlR2xvYiA9ICcuJywgcXVpZXQgfTogQ3JlYXRlQXJjaGl2ZUFyZ3MpOiBzdHJpbmcge1xuICBjb25zdCB6aXBPdXREaXIgPSBmcy5ta2R0ZW1wU3luYyhwYXRoLmpvaW4ob3MudG1wZGlyKCksICdjZGstbmV4dGpzLWFyY2hpdmUtJykpO1xuICBjb25zdCB6aXBGaWxlUGF0aCA9IHBhdGguam9pbih6aXBPdXREaXIsIHppcEZpbGVOYW1lKTtcblxuICAvLyBkZWxldGUgZXhpc3RpbmcgemlwIGZpbGVcbiAgaWYgKGZzLmV4aXN0c1N5bmMoemlwRmlsZVBhdGgpKSB7XG4gICAgZnMudW5saW5rU3luYyh6aXBGaWxlUGF0aCk7XG4gIH1cblxuICAvLyBydW4gc2NyaXB0IHRvIGNyZWF0ZSB6aXBmaWxlLCBwcmVzZXJ2aW5nIHN5bWxpbmtzIGZvciBub2RlX21vZHVsZXMgKGUuZy4gcG5wbSBzdHJ1Y3R1cmUpXG4gIGNvbnN0IGlzV2luZG93cyA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMic7XG4gIGlmIChpc1dpbmRvd3MpIHtcbiAgICAvLyBUT0RPOiB0ZXN0IG9uIHdpbmRvd3NcbiAgICBleGVjU3luYyhgQ29tcHJlc3MtQXJjaGl2ZSAtUGF0aCAnJHtkaXJlY3Rvcnl9XFxcXConIC1EZXN0aW5hdGlvblBhdGggJyR7emlwRmlsZVBhdGh9JyAtQ29tcHJlc3Npb25MZXZlbCBPcHRpbWFsYCwge1xuICAgICAgc3RkaW86ICdpbmhlcml0JyxcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBleGVjU3luYyhgemlwIC1yeXE5ICcke3ppcEZpbGVQYXRofScgJHtmaWxlR2xvYn1gLCB7XG4gICAgICBzdGRpbzogcXVpZXQgPyAnaWdub3JlJyA6ICdpbmhlcml0JyxcbiAgICAgIGN3ZDogZGlyZWN0b3J5LFxuICAgIH0pO1xuICB9XG4gIC8vIGNoZWNrIG91dHB1dFxuICBpZiAoIWZzLmV4aXN0c1N5bmMoemlwRmlsZVBhdGgpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYFRoZXJlIHdhcyBhIHByb2JsZW0gZ2VuZXJhdGluZyB0aGUgYXJjaGl2ZSBmb3IgJHtkaXJlY3Rvcnl9OyB0aGUgYXJjaGl2ZSBpcyBtaXNzaW5nIGluICR7emlwRmlsZVBhdGh9LmBcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIHppcEZpbGVQYXRoO1xufVxuIl19