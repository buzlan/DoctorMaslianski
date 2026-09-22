import {
  adjacentPrimaryTab,
  isPrimaryTabRoute,
  PRIMARY_TAB_ROUTES,
  tabEnterTranslateX,
} from "./primary-tabs";

describe("primary tabs", () => {
  it("lists Today, Treatment, Diary in order", () => {
    expect(PRIMARY_TAB_ROUTES).toEqual(["/", "/treatment", "/diary"]);
  });

  it("recognizes only the three root tab routes", () => {
    expect(isPrimaryTabRoute("/")).toBe(true);
    expect(isPrimaryTabRoute("/treatment")).toBe(true);
    expect(isPrimaryTabRoute("/diary")).toBe(true);
    expect(isPrimaryTabRoute("/photo-capture")).toBe(false);
    expect(isPrimaryTabRoute("/treatment/milestone-1")).toBe(false);
  });

  it("moves to the next and previous tabs within bounds", () => {
    expect(adjacentPrimaryTab("/", "next")).toBe("/treatment");
    expect(adjacentPrimaryTab("/treatment", "next")).toBe("/diary");
    expect(adjacentPrimaryTab("/diary", "previous")).toBe("/treatment");
    expect(adjacentPrimaryTab("/treatment", "previous")).toBe("/");
  });

  it("does not move past the first or last tab", () => {
    expect(adjacentPrimaryTab("/", "previous")).toBeNull();
    expect(adjacentPrimaryTab("/diary", "next")).toBeNull();
  });

  it("computes a subtle directional enter offset between tabs", () => {
    expect(tabEnterTranslateX(null, "/")).toBeNull();
    expect(tabEnterTranslateX("/", "/")).toBeNull();
    expect(tabEnterTranslateX("/", "/treatment")).toBe(10);
    expect(tabEnterTranslateX("/diary", "/treatment")).toBe(-10);
  });
});
