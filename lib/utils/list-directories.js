"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDirectory = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
/**
 * List files in directory, recursively.
 */
function listDirectory(dir) {
    const fileList = [];
    const publicFiles = (0, node_fs_1.readdirSync)(dir);
    for (const filename of publicFiles) {
        const filepath = (0, node_path_1.join)(dir, filename);
        const stat = (0, node_fs_1.statSync)(filepath);
        if (stat.isDirectory()) {
            fileList.push(...listDirectory(filepath));
        }
        else {
            fileList.push(filepath);
        }
    }
    return fileList;
}
exports.listDirectory = listDirectory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1kaXJlY3Rvcmllcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9saXN0LWRpcmVjdG9yaWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUFnRDtBQUNoRCx5Q0FBaUM7QUFFakM7O0dBRUc7QUFDSCxTQUFnQixhQUFhLENBQUMsR0FBVztJQUN2QyxNQUFNLFFBQVEsR0FBYSxFQUFFLENBQUM7SUFDOUIsTUFBTSxXQUFXLEdBQUcsSUFBQSxxQkFBVyxFQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3JDLEtBQUssTUFBTSxRQUFRLElBQUksV0FBVyxFQUFFO1FBQ2xDLE1BQU0sUUFBUSxHQUFHLElBQUEsZ0JBQUksRUFBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDckMsTUFBTSxJQUFJLEdBQUcsSUFBQSxrQkFBUSxFQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2hDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQ3RCLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztTQUMzQzthQUFNO1lBQ0wsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUN6QjtLQUNGO0lBQ0QsT0FBTyxRQUFRLENBQUM7QUFDbEIsQ0FBQztBQWJELHNDQWFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVhZGRpclN5bmMsIHN0YXRTeW5jIH0gZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAnbm9kZTpwYXRoJztcblxuLyoqXG4gKiBMaXN0IGZpbGVzIGluIGRpcmVjdG9yeSwgcmVjdXJzaXZlbHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaXN0RGlyZWN0b3J5KGRpcjogc3RyaW5nKSB7XG4gIGNvbnN0IGZpbGVMaXN0OiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBwdWJsaWNGaWxlcyA9IHJlYWRkaXJTeW5jKGRpcik7XG4gIGZvciAoY29uc3QgZmlsZW5hbWUgb2YgcHVibGljRmlsZXMpIHtcbiAgICBjb25zdCBmaWxlcGF0aCA9IGpvaW4oZGlyLCBmaWxlbmFtZSk7XG4gICAgY29uc3Qgc3RhdCA9IHN0YXRTeW5jKGZpbGVwYXRoKTtcbiAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICBmaWxlTGlzdC5wdXNoKC4uLmxpc3REaXJlY3RvcnkoZmlsZXBhdGgpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZmlsZUxpc3QucHVzaChmaWxlcGF0aCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBmaWxlTGlzdDtcbn1cbiJdfQ==