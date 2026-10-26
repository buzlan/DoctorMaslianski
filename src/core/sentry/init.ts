import * as Sentry from "@sentry/react-native";
import { Platform } from "react-native";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const sentryEnabled =
  Platform.OS === "web" &&
  Boolean(dsn) &&
  (!__DEV__ || process.env.EXPO_PUBLIC_SENTRY_ENABLE_DEV === "true");

if (sentryEnabled && dsn) {
  Sentry.init({
    dsn,
    enabled: true,
    environment:
      process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ??
      (__DEV__ ? "development" : "production"),
    sendDefaultPii: false,
    beforeSend(event) {
      // Patient data, invite tokens, and session URLs must not reach Sentry.
      delete event.request;
      delete event.user;
      delete event.breadcrumbs;
      delete event.extra;
      delete event.tags;
      return event;
    },
  });
}
