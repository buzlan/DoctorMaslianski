import { APP_ICON_NAMES } from "./app-icon-names";
import { resolveWebIcon, warnUnknownWebIcon } from "./app-icon-web-map";

describe("web AppIcon mapping", () => {
  it("maps every AppIcon name to an SVG glyph", () => {
    for (const name of APP_ICON_NAMES) {
      const resolved = resolveWebIcon(name);
      expect(resolved.known).toBe(true);
      expect(resolved.glyph.paths.length).toBeGreaterThan(0);
      for (const path of resolved.glyph.paths) {
        expect(path.length).toBeGreaterThan(0);
        expect(path).not.toContain("□");
      }
    }
  });

  it("uses a neutral SVG fallback for an unknown name", () => {
    const resolved = resolveWebIcon("not-an-icon");
    expect(resolved.known).toBe(false);
    expect(resolved.glyph.paths.length).toBeGreaterThan(0);
    expect(resolved.glyph.paths.join("")).not.toContain("□");
  });

  it("warns in development for an unknown name", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    warnUnknownWebIcon("not-an-icon");
    expect(warn).toHaveBeenCalledWith("Unknown AppIcon web mapping: not-an-icon");
    warn.mockRestore();
  });
});
