#!/usr/bin/env node

/**
 * Expo copies public/splash-screen.png as a symlink. The deployed file then
 * misses the image and the browser shows a broken-image icon. Replace it
 * with the real PNG after export.
 */

import { copyFileSync, rmSync } from 'node:fs';

const dest = 'dist/splash-screen.png';
rmSync(dest, { force: true });
copyFileSync('assets/images/patient/splash_screen.png', dest);
