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
