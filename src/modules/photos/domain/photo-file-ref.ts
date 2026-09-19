export function patientPhotoFileRef(photoId: string, extension: string): string {
  return `${photoId.replace(/[^A-Za-z0-9._-]/g, '_')}.${extension}`;
}
