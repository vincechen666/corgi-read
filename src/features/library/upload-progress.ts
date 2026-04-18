export function toUploadProgressPercent(uploaded: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((uploaded / total) * 100)));
}
