import type { ClinicContact } from '../domain';
import {
  sharedClinicContactRepository,
  type ClinicContactRepository,
} from '../infrastructure';

export async function loadClinicContact(
  repository: ClinicContactRepository,
): Promise<ClinicContact> {
  try {
    return await repository.getContact();
  } catch {
    return {};
  }
}

export function loadSharedClinicContact(): Promise<ClinicContact> {
  return loadClinicContact(sharedClinicContactRepository);
}
