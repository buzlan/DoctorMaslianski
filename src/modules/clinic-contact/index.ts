export { clinicContactChannels, hasClinicContactChannel } from './domain';
export type {
  ClinicContact,
  ClinicContactChannel,
  ClinicContactChannelKind,
} from './domain';
export { loadClinicContact, loadSharedClinicContact } from './application';
export {
  createFixtureClinicContactRepository,
  createInMemoryClinicContactRepository,
  sharedClinicContactRepository,
} from './infrastructure';
export type { ClinicContactRepository } from './infrastructure';
export { CLINIC_FEEDBACK_URL, CLINIC_WEBSITE_URL, PUBLIC_CLINIC_PHONES } from './public-clinic';
export { ClinicContactSection, PublicClinicContact } from './presentation';
