import { describe, expect, it } from "vitest";
import { validateApplicationScenarioCatalog } from "../src/core/application-scenarios";
import { ndtApplicationScenarioCatalog } from "../src/packs/ndt/application-scenarios";

describe("system-only scenario catalog", () => {
  it("validates without library dependencies", () => {
    expect(validateApplicationScenarioCatalog(ndtApplicationScenarioCatalog, { recipeIds: [], categoryIds: [] })).toEqual([]);
  });
  it("does not distribute personal solution or representative-asset mappings", () => {
    expect(ndtApplicationScenarioCatalog.scenarios).toEqual([]);
    expect(ndtApplicationScenarioCatalog.solutions).toEqual([]);
  });
});
