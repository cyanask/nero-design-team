import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CapabilityLibraryVM } from "../src/core/contracts";
import { ApplicationScenarioBrowser } from "../src/adapters/react/ApplicationScenarioBrowser";
import { ndtApplicationScenarioCatalog } from "../src/packs/ndt/application-scenarios";
const library: CapabilityLibraryVM = { categories: [], recipes: [], assets: [], domainRecords: [], integrityIssues: [], unboundDomainRecords: [] };
describe("empty-library browser", () => {
  for (const mode of ["index", "scenario", "solution"] as const) {
    it("renders " + mode + " without invented assets", () => {
      const html = renderToStaticMarkup(<ApplicationScenarioBrowser catalog={ndtApplicationScenarioCatalog} library={library} mode={mode} scenarioId="missing" recipeId="missing" />);
      expect(html).toContain("scenario-browser");
      expect(html).not.toContain("<img");
      expect(html).not.toContain("NDT-TPL-");
    });
  }
});
