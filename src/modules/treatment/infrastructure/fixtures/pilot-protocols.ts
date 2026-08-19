/**
 * Development structural fixtures for TASK-005.
 *
 * These are not approved clinical protocols and are not clinic-authored
 * treatment instructions. They are not assignable to patients as clinical
 * truth. Collections are empty because clinic content is still missing in
 * docs/protocols. Do not copy intake markers such as "TBD by clinic" into
 * these fields. Test/mock assignment does not freeze clinic draft v1
 * governance.
 */

import type { PilotProtocol } from '../../domain';

function emptyProtocolCollections(): Pick<
  PilotProtocol,
  | 'stages'
  | 'tasks'
  | 'checkInDefinitions'
  | 'photoCheckpoints'
  | 'restrictions'
  | 'appointmentPattern'
> {
  return {
    stages: [],
    tasks: [],
    checkInDefinitions: [],
    photoCheckpoints: [],
    restrictions: [],
    appointmentPattern: [],
  };
}

export const sclerotherapyV1: PilotProtocol = {
  id: 'sclerotherapy-v1',
  kind: 'sclerotherapy',
  version: 1,
  ...emptyProtocolCollections(),
};

export const telangiectasiaV1: PilotProtocol = {
  id: 'telangiectasia-v1',
  kind: 'telangiectasia',
  version: 1,
  ...emptyProtocolCollections(),
};
