import {
  getAuthSessionSnapshot,
} from '../auth/auth-session';
import { getSharedRemotePatientContextResolver } from '../auth/shared-remote-patient-context';
import { createAsyncStorageWriteOutboxStore } from '../sync/async-storage-write-outbox-store';
import { registerRemoteOutboxFlusher } from '../sync/remote-outbox-flush';
import { createSecureStoreWriteOutboxStore } from '../sync/secure-store-write-outbox-store';
import { getSharedSupabaseClient } from '../supabase/client';
import type { ClinicContactRepository } from '@/modules/clinic-contact/infrastructure/clinic-contact-repository';
import { createRemoteClinicContactRepository } from '@/modules/clinic-contact/infrastructure/remote-clinic-contact-repository';
import type { DiaryRepository } from '@/modules/diary/infrastructure/diary-repository';
import { createSupabaseDiaryGateway } from '@/modules/diary/infrastructure/diary-remote-gateway';
import { createRemoteDiaryRepository } from '@/modules/diary/infrastructure/remote-diary-repository';
import type { FeedbackSurveyRepository } from '@/modules/feedback/infrastructure/feedback-survey-repository';
import { createRemoteFeedbackSurveyRepository, createSupabaseFeedbackGateway } from '@/modules/feedback/infrastructure/remote-feedback-survey-repository';
import type { DoctorMilestonePhotoRepository } from '@/modules/photos/infrastructure/doctor-milestone-photo-repository';
import {
  createRemoteDoctorMilestonePhotoRepository,
  createSupabaseDoctorMilestonePhotoGateway,
} from '@/modules/photos/infrastructure/remote-doctor-milestone-photo-repository';
import {
  createRemoteProductEventSink,
  createSupabaseProductEventGateway,
  type FlushableProductEventSink,
} from '@/modules/product-events/infrastructure/remote-product-event-sink';
import { createRemoteTreatmentRepository } from '@/modules/treatment/infrastructure/remote-treatment-repository';
import { createSupabaseTreatmentGateway } from '@/modules/treatment/infrastructure/treatment-remote-gateway';
import type { TreatmentRepository } from '@/modules/treatment/infrastructure/treatment-repository';

function readAuthUserId(): string | null {
  const auth = getAuthSessionSnapshot();
  return auth.status === 'authenticated' ? auth.userId : null;
}

async function resolveContext() {
  const resolver = getSharedRemotePatientContextResolver();
  if (resolver === null) {
    return { status: 'unauthenticated' as const };
  }

  return resolver.resolve();
}

type RemoteAdapters = {
  treatment: TreatmentRepository;
  diary: DiaryRepository;
  clinicContact: ClinicContactRepository;
  doctorPhotos: DoctorMilestonePhotoRepository;
  feedback: FeedbackSurveyRepository;
  productEvents: FlushableProductEventSink;
};

let adapters: RemoteAdapters | null = null;

export function getRemoteAdapters(): RemoteAdapters | null {
  const client = getSharedSupabaseClient();
  if (client === null) {
    return null;
  }

  if (adapters !== null) {
    return adapters;
  }

  const treatment = createRemoteTreatmentRepository({
    gateway: createSupabaseTreatmentGateway(client),
    resolveContext,
    outboxStore: createAsyncStorageWriteOutboxStore('remote.outbox.v1.completions'),
    readAuthUserId,
  });

  const diary = createRemoteDiaryRepository({
    gateway: createSupabaseDiaryGateway(client),
    resolveContext,
    outboxStore: createSecureStoreWriteOutboxStore('remote.outbox.v1.diary'),
    readAuthUserId,
  });

  const feedback = createRemoteFeedbackSurveyRepository({
    gateway: createSupabaseFeedbackGateway(client),
    resolveContext,
    outboxStore: createAsyncStorageWriteOutboxStore('remote.outbox.v1.feedback'),
    readAuthUserId,
  });

  const productEvents = createRemoteProductEventSink({
    gateway: createSupabaseProductEventGateway(client),
    resolveContext,
    outboxStore: createAsyncStorageWriteOutboxStore('remote.outbox.v1.product-events'),
    readAuthUserId,
  });

  adapters = {
    treatment,
    diary,
    clinicContact: createRemoteClinicContactRepository({ resolveContext }),
    doctorPhotos: createRemoteDoctorMilestonePhotoRepository({
      gateway: createSupabaseDoctorMilestonePhotoGateway(client),
    }),
    feedback,
    productEvents,
  };

  registerRemoteOutboxFlusher(() => productEvents.flush());
  registerRemoteOutboxFlusher(async () => {
    const current = await treatment.getActiveTreatment();
    if (current !== null) {
      await Promise.all([
        diary.listEntries(current.id),
        feedback.getSurvey(current.id),
      ]);
    }
  });

  return adapters;
}

export function resetRemoteAdaptersForTests(): void {
  adapters = null;
}
