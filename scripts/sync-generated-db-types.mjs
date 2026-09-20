#!/usr/bin/env node

/**
 * Copies generated Database types from the sibling pilot repo.
 *
 * Default source:
 *   ../doctor-maslianski-pilot/supabase/generated-db-types.ts
 *
 * Override with DOCTOR_MASLIANSKI_PILOT_ROOT.
 *
 * After schema changes in the pilot repo:
 *   npx supabase gen types typescript --local > supabase/generated-db-types.ts
 * Then here:
 *   npm run sync:db-types
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const mobileRoot = resolve(here, '..');
const pilotRoot = resolve(
  process.env.DOCTOR_MASLIANSKI_PILOT_ROOT ?? join(mobileRoot, '..', 'doctor-maslianski-pilot'),
);
const source = join(pilotRoot, 'supabase', 'generated-db-types.ts');
const destination = join(mobileRoot, 'src', 'core', 'supabase', 'database.types.ts');

const HEADER = `/**
 * Vendored from doctor-maslianski-pilot/supabase/generated-db-types.ts
 *
 * After schema changes in the pilot repo:
 *   npx supabase gen types typescript --local > supabase/generated-db-types.ts
 * Then in this repo:
 *   npm run sync:db-types
 *
 * Do not edit by hand. Git diff of this file is the drift detector.
 */

`;

if (!existsSync(source)) {
  console.error(`Generated DB types not found at ${source}`);
  console.error('Set DOCTOR_MASLIANSKI_PILOT_ROOT or generate types in the pilot repo first.');
  process.exit(1);
}

mkdirSync(dirname(destination), { recursive: true });

const body = readFileSync(source, 'utf8');
const stripped = body.replace(
  /^\/\*\*[\s\S]*?Do not edit by hand\. Git diff of this file is the drift detector\.\s*\*\/\s*/u,
  '',
);
writeFileSync(destination, `${HEADER}${stripped}`);

console.log(`Wrote ${destination}`);
console.log(`Source ${source}`);
