import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import demo from "../public/demo/snapshot.json";
import type { WorkbenchRoute } from "../src/core/routes";
import type { WorkbenchSnapshot } from "../src/core/contracts";
import { AppShell } from "../src/adapters/react/AppShell";
import { CapabilitySpace } from "../src/adapters/react/CapabilitySpace";
import { ndtApplicationScenarioCatalog } from "../src/packs/ndt/application-scenarios";

const snapshot = demo as unknown as WorkbenchSnapshot;

describe("capability source passport", () => {
  it("renders the public source passport through every capability page", () => {
    const routes: Extract<WorkbenchRoute, { space: "capabilities" }>[] = [
      { space: "capabilities", page: "scenarios", scenarioId: null },
      { space: "capabilities", page: "scenarios", scenarioId: "product-ui" },
      { space: "capabilities", page: "solution", recipeId: "internal-workbench" },
      { space: "capabilities", page: "assets", assetId: null }
    ];
    for (const route of routes) {
    const html = renderToStaticMarkup(
      <AppShell route={route} demo={false} source={snapshot.catalog}><CapabilitySpace catalog={snapshot.catalog} projects={snapshot.projects} route={route} scenarioCatalog={ndtApplicationScenarioCatalog} /></AppShell>
    );

    expect(html).toContain("目录信息");
    expect(html).toContain('aria-label="来源护照"');
    expect(html).toContain("参考数据");
    expect(html).toContain("合成演示数据");
    expect(html).toContain("新鲜度未知");
    }
  });
});
