export const TAB_BAR_IDLE_MS = 200;
export const TAB_BAR_ANIMATION_MS = 220;

/** Item height 48 plus 4px margin above and below. */
export const WEB_TAB_BAR_CONTENT_HEIGHT = 56;

export function webTabBarReserve(safeAreaBottom: number, basePadding = 16): number {
  const paddingBottom = Math.max(safeAreaBottom, basePadding);
  return WEB_TAB_BAR_CONTENT_HEIGHT + paddingBottom + 1;
}

export type TabBarScrollState = {
  visibility: "visible" | "hidden";
  idleDueAt: number | null;
};

export function initialTabBarScrollState(): TabBarScrollState {
  return { visibility: "visible", idleDueAt: null };
}

export function reduceTabBarScroll(
  state: TabBarScrollState,
  event: { type: "scroll"; now: number } | { type: "tick"; now: number },
  idleMs = TAB_BAR_IDLE_MS,
): TabBarScrollState {
  if (event.type === "scroll") {
    return { visibility: "hidden", idleDueAt: event.now + idleMs };
  }

  if (state.idleDueAt === null || event.now < state.idleDueAt) {
    return state;
  }

  return { visibility: "visible", idleDueAt: null };
}
