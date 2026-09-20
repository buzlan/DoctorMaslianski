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
export { ClinicContactSection } from './presentation';
