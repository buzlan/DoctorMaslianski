import type { Href } from "expo-router";

/**
 * Bottom-tab roots in display order. Nested stack screens stay outside this list
 * and must not receive tab-swipe gestures.
 */
export const PRIMARY_TAB_ROUTES = ["/", "/treatment", "/diary"] as const;

export type PrimaryTabRoute = (typeof PRIMARY_TAB_ROUTES)[number];

export type TabSwipeDirection = "next" | "previous";

export function isPrimaryTabRoute(href: string): href is PrimaryTabRoute {
  return (PRIMARY_TAB_ROUTES as readonly string[]).includes(href);
}

export function adjacentPrimaryTab(
  current: PrimaryTabRoute,
  direction: TabSwipeDirection,
): PrimaryTabRoute | null {
  const index = PRIMARY_TAB_ROUTES.indexOf(current);
  if (index < 0) {
    return null;
  }

  const nextIndex = direction === "next" ? index + 1 : index - 1;
  if (nextIndex < 0 || nextIndex >= PRIMARY_TAB_ROUTES.length) {
    return null;
  }

  return PRIMARY_TAB_ROUTES[nextIndex] ?? null;
}

export function primaryTabHref(route: PrimaryTabRoute): Href {
  return route;
}

/** Enter offset for a subtle tab switch; null when no transition should run. */
export function tabEnterTranslateX(
  from: PrimaryTabRoute | null,
  to: PrimaryTabRoute,
  distance = 10,
): number | null {
  if (from === null || from === to) {
    return null;
  }

  const fromIndex = PRIMARY_TAB_ROUTES.indexOf(from);
  const toIndex = PRIMARY_TAB_ROUTES.indexOf(to);
  if (fromIndex < 0 || toIndex < 0) {
    return null;
  }

  return toIndex > fromIndex ? distance : -distance;
}
