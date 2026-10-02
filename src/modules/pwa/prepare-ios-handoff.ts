import type { CreateHandoffResult } from './handoff-api';

export async function prepareIosHandoff(deps: {
  create: () => Promise<CreateHandoffResult>;
  writeCookie: (token: string) => void;
}): Promise<'ready' | 'failed'> {
  const created = await deps.create();
  if (created.status !== 'ok') {
    return 'failed';
  }
  deps.writeCookie(created.token);
  return 'ready';
}
