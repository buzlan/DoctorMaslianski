const EXTENSION_TO_CONTENT_TYPE: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
  webp: 'image/webp',
};

export function contentTypeForExtension(extension: string): string | null {
  if (typeof extension !== 'string' || extension.length === 0) {
    return null;
  }

  return EXTENSION_TO_CONTENT_TYPE[extension.toLowerCase()] ?? null;
}
