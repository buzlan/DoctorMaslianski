import {
  createFixtureClinicContactRepository,
  createInMemoryClinicContactRepository,
} from '../infrastructure';

import { loadClinicContact } from './load-clinic-contact';

describe('loadClinicContact', () => {
  it('returns the repository contact', async () => {
    await expect(
      loadClinicContact(
        createInMemoryClinicContactRepository({
          email: 'clinic@example.com',
        }),
      ),
    ).resolves.toEqual({ email: 'clinic@example.com' });
  });

  it('returns an empty contact when the repository rejects', async () => {
    await expect(
      loadClinicContact({
        getContact() {
          return Promise.reject(new Error('unavailable'));
        },
      }),
    ).resolves.toEqual({});
  });

  it('does not invent phone, email, or booking URL for the empty fixture', async () => {
    await expect(loadClinicContact(createFixtureClinicContactRepository())).resolves.toEqual({});
    await expect(loadClinicContact(createInMemoryClinicContactRepository())).resolves.toEqual({});
  });
});
