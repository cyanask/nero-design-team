import { studioFeatures } from "../src/packs/ndt/pack";
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

    expect(html.match(/href="#\/capabilities\/scenarios\//g)).toHaveLength(6);
    expect(html).toContain("产品界面（App / 软件）");
    expect(html).toContain("网页与 HTML");
    expect(html).toContain("商业报告与文档");
    expect(html).toContain("PPT 与演示汇报");
    expect(html).toContain("图片与视觉传播");
    expect(html).toContain("视频与动态内容");
    expect((html.match(/个主方案/g) ?? []).length).toBe(6);
    expect(html).toContain('href="#/capabilities/scenarios/product-ui"');
  });

  it("keeps metadata-only assets visible without inventing preview images", () => {
    const input = { ...library, assets: library.assets.map((item) => ({ ...item, preview: { ...item.preview, state: "not_declared" as const, url: null, variants: [] } })) };
    const html = renderToStaticMarkup(<ApplicationScenarioBrowser catalog={ndtApplicationScenarioCatalog} library={input} studioSelection={studioFeatures} mode="index" scenarioId={null} recipeId={null} />);
    expect(html).toContain("此包未提供视觉预览");
    expect(html).not.toContain("<img");
    expect(html).toContain('href="#/capabilities/assets/NDT-RUL-001"');
  });

  it("uses three registered studio style samples without copying their assets", () => {
    const ids = ["NDT-STY-003", "NDT-STY-004", "NDT-STY-006"];
    const input = { ...library, assets: [...library.assets, ...ids.map((id) => asset(id, "style-packs", id))] };
    const html = renderToStaticMarkup(<ApplicationScenarioBrowser catalog={ndtApplicationScenarioCatalog} library={input} studioSelection={studioFeatures} mode="index" scenarioId={null} recipeId={null} />);
    for (const id of ids) expect(html).toContain(`href="#/capabilities/assets/${id}"`);
    expect(html).toContain('aria-label="按任务选择方案"');
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

    expect(html).toContain("选择适合的方案");
    expect(html).toContain("协作方案");
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

    expect(html).toContain("直接提供");
    expect(html).toContain("可编辑 PPTX");
    expect(html).toContain("后续可形成");
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
    expect(html).not.toContain("登记资料");
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

    expect(html).toContain("关联资产未出现在当前能力快照");
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


describe("scenario asset reuse boundary", () => {
  it("changes the scenario card when the asset is quarantined", () => {
    const render = (rawStatus: string) => renderToStaticMarkup(<ApplicationScenarioBrowser catalog={ndtApplicationScenarioCatalog} library={{ ...library, assets: [{ ...allRoleAssets[0], rawStatus, reuseState: "reusable", maturity: "registered", notes: ["具体使用限制"], issueCodes: ["REVIEW_NEEDED"] }] }} mode="solution" scenarioId={null} recipeId="internal-workbench" />);
    const before = render("ready");
    const after = render("quarantined");
    expect(before).toContain("复用状态未知");
    expect(after).toContain("已隔离");
    expect(after).toContain("已登记");
    expect(after).toContain("复用前核查登记边界");
    expect(after).toContain("REVIEW_NEEDED");
    expect(after).not.toContain("请引用");
    expect(after).not.toBe(before);
  });
});


it("does not feature an isolated or placeholder asset even when selected by the Pack", () => {
  for (const reuseState of ["quarantined", "placeholder"] as const) {
    const blocked = { ...asset("NDT-STY-003", "style-packs", "restricted reference"), reuseState };
    const html = renderToStaticMarkup(<ApplicationScenarioBrowser catalog={ndtApplicationScenarioCatalog} library={{ ...library, assets: [blocked] }} studioSelection={studioFeatures} mode="index" scenarioId={null} recipeId={null} />);
    expect(html).not.toContain('href="#/capabilities/assets/NDT-STY-003"');
  }
});
