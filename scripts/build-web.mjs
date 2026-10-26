#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

function run(command, args) {
  execFileSync(command, args, { stdio: "inherit" });
}

function removeSourceMaps(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      removeSourceMaps(path);
    } else if (entry.isFile() && entry.name.endsWith(".map")) {
      rmSync(path);
    }
  }
}

run("npx", ["expo", "export", "--platform", "web", "--source-maps"]);
run("node", ["scripts/copy-web-splash.mjs"]);

const sentryUploadConfig = [
  process.env.SENTRY_AUTH_TOKEN,
  process.env.SENTRY_ORG,
  process.env.SENTRY_PROJECT,
];

if (sentryUploadConfig.every(Boolean)) {
  run("npx", ["sentry-expo-upload-sourcemaps", "dist"]);
} else if (sentryUploadConfig.some(Boolean)) {
  throw new Error(
    "Set SENTRY_AUTH_TOKEN, SENTRY_ORG, and SENTRY_PROJECT together to upload Sentry source maps.",
  );
} else {
  console.warn(
    "Sentry source-map upload skipped. Add SENTRY_AUTH_TOKEN, SENTRY_ORG, and SENTRY_PROJECT in Vercel.",
  );
}

// Maps are uploaded privately to Sentry when configured; do not publish them with the PWA.
removeSourceMaps("dist");
