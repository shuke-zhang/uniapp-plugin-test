/**
 * 转化文件大小
 * @param bytes
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`
  }
  else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }
  else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }
}
