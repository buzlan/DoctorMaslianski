const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp']);

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/webp': 'webp',
};

export type CapturedImage = {
  sourceUri: string;
  mimeType?: string;
  fileName?: string;
};

export function resolveSourceExtension(image: CapturedImage): string | null {
  const fromName = extensionFromPath(image.fileName);
  if (fromName !== null) {
    return fromName;
  }

  if (typeof image.mimeType === 'string') {
    const fromMime = MIME_TO_EXTENSION[image.mimeType.toLowerCase()];
    if (fromMime !== undefined) {
      return fromMime;
    }
  }

  return extensionFromPath(image.sourceUri);
}

function extensionFromPath(path: string | undefined): string | null {
  if (typeof path !== 'string' || path.length === 0) {
    return null;
  }

  const withoutQuery = path.split('?')[0] ?? path;
  const lastSegment = withoutQuery.split('/').pop() ?? withoutQuery;
  const dot = lastSegment.lastIndexOf('.');
  if (dot <= 0 || dot === lastSegment.length - 1) {
    return null;
  }

  const extension = lastSegment.slice(dot + 1).toLowerCase();
  return ALLOWED_EXTENSIONS.has(extension) ? extension : null;
}
