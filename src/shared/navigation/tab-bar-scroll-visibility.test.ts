import { isDocumentScrollPath } from "./document-scroll-path";
import {
  initialTabBarScrollState,
  reduceTabBarScroll,
  TAB_BAR_IDLE_MS,
  webTabBarReserve,
} from "./tab-bar-scroll-visibility";

describe("document scroll routes", () => {
  it("scrolls the three primary tabs only", () => {
    expect(isDocumentScrollPath("/")).toBe(true);
    expect(isDocumentScrollPath("/treatment")).toBe(true);
    expect(isDocumentScrollPath("/treatment/")).toBe(true);
    expect(isDocumentScrollPath("/diary")).toBe(true);
    expect(isDocumentScrollPath("/treatment/milestone")).toBe(false);
    expect(isDocumentScrollPath("/photo-capture")).toBe(false);
    expect(isDocumentScrollPath("/access")).toBe(false);
  });
});

describe("tab bar scroll visibility", () => {
  it("hides while scrolling and returns after the idle delay", () => {
    const hidden = reduceTabBarScroll(initialTabBarScrollState(), {
      type: "scroll",
      now: 1_000,
    });
    expect(hidden).toEqual({ visibility: "hidden", idleDueAt: 1_000 + TAB_BAR_IDLE_MS });

    const stillHidden = reduceTabBarScroll(hidden, { type: "tick", now: 1_100 });
    expect(stillHidden.visibility).toBe("hidden");

    const extended = reduceTabBarScroll(stillHidden, { type: "scroll", now: 1_150 });
    expect(extended.idleDueAt).toBe(1_150 + TAB_BAR_IDLE_MS);

    const shown = reduceTabBarScroll(extended, {
      type: "tick",
      now: 1_150 + TAB_BAR_IDLE_MS,
    });
    expect(shown).toEqual({ visibility: "visible", idleDueAt: null });
  });

  it("reserves the safe-area inset without a device-specific constant", () => {
    expect(webTabBarReserve(0, 16)).toBe(73);
    expect(webTabBarReserve(34, 16)).toBe(91);
  });
});
