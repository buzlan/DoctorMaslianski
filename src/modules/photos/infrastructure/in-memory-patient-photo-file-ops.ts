import type { PatientPhotoFileOps } from './patient-photo-file-ops';

export type InMemoryPatientPhotoFileOps = PatientPhotoFileOps & {
  copied: readonly string[];
  removed: readonly string[];
};

export function createInMemoryPatientPhotoFileOps(options?: {
  onCopy?: (sourceUri: string, treatmentId: string, localFileRef: string) => void;
  size?: number | null;
}): InMemoryPatientPhotoFileOps {
  const files = new Map<string, string>();
  const copied: string[] = [];
  const removed: string[] = [];

  return {
    copied,
    removed,
    copy(sourceUri, treatmentId, localFileRef) {
      options?.onCopy?.(sourceUri, treatmentId, localFileRef);
      const key = `${treatmentId}/${localFileRef}`;
      files.set(key, sourceUri);
      copied.push(key);
      return Promise.resolve();
    },
    remove(treatmentId, localFileRef) {
      const key = `${treatmentId}/${localFileRef}`;
      files.delete(key);
      removed.push(key);
      return Promise.resolve();
    },
    getSize() {
      if (options?.size === undefined) {
        return Promise.resolve(1024);
      }
      return Promise.resolve(options.size);
    },
    fileUri(treatmentId, localFileRef) {
      return `memory://${treatmentId}/${localFileRef}`;
    },
  };
}
