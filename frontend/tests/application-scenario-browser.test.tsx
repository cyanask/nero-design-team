import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CapabilityAssetVM, CapabilityLibraryVM } from "../src/core/contracts";
import { ApplicationScenarioBrowser } from "../src/adapters/react/ApplicationScenarioBrowser";
import { ndtApplicationScenarioCatalog } from "../src/packs/ndt/application-scenarios";

function asset(
  id: string,
  categoryId: string,
  name = `${categoryId} asset`
): CapabilityAssetVM {
  return {
    id,
    key: id.toLowerCase(),
    categoryId,
    name,
    purpose: `${name} 的用途说明`,
    useFor: ["test"],
    routes: ["frontend-ui"],
    knownRoutes: ["frontend-ui"],
    rawStatus: "ready",
    rights: "NERO-native",
    sourceRef: `test/${id}.json`,
    members: [],
    notes: [],
    preview: {
      state: "resolved",
      url: `./assets/${id}.png`,
      kind: "image",
      label: name,
      boundary: "fixture",
      fit: "cover",
      variants: []
    },
    issueCodes: []
  };
}

const allRoleAssets = [
  asset("NDT-RUL-001", "rules", "流程规则"),
  asset("NDT-TPL-001", "templates", "演示模板"),
  asset("NDT-STY-001", "style-packs", "留白风格"),
  asset("NDT-BRD-001", "brand", "品牌基础"),
  asset("NDT-TOK-001", "tokens", "设计令牌"),
  asset("NDT-TOO-001", "tools", "质量检查"),
  asset("NDT-CAS-001", "cases", "案例参考"),
  asset("NDT-SNP-001", "snapshots", "外部快照"),
  asset("NDT-EXT-001", "external-packs", "外部参考包")
];

const library: CapabilityLibraryVM = {
  categories: [
    { id: "rules", label: "规则包", assetIds: ["NDT-RUL-001"] },
    { id: "templates", label: "生产模板", assetIds: ["NDT-TPL-001"] },
    { id: "style-packs", label: "风格参考包", assetIds: ["NDT-STY-001"] },
    { id: "brand", label: "品牌基础", assetIds: ["NDT-BRD-001"] },
    { id: "tokens", label: "设计令牌", assetIds: ["NDT-TOK-001"] },
    { id: "tools", label: "工具与质量门", assetIds: ["NDT-TOO-001"] },
    { id: "cases", label: "案例模式", assetIds: ["NDT-CAS-001"] },
    { id: "snapshots", label: "外部快照", assetIds: ["NDT-SNP-001"] },
    { id: "external-packs", label: "外部参考包", assetIds: ["NDT-EXT-001"] }
  ],
  recipes: [
    {
      id: "formal-pptx",
      label: "正式可编辑 PPTX",
      assetIds: allRoleAssets.map((item) => item.id)
    },
    { id: "internal-workbench", label: "内部工作台与分析后台", assetIds: ["NDT-RUL-001"] }
  ],
  assets: allRoleAssets,
  domainRecords: [],
  integrityIssues: [],
  unboundDomainRecords: []
};

describe("ApplicationScenarioBrowser", () => {
  it("renders all six application scenarios with primary-solution counts", () => {
    const html = renderToStaticMarkup(
      <ApplicationScenarioBrowser
        catalog={ndtApplicationScenarioCatalog}
        library={library}
        mode="index"
        scenarioId={null}
        recipeId={null}
      />
    );

    expect(html).toContain("APPLICATION SCENARIOS / 06");
    expect(html).toContain("产品界面（App / 软件）");
    expect(html).toContain("网页与 HTML");
    expect(html).toContain("商业报告与文档");
    expect(html).toContain("PPT 与演示汇报");
    expect(html).toContain("图片与视觉传播");
    expect(html).toContain("视频与动态内容");
    expect((html.match(/查看适用方案/g) ?? []).length).toBe(6);
    expect(html).toContain('href="#/capabilities/scenarios/product-ui"');
  });

  it("falls back to a supporting solution preview when a primary solution has none", () => {
    const reportAsset = asset("NDT-REPORT-001", "style-packs", "报告协作预览");
    const fallbackLibrary: CapabilityLibraryVM = {
      ...library,
      assets: [...library.assets, reportAsset],
      recipes: [
        { id: "embedded-report-figure", label: "报告与演示结构图", assetIds: [] },
        { id: "formal-pptx", label: "正式可编辑 PPTX", assetIds: [reportAsset.id] }
      ]
    };
    const html = renderToStaticMarkup(
      <ApplicationScenarioBrowser
        catalog={ndtApplicationScenarioCatalog}
        library={fallbackLibrary}
        mode="index"
        scenarioId={null}
        recipeId={null}
      />
    );

    expect(html).toContain('alt="报告协作预览"');
    expect(html).toContain('src="./assets/NDT-REPORT-001.png"');
  });

  it("uses the six Pack-selected representative assets when they are available", () => {
    const representatives = [
      asset("NDT-TPL-001", "templates", "产品工作台"),
      asset("NDT-EXT-001", "external-packs", "架构脉络图"),
      asset("NDT-CAS-008", "cases", "研究备忘录"),
      asset("NDT-SNP-006", "snapshots", "演示页面"),
      asset("NDT-CAS-015", "cases", "财经传播组图"),
      asset("NDT-TPL-005", "templates", "竖屏视频画面")
    ];
    const representativeLibrary: CapabilityLibraryVM = {
      ...library,
      assets: [...library.assets, ...representatives]
    };
    const html = renderToStaticMarkup(
      <ApplicationScenarioBrowser
        catalog={ndtApplicationScenarioCatalog}
        library={representativeLibrary}
        mode="index"
        scenarioId={null}
        recipeId={null}
      />
    );

    for (const representative of representatives) {
      expect(html).toContain(`data-preview-asset-id="${representative.id}"`);
      expect(html).toContain(`src="./assets/${representative.id}.png"`);
    }
  });

  it("keeps primary and supporting solutions distinct on a scenario page", () => {
    const html = renderToStaticMarkup(
      <ApplicationScenarioBrowser
        catalog={ndtApplicationScenarioCatalog}
        library={library}
        mode="scenario"
        scenarioId="product-ui"
        recipeId={null}
      />
    );

    expect(html).toContain("PRIMARY SOLUTIONS");
    expect(html).toContain("SUPPORTING SOLUTIONS");
    expect(html).toContain("内部工作台与分析后台");
    expect(html).toContain("双轨迹证据图谱");
    expect(html).toContain("编辑式手写研究笔记");
    expect(html).toContain('href="#/capabilities/solutions/internal-workbench"');
  });

  it("shows all six role groups, direct/downstream deliverables, and real asset links", () => {
    const html = renderToStaticMarkup(
      <ApplicationScenarioBrowser
        catalog={ndtApplicationScenarioCatalog}
        library={library}
        mode="solution"
        scenarioId={null}
        recipeId="formal-pptx"
      />
    );

    expect(html).toContain("直接产物");
    expect(html).toContain("可编辑 PPTX");
    expect(html).toContain("下游目标");
    expect(html).toContain("PDF 汇报版");
    expect(html).toContain("做法与流程");
    expect(html).toContain("起始模板");
    expect(html).toContain("视觉风格");
    expect(html).toContain("设计部件");
    expect(html).toContain("交付检查");
    expect(html).toContain("参考案例");
    expect(html).toContain('href="#/capabilities/assets/NDT-RUL-001"');
    expect(html).toContain('href="#/capabilities/assets/NDT-STY-001"');
    expect(html).toContain('href="#/capabilities/assets/NDT-CAS-001"');
    expect(html).toContain('src="./assets/NDT-RUL-001.png"');
    expect(html).not.toContain("METADATA ONLY");
  });

  it("does not silently drop a recipe asset missing from the capability snapshot", () => {
    const missingLibrary: CapabilityLibraryVM = {
      ...library,
      recipes: [
        {
          id: "ai-image-brief",
          label: "AI 图像 Brief",
          assetIds: ["NDT-MISSING-001"]
        }
      ]
    };
    const html = renderToStaticMarkup(
      <ApplicationScenarioBrowser
        catalog={ndtApplicationScenarioCatalog}
        library={missingLibrary}
        mode="solution"
        scenarioId={null}
        recipeId="ai-image-brief"
      />
    );

    expect(html).toContain("Recipe 资产未出现在当前能力快照");
    expect(html).toContain("NDT-MISSING-001");
  });

  it("renders real empty states for unknown scenario and solution IDs", () => {
    const scenarioHtml = renderToStaticMarkup(
      <ApplicationScenarioBrowser
        catalog={ndtApplicationScenarioCatalog}
        library={library}
        mode="scenario"
        scenarioId="unknown-scenario"
        recipeId={null}
      />
    );
    const solutionHtml = renderToStaticMarkup(
      <ApplicationScenarioBrowser
        catalog={ndtApplicationScenarioCatalog}
        library={library}
        mode="solution"
        scenarioId={null}
        recipeId="unknown-recipe"
      />
    );

    expect(scenarioHtml).toContain("没有找到这个应用场景");
    expect(scenarioHtml).toContain("unknown-scenario");
    expect(solutionHtml).toContain("没有找到这个应用方案");
    expect(solutionHtml).toContain("unknown-recipe");
    expect(solutionHtml).toContain('href="#/capabilities"');
  });
});
