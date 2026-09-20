import {
  createInvalidationController,
  type InvalidationController,
} from './create-invalidation-controller';

export const INVALIDATION_TARGETS = [
  'treatment-shell',
  'today',
  'diary',
  'treatment',
  'milestone-detail',
] as const;

export type InvalidationTarget = (typeof INVALIDATION_TARGETS)[number];

export const INVALIDATION_HINTS = [
  'treatments',
  'treatment_periods',
  'action_assignments',
  'appointments',
  'treatment_milestones',
  'doctor_milestone_photos',
] as const;

export type InvalidationHint = (typeof INVALIDATION_HINTS)[number];

export const HINT_TARGETS: Record<InvalidationHint, readonly InvalidationTarget[]> = {
  treatments: ['treatment-shell', 'today', 'treatment'],
  treatment_periods: ['today', 'treatment'],
  action_assignments: ['today', 'treatment'],
  appointments: ['today', 'treatment'],
  treatment_milestones: ['treatment'],
  doctor_milestone_photos: ['treatment', 'milestone-detail'],
};

type InvalidationListener = () => unknown | Promise<unknown>;

const listeners = new Map<InvalidationTarget, Set<InvalidationListener>>();
const controllers = new Map<InvalidationTarget, InvalidationController>();

function listenersFor(target: InvalidationTarget): Set<InvalidationListener> {
  const existing = listeners.get(target);
  if (existing !== undefined) {
    return existing;
  }

  const created = new Set<InvalidationListener>();
  listeners.set(target, created);
  return created;
}

function controllerFor(target: InvalidationTarget): InvalidationController {
  const existing = controllers.get(target);
  if (existing !== undefined) {
    return existing;
  }

  const created = createInvalidationController({
    async run() {
      await Promise.all([...listenersFor(target)].map((listener) => listener()));
    },
  });
  controllers.set(target, created);
  return created;
}

export function targetsForHint(hint: InvalidationHint): readonly InvalidationTarget[] {
  return HINT_TARGETS[hint];
}

export function isInvalidationHint(value: string): value is InvalidationHint {
  return (INVALIDATION_HINTS as readonly string[]).includes(value);
}

export function subscribeCanonicalInvalidation(
  target: InvalidationTarget,
  listener: InvalidationListener,
): () => void {
  listenersFor(target).add(listener);
  return () => {
    listenersFor(target).delete(listener);
  };
}

export function invalidateTargets(targets: readonly InvalidationTarget[]): void {
  for (const target of targets) {
    controllerFor(target).invalidate();
  }
}

export function invalidateFromHint(hint: InvalidationHint): void {
  invalidateTargets(targetsForHint(hint));
}

export async function flushSubscribedTargets(): Promise<void> {
  await Promise.all(
    INVALIDATION_TARGETS.filter((target) => (listeners.get(target)?.size ?? 0) > 0).map((target) =>
      controllerFor(target).flushNow(),
    ),
  );
}

export function resetCanonicalInvalidationForTests(): void {
  for (const controller of controllers.values()) {
    controller.dispose();
  }
  controllers.clear();
  listeners.clear();
}
