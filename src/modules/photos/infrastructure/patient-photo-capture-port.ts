import type { CapturedImage } from '../domain';

export type PatientPhotoCaptureResult =
  | { status: 'captured'; image: CapturedImage }
  | { status: 'cancelled' }
  | { status: 'permission_denied' }
  | { status: 'unavailable' };

export type PatientPhotoCapturePort = {
  captureFromCamera(): Promise<PatientPhotoCaptureResult>;
  pickFromLibrary(): Promise<PatientPhotoCaptureResult>;
};
