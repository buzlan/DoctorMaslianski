import { getRemoteAdapters } from '@/core/runtime/remote-adapters';
import { shouldUseRemoteRepositories } from '@/core/runtime/should-use-remote-repositories';

import type { ClinicContactRepository } from './clinic-contact-repository';
import { createFixtureClinicContactRepository } from './fixture-clinic-contact-repository';

const localClinicContactRepository = createFixtureClinicContactRepository();

function activeClinicContactRepository(): ClinicContactRepository {
  if (shouldUseRemoteRepositories()) {
    const remote = getRemoteAdapters();
    if (remote !== null) {
      return remote.clinicContact;
    }
  }

  return localClinicContactRepository;
}

export const sharedClinicContactRepository: ClinicContactRepository = {
  getContact() {
    return activeClinicContactRepository().getContact();
  },
};
