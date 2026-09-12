import { describe, expect, it } from "vitest";
import {
  capabilityDirectoryHash,
  capabilityHash,
  parseWorkbenchHash,
  projectHash,
  scenarioHash,
  solutionHash
} from "../src/core/routes";

describe("hash routes", () => {
  it("defaults an empty hash to the scenario index and preserves unknown paths as invalid", () => {
    expect(parseWorkbenchHash("")).toEqual({
      space: "capabilities",
      page: "scenarios",
      scenarioId: null
    });
    expect(parseWorkbenchHash("#/unknown")).toEqual({
      space: "invalid",
      path: "/unknown"
    });
  });

  it("round-trips scenario, solution and capability IDs", () => {
    expect(parseWorkbenchHash(scenarioHash("product ui"))).toEqual({
      space: "capabilities",
      page: "scenarios",
      scenarioId: "product ui"
    });
    expect(parseWorkbenchHash(solutionHash("formal pptx"))).toEqual({
      space: "capabilities",
      page: "solution",
      recipeId: "formal pptx"
    });
    expect(parseWorkbenchHash(capabilityDirectoryHash())).toEqual({
      space: "capabilities",
      page: "assets",
      assetId: null
    });
    const hash = capabilityHash("DEMO / 001");
    expect(parseWorkbenchHash(hash)).toEqual({
      space: "capabilities",
      page: "assets",
      assetId: "DEMO / 001"
    });
  });

  it("keeps previously shared capability deep links working", () => {
    expect(parseWorkbenchHash("#/capabilities/NDT-STY-002")).toEqual({
      space: "capabilities",
      page: "assets",
      assetId: "NDT-STY-002"
    });
  });

  it("does not swallow extra route segments", () => {
    expect(parseWorkbenchHash("#/projects/sample/extra")).toEqual({
      space: "invalid",
      path: "/projects/sample/extra"
    });
    expect(parseWorkbenchHash("#/capabilities/scenarios/product-ui/extra")).toEqual({
      space: "invalid",
      path: "/capabilities/scenarios/product-ui/extra"
    });
    expect(parseWorkbenchHash("#/capabilities/assets/NDT-STY-002/extra")).toEqual({
      space: "invalid",
      path: "/capabilities/assets/NDT-STY-002/extra"
    });
  });

  it("round-trips project aliases and restricts tabs", () => {
    expect(parseWorkbenchHash(projectHash("sample_project", "review"))).toEqual({
      space: "projects",
      projectId: "sample_project",
      tab: "review"
    });
    expect(parseWorkbenchHash("#/projects/sample?tab=unsafe")).toEqual({
      space: "projects",
      projectId: "sample",
      tab: "overview"
    });
  });
});


describe("asset directory retrieval", () => {
  it("combines query terms, aliases and reuse filters without hiding no-preview assets", async () => {
    const { filterCapabilities } = await import("../src/core/compose");
    const seed = { id: "A", key: "a", categoryId: "rules", name: "证据规则", purpose: "报告对照", useFor: [], routes: ["frontend-ui"], knownRoutes: [], rawStatus: "approved", rights: null, sourceRef: null, members: [], notes: [], issueCodes: [], aliases: ["尽调"], maturity: "registered", reuseState: "conditional", preview: { state: "not_declared", url: null, kind: null, label: null, boundary: null, fit: null, variants: [] } };
    const library = { categories: [], recipes: [], assets: [seed, { ...seed, id: "B", aliases: [], reuseState: undefined }], domainRecords: [], integrityIssues: [], unboundDomainRecords: [] } as any;
    const query = { search: "尽调 报告", categoryId: null, recipeId: null };
    expect(filterCapabilities(library, query).map((asset) => asset.id)).toEqual(["A"]);
    expect(filterCapabilities(library, { ...query, reuseState: "reusable" })).toEqual([]);
    expect(filterCapabilities(library, { ...query, reuseState: "conditional" }).length).toBe(1);
    expect(filterCapabilities(library, { ...query, previewOnly: true })).toEqual([]);
    expect(filterCapabilities(library, { ...query, search: "", reuseState: "unknown" }).map((asset) => asset.id)).toEqual(["B"]);
  });
});


describe("asset route filter transitions", () => {
  it("preserves result filters on selection and clears only conflicting deep-link filters", async () => {
    const { revealCapabilityFilters, filterCapabilities, selectCapability } = await import("../src/core/compose");
    const { default: demo } = await import("../public/demo/snapshot.json");
    const seed = demo.catalog.data.assets[0];
    const a = { ...seed, id: "a", categoryId: "templates", name: "needle A", rawStatus: "ready", reuseState: "conditional", issueCodes: [] };
    const b = { ...a, id: "b", name: "needle B" };
    const c = { ...a, id: "c", categoryId: "cases", name: "other C" };
    const library = { ...demo.catalog.data, assets: [a, b, c], recipes: [{ id: "pair", label: "pair", assetIds: ["a", "b"] }] } as unknown as import("../src/core/contracts").CapabilityLibraryVM;
    const initial = { search: "needle", categoryId: "templates", recipeId: "pair", reuseState: "conditional" as const, previewOnly: false };
    const first = revealCapabilityFilters(library, initial, "a");
    const second = revealCapabilityFilters(library, first, "b");
    expect(second).toBe(initial);
    expect(selectCapability(filterCapabilities(library, second), "b")?.id).toBe("b");
    const deepLink = revealCapabilityFilters(library, second, "c");
    expect(deepLink).toEqual({ ...initial, search: "", categoryId: null, recipeId: null });
    expect(selectCapability(filterCapabilities(library, deepLink), "c")?.id).toBe("c");
    expect(revealCapabilityFilters(library, initial, "missing")).toBe(initial);
    expect(selectCapability(filterCapabilities(library, initial), "missing")).toBeNull();
    expect(revealCapabilityFilters(library, initial, null)).toBe(initial);
  });
});
