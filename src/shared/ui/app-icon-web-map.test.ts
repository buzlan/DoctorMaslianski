import { APP_ICON_NAMES } from "./app-icon-names";
import { warnUnknownWebIcon, webIconCodepoint } from "./app-icon-web-map";

describe("web AppIcon mapping", () => {
  it("maps every AppIcon name to an Ionicons code point", () => {
    for (const name of APP_ICON_NAMES) {
      const codepoint = webIconCodepoint(name);
      expect(codepoint).toEqual(expect.any(Number));
      expect(codepoint).toBeGreaterThan(0);
    }
  });

  it("does not invent a glyph for an unknown name", () => {
    expect(webIconCodepoint("not-an-icon")).toBeNull();
  });

  it("warns in development for an unknown name", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    warnUnknownWebIcon("not-an-icon");
    expect(warn).toHaveBeenCalledWith("Unknown AppIcon web mapping: not-an-icon");
    warn.mockRestore();
  });
});
