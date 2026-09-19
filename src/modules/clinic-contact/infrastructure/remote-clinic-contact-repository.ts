import type { RemotePatientContextResult } from '@/core/auth/remote-patient-context';
import { RetryableRemoteError } from '@/core/sync/remote-error';
import type { ClinicContact } from '../domain';
import type { ClinicContactRepository } from './clinic-contact-repository';

export type RemoteClinicContactRepositoryOptions = {
  resolveContext: () => Promise<RemotePatientContextResult>;
};

export function createRemoteClinicContactRepository(
  options: RemoteClinicContactRepositoryOptions,
): ClinicContactRepository {
  return {
    async getContact(): Promise<ClinicContact> {
      const result = await options.resolveContext();
      if (result.status === 'ready') {
        return result.context.contact;
      }

      if (result.status === 'unlinked' || result.status === 'unauthenticated') {
        return {};
      }

      throw new RetryableRemoteError('clinic contact unavailable');
    },
  };
}
