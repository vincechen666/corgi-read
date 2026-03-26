type UploadQuotaInput = {
  incomingFileSizeBytes: number;
  storageQuotaBytes?: number;
  storageUsedBytes?: number;
};

export function canUploadFileWithinQuota({
  incomingFileSizeBytes,
  storageQuotaBytes,
  storageUsedBytes,
}: UploadQuotaInput) {
  if (storageQuotaBytes === undefined || storageUsedBytes === undefined) {
    return true;
  }

  return storageUsedBytes + incomingFileSizeBytes <= storageQuotaBytes;
}
