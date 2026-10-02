import { getColors, theme } from "./index";

describe("forced light theme", () => {
  it("returns the light palette for every scheme", () => {
    expect(getColors("dark")).toBe(theme.colors.light);
    expect(getColors("light")).toBe(theme.colors.light);
    expect(getColors("unspecified")).toBe(theme.colors.light);
    expect(getColors(null)).toBe(theme.colors.light);
    expect(getColors("dark").background).toBe("#F5F8FB");
  });
});
