import type { ClinicContact } from '../domain';

import type { ClinicContactRepository } from './clinic-contact-repository';

/**
 * Empty development fixture for clinic contact.
 *
 * This is not clinic-authored data. Do not seed a demo phone, email,
 * address, or booking URL merely to demonstrate UI.
 */
export function createFixtureClinicContactRepository(): ClinicContactRepository {
  return {
    getContact() {
      return Promise.resolve({});
    },
  };
}

export function createInMemoryClinicContactRepository(
  contact: ClinicContact = {},
): ClinicContactRepository {
  return {
    getContact() {
      return Promise.resolve(contact);
    },
  };
}
