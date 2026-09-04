import * as ImagePicker from 'expo-image-picker';

import type { CapturedImage } from '../domain';

import type {
  PatientPhotoCapturePort,
  PatientPhotoCaptureResult,
} from './patient-photo-capture-port';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: false,
};

function toCaptured(asset: ImagePicker.ImagePickerAsset): CapturedImage | null {
  if (typeof asset.uri !== 'string' || asset.uri.length === 0) {
    return null;
  }

  const image: CapturedImage = { sourceUri: asset.uri };
  if (typeof asset.mimeType === 'string' && asset.mimeType.length > 0) {
    image.mimeType = asset.mimeType;
  }
  if (typeof asset.fileName === 'string' && asset.fileName.length > 0) {
    image.fileName = asset.fileName;
  }
  return image;
}

function fromPickerResult(
  result: ImagePicker.ImagePickerResult,
): PatientPhotoCaptureResult {
  if (result.canceled) {
    return { status: 'cancelled' };
  }

  const image = result.assets[0] === undefined ? null : toCaptured(result.assets[0]);
  if (image === null) {
    return { status: 'unavailable' };
  }

  return { status: 'captured', image };
}

export function createExpoImagePickerCapture(
  picker: Pick<
    typeof ImagePicker,
    | 'requestCameraPermissionsAsync'
    | 'requestMediaLibraryPermissionsAsync'
    | 'launchCameraAsync'
    | 'launchImageLibraryAsync'
  > = ImagePicker,
): PatientPhotoCapturePort {
  return {
    async captureFromCamera() {
      try {
        const permission = await picker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          return { status: 'permission_denied' };
        }
        return fromPickerResult(await picker.launchCameraAsync(PICKER_OPTIONS));
      } catch {
        return { status: 'unavailable' };
      }
    },
    async pickFromLibrary() {
      try {
        const permission = await picker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          return { status: 'permission_denied' };
        }
        return fromPickerResult(await picker.launchImageLibraryAsync(PICKER_OPTIONS));
      } catch {
        return { status: 'unavailable' };
      }
    },
  };
}
