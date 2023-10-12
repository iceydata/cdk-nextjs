"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixPath = void 0;
/**
 * Fixes windows paths. Does not alter unix paths.
 */
function fixPath(path) {
    return path.replace(/\/\//g, '/');
}
exports.fixPath = fixPath;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydC1wYXRoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWxzL2NvbnZlcnQtcGF0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQTs7R0FFRztBQUNILFNBQWdCLE9BQU8sQ0FBQyxJQUFZO0lBQ2xDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDcEMsQ0FBQztBQUZELDBCQUVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBGaXhlcyB3aW5kb3dzIHBhdGhzLiBEb2VzIG5vdCBhbHRlciB1bml4IHBhdGhzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZml4UGF0aChwYXRoOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHBhdGgucmVwbGFjZSgvXFwvXFwvL2csICcvJyk7XG59XG4iXX0=