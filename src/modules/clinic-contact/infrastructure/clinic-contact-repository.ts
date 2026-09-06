import type { ClinicContact } from '../domain';

/**
 * Read-only patient-app port for clinic contact / booking channels.
 *
 * Clinic-approved values arrive later from TASK-029 / TASK-031. This task
 * does not invent phone, email, or booking URLs.
 */
export type ClinicContactRepository = {
  getContact(): Promise<ClinicContact>;
};
