import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import demo from "../public/demo/snapshot.json";
import type { ProjectDetailVM, WorkbenchSnapshot } from "../src/core/contracts";
import { AppShell } from "../src/adapters/react/AppShell";
import { CapabilityLibrary } from "../src/adapters/react/CapabilityLibrary";
import { CapabilityInspector } from "../src/adapters/react/CapabilityInspector";
import { CapabilitySpace } from "../src/adapters/react/CapabilitySpace";
import { ProjectList } from "../src/adapters/react/ProjectList";
import { ProjectDetail } from "../src/adapters/react/ProjectDetail";
import { ndtApplicationScenarioCatalog } from "../src/packs/ndt/application-scenarios";

const snapshot = demo as unknown as WorkbenchSnapshot;

describe("React adapter", () => {
  it("renders a single three-destination shell and permanent demo boundary", () => {
    const html = renderToStaticMarkup(
      <AppShell
        route={{ space: "capabilities", page: "assets", assetId: null }}
        demo
      >
        <CapabilityLibrary envelope={snapshot.catalog} requestedAssetId={null} />
      </AppShell>
    );
    expect(html).toContain("工作室");
    expect(html).toContain("我的项目");
    expect(html.indexOf("工作室")).toBeLessThan(html.indexOf("我的项目"));
    expect(html).toContain('class="brand-lockup" href="#/capabilities"');
    expect(html).toContain("NERO Design Team");
    expect(html).toContain("DEMO FIXTURE");
    expect(html).toContain("DEMO-001");
    expect(html).toContain("资产库");
    expect(html).toContain("资产库");
    expect(html).toContain('src="./brand-symbol.svg"');
    expect(html).not.toContain('class="recipe-band"');
    expect(html).not.toContain('aria-label="能力详情"');
  });

  it("renders not_configured instead of a false zero-project claim", () => {
    const html = renderToStaticMarkup(
      <ProjectList
        envelope={snapshot.projects}
        requestedProjectId={null}
        tab="overview"
      />
    );
    expect(html).toContain("还没有已授权的项目");
    expect(html).toContain("项目数量待确认");
    expect(html).toContain("当前项目数量未知，不代表“0 个项目”");
    expect(html).not.toContain("0 个已识别项目");
    expect(html).not.toContain("0 个已授权项目");
    expect(html).toContain("数据来源与更新时间");
    expect(html).not.toContain("--project alias=/absolute/project/path");
    expect(html).not.toContain("生成候选图");
  });

  it("does not replace an invalid project deep link with the first real project", () => {
    const detail: ProjectDetailVM = {
      id: "real-project",
      name: "真实项目",
      manifestVersion: "1.0.0",
      route: "frontend-ui",
      template: null,
      preset: null,
      ndtIntegration: { state: "declared", role: "background-support-design-system", declaredVersion: "2.8.0" },
      declaredAssetIds: [],
      adoptionReceipts: [],
      caseReferences: [],
      artifacts: [],
      qaEvidence: []
    };
    const projects = {
      ...snapshot.projects,
      data: {
        index: {
          discovery: "observed" as const,
          projects: [
            { id: detail.id, name: detail.name, route: detail.route, manifestState: "observed" }
          ]
        },
        detailsById: { [detail.id]: detail }
      }
    };
    const html = renderToStaticMarkup(
      <ProjectList envelope={projects} requestedProjectId="missing-project" tab="overview" />
    );
    expect(html).toContain("没有找到这个已授权项目");
    expect(html).not.toContain("真实项目</h2>");
  });

  it("presents project details in ordinary language while retaining technical provenance", () => {
    const detail: ProjectDetailVM = {
      id: "sample-project",
      name: "示例项目",
      manifestVersion: "1.0.0",
      route: "image-report",
      template: "report-figure",
      preset: "capital",
      ndtIntegration: { state: "declared", role: "background-support-design-system", declaredVersion: "2.8.0" },
      declaredAssetIds: ["NDT-CHT-001", "NDT-LAY-001"],
      adoptionReceipts: [
        {
          assetId: "NDT-CHT-001",
          artifactId: "figure-v1",
          state: "declared_unverified",
          source: "receipts/figure-v1.json"
        }
      ],
      caseReferences: ["CASE-001"],
      artifacts: [
        {
          id: "artifact-1",
          relativePath: "output/figure.svg",
          mediaType: "image/svg+xml",
          size: 2048,
          modifiedAt: null,
          declaration: "explicit_output",
          explicitVersion: null,
          readiness: "candidate"
        }
      ],
      qaEvidence: [
        {
          kind: "captured_run_result",
          state: "observed",
          relativeSource: "validation/result.json",
          reportedStatus: "pass"
        }
      ]
    };

    const overview = renderToStaticMarkup(<ProjectDetail detail={detail} tab="overview" />);
    expect(overview).toContain("项目详情");
    expect(overview).toContain("项目概览");
    expect(overview).toContain("图稿文件");
    expect(overview).toContain("检查记录");
    expect(overview).toContain("报告图与长图");
    expect(overview).toContain("项目已声明接入 NDT");
    expect(overview).toContain("具体资产声明");
    expect(overview).toContain("有效采用收据");
    expect(overview).toContain("项目采用收据");
    expect(overview).toContain("项目已声明，尚未验证");
    expect(overview).toContain("receipts/figure-v1.json");
    expect(overview).toContain("必须经过已登记的校验器");
    expect(overview).toContain("已观察到 1 个");
    expect(overview).toContain("本项目声明的设计能力");
    expect(overview).toContain('href="#/capabilities/assets/NDT-CHT-001"');
    expect(overview).toContain("来源与技术信息");
    expect(overview).toContain("sample-project");
    expect(overview).toContain("Manifest schema");
    expect(overview).not.toContain("生成候选图");

    const artifacts = renderToStaticMarkup(<ProjectDetail detail={detail} tab="artifacts" />);
    expect(artifacts).toContain("项目已登记");
    expect(artifacts).toContain("候选图稿（尚未采用）");
    expect(artifacts).toContain("记录方式");
    expect(artifacts).toContain("只有带有效采用收据的图稿，才可视为正式采用");

    const review = renderToStaticMarkup(<ProjectDetail detail={detail} tab="review" />);
    expect(review).toContain("检查结果");
    expect(review).toContain("已观察到记录");
    expect(review).toContain("记录为通过");
    expect(review).toContain("有检查文件，不代表检查已经运行或通过");
  });

  it("renders the selected capability in the permanent inspector", () => {
    const html = renderToStaticMarkup(
      <CapabilityInspector asset={snapshot.catalog.data!.assets[0]} />
    );
    expect(html).toContain("复制引用指令");
    expect(html).toContain("DEMO-001");
  });

  it("separates manifest declarations from valid adoption receipts", () => {
    const html = renderToStaticMarkup(
      <CapabilityInspector
        asset={snapshot.catalog.data!.assets[0]}
        usageProjects={[{ id: "sample-project", name: "示例项目", evidence: "manifest_declaration" }]}
      />
    );
    expect(html).toContain("1 个项目在 Manifest 中显式声明");
    expect(html).toContain('href="#/projects/sample-project?tab=overview"');
    expect(html).toContain("不等于图稿已经获得有效采用收据");
    expect(html).not.toContain("尚无有效采用收据");
  });

  it("closes the project-to-capability loop through the composed capability space", () => {
    const asset = snapshot.catalog.data!.assets[0];
    const projectDetail: ProjectDetailVM = {
      id: "sample-project",
      name: "示例项目",
      manifestVersion: "1.0.0",
      route: "frontend-ui",
      template: null,
      preset: null,
      ndtIntegration: { state: "declared", role: "background-support-design-system", declaredVersion: "2.8.0" },
      declaredAssetIds: [asset.id],
      adoptionReceipts: [],
      caseReferences: [],
      artifacts: [],
      qaEvidence: []
    };
    const projects = {
      ...snapshot.projects,
      data: {
        index: {
          discovery: "observed" as const,
          projects: [
            { id: "sample-project", name: "示例项目", route: "frontend-ui", manifestState: "observed" }
          ]
        },
        detailsById: {
          "sample-project": projectDetail
        }
      }
    };
    const html = renderToStaticMarkup(
      <CapabilitySpace
        catalog={snapshot.catalog}
        projects={projects}
        route={{ space: "capabilities", page: "assets", assetId: asset.id }}
        scenarioCatalog={ndtApplicationScenarioCatalog}
      />
    );
    expect(html).toContain("1 个项目在 Manifest 中显式声明");
    expect(html).toContain("示例项目");
    expect(html).toContain('href="#/projects/sample-project?tab=overview"');
  });

  it("preserves quarantine in the copied reference instruction", async () => {
    const { referenceInstruction } = await import("../src/packs/ndt/pack");
    const asset = { ...snapshot.catalog.data!.assets[0], maturity: "candidate" as const, reuseState: "quarantined" as const };
    const text = referenceInstruction(asset);
    expect(text).toContain("已隔离、不可复用");
    expect(text).toContain("成熟度：候选");
    expect(text).toContain("登记状态不等于成品验收");
  });

  it("shows assets without previews in the default directory and keeps reuse separate from acceptance", () => {
    const seed = snapshot.catalog.data!.assets[0];
    const asset = { ...seed, id: "NO-PREVIEW", name: "无预览的规则能力", rawStatus: "approved", maturity: "registered" as const, reuseState: "conditional" as const,
      preview: { ...seed.preview, state: "not_declared" as const, url: null, variants: [] } };
    const envelope = { ...snapshot.catalog, data: { ...snapshot.catalog.data!, assets: [asset] } };
    const html = renderToStaticMarkup(<CapabilityLibrary envelope={envelope} requestedAssetId={null} />);
    expect(html).toContain("无预览的规则能力");
    expect(html).toContain("资产库");
    expect(html).toContain("全部复用状态");
    expect(html).toContain("按条件复用");
    expect(html).toContain("已登记");
    expect(html).not.toContain("已验收");
  });

  it("uses application scenarios as the default capability entry while retaining the asset directory", () => {
    const html = renderToStaticMarkup(
      <CapabilitySpace
        catalog={snapshot.catalog}
        projects={snapshot.projects}
        route={{ space: "capabilities", page: "scenarios", scenarioId: null }}
        scenarioCatalog={ndtApplicationScenarioCatalog}
      />
    );
    expect(html).not.toContain("设计能力浏览方式");
    expect(html).not.toContain('aria-label="当前位置"');
    expect(html).toContain("工作室");
    expect(html).toContain("产品界面（App / 软件）");
    expect(html).toContain('href="#/capabilities/scenarios/product-ui"');
  });

  it("renders generic reference variants without presenting them as Registry asset IDs", () => {
    const baseAsset = snapshot.catalog.data!.assets[0];
    const asset = {
      ...baseAsset,
      id: "NDT-STY-TEST",
      name: "合成编辑参考组",
      preview: {
        ...baseAsset.preview,
        variants: [
          {
            id: "variant-a",
            label: "参考变体 A",
            purpose: "验证参考变体切换",
            url: "./fixtures/reference-a.svg",
            boundary: "合成测试夹具"
          },
          {
            id: "variant-b",
            label: "参考变体 B",
            purpose: "验证多个参考变体",
            url: "./fixtures/reference-b.svg",
            boundary: "合成测试夹具"
          }
        ]
      }
    };
    const html = renderToStaticMarkup(<CapabilityInspector asset={asset} />);
    expect(html).toContain("参考变体");
    expect(html).toContain("参考变体 A");
    expect(html).toContain("参考变体 B");
    expect(html).toContain("非独立资产 ID");
    expect(html).toContain("参考变体");
  });

  it("does not silently show the first asset for an invalid deep link", () => {
    const html = renderToStaticMarkup(
      <CapabilityLibrary envelope={snapshot.catalog} requestedAssetId="NDT-MISSING-999" />
    );
    expect(html).toContain("当前链接未匹配到设计资产");
    expect(html).not.toContain('aria-current="true"');
  });
});


describe("reuse boundary regression", () => {
  it("keeps legacy negative states and issue codes out of reusable filtering and instructions", async () => {
    const { referenceInstruction, reuseStateLabel, capabilityTone } = await import("../src/packs/ndt/pack");
    const { filterCapabilities } = await import("../src/core/compose");
    for (const rawStatus of ["quarantined", "blocked", "retired", "禁止", "隔离", "quarantined_partial"]) {
      for (const reuseState of [undefined, "reusable"] as const) {
        const asset = { ...snapshot.catalog.data!.assets[0], rawStatus, reuseState, issueCodes: [] };
        expect(reuseStateLabel(asset)).toBe("已隔离");
        expect(capabilityTone(asset)).toBe("warning");
        expect(referenceInstruction(asset)).not.toContain("请引用");
        expect(filterCapabilities({ ...snapshot.catalog.data!, assets: [asset] }, { search: "", categoryId: null, recipeId: null, reuseState: "reusable" })).toEqual([]);
      }
    }
    for (const rawStatus of ["mismatch", "error", "failed"]) {
      const failed = { ...snapshot.catalog.data!.assets[0], rawStatus, reuseState: "reusable" as const, issueCodes: [] };
      expect(reuseStateLabel(failed)).toBe("复用状态未知");
      expect(capabilityTone(failed)).toBe("warning");
      expect(referenceInstruction(failed)).not.toContain("请引用");
    }
    const blocked = { ...snapshot.catalog.data!.assets[0], rawStatus: "ready", reuseState: "reusable" as const, issueCodes: ["SOURCE_BLOCKED"] };
    expect(referenceInstruction(blocked)).toContain("确认前不复用");
    expect(reuseStateLabel(blocked)).toBe("复用状态未知");
    for (const rawStatus of [null, "ready", "approved", "pass"]) {
      const neutral = { ...blocked, rawStatus, reuseState: undefined, issueCodes: [] };
      expect(reuseStateLabel(neutral)).toBe("复用状态未知");
      expect(referenceInstruction(neutral)).not.toContain("请引用");
    }
  });
  it("retains independent purpose, usage, rights, notes and preview restrictions", async () => {
    const { referenceInstruction } = await import("../src/packs/ndt/pack");
    const asset = { ...snapshot.catalog.data!.assets[0], reuseState: "conditional" as const, rawStatus: "ready", issueCodes: [], purpose: "真实用途", useFor: ["适用场景"], rights: "授权条件", notes: ["中文手写字体必须验证", "逐字检查"], preview: { ...snapshot.catalog.data!.assets[0].preview, boundary: "预览边界" } };
    const text = referenceInstruction(asset);
    for (const value of [asset.purpose, ...asset.useFor, asset.rights, ...asset.notes, asset.preview.boundary]) expect(text).toContain(value);
    for (const reuseState of ["placeholder", "reference_only", "unknown"] as const) expect(referenceInstruction({ ...asset, reuseState })).not.toContain("请引用");
  });
});


describe("information flow", () => {
  it("keeps conditions before copy and renders only one inspector with manual-copy text", () => {
    const asset = { ...snapshot.catalog.data!.assets[0], id: "condition-test", purpose: "先核对当前用途", rights: "明确的权利限制", notes: ["不得回退字体"], useFor: ["指定场景"], issueCodes: ["REVIEW_NEEDED"] };
    const html = renderToStaticMarkup(<CapabilityInspector asset={asset} />);
    for (const text of [asset.purpose, asset.rights, asset.notes[0], asset.issueCodes[0]]) expect(html.indexOf(text)).toBeLessThan(html.indexOf('class="copy-button"'));
    expect(html).toContain('aria-label="完整引用指令"');
    expect(html.indexOf('class="copy-button"')).toBeLessThan(html.indexOf("来源与登记信息"));
    const catalog = { ...snapshot.catalog, data: { ...snapshot.catalog.data!, assets: [asset] } };
    const directory = renderToStaticMarkup(<CapabilityLibrary envelope={catalog} requestedAssetId={asset.id} />);
    expect(directory.match(/aria-label="能力详情"/g)).toHaveLength(1);
    expect(directory).toContain("← 资产库");
    expect(directory).not.toContain('aria-label="资产结果"');
  });

  it("uses compact metadata rows without excluding assets that have no preview", () => {
    const asset = { ...snapshot.catalog.data!.assets[0], id: "no-preview", preview: { ...snapshot.catalog.data!.assets[0].preview, state: "not_declared" as const, url: null, variants: [] } };
    const catalog = { ...snapshot.catalog, data: { ...snapshot.catalog.data!, assets: [asset] } };
    const html = renderToStaticMarkup(<CapabilityLibrary envelope={catalog} requestedAssetId={null} />);
    expect(html).toContain('class="asset-card metadata-card"');
    expect(html).toContain("暂无预览 · 可查看登记资料");
    expect(html).not.toContain('class="capability-preview compact"');
  });
});


it("keeps one active navigation destination with no duplicate navigation tier", () => {
  const routes = [
    { space: "capabilities", page: "scenarios", scenarioId: null },
    { space: "capabilities", page: "assets", assetId: null },
    { space: "projects", projectId: null, tab: "overview" }
  ] as const;
  for (const route of routes) {
    const html = renderToStaticMarkup(<AppShell route={route} demo={false}><div /></AppShell>);
    const nav = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/)![1];
    expect(nav.match(/<a /g)).toHaveLength(3);
    expect(nav.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).not.toContain("capability-view-nav");
  }
});


it("keeps the studio as parent navigation when entering an asset from it", () => {
  const html = renderToStaticMarkup(<AppShell route={{ space: "capabilities", page: "assets", assetId: "asset" }} assetOrigin={{ space: "capabilities", page: "scenarios", scenarioId: null }} demo={false}><div /></AppShell>);
  expect(html).toContain('href="#/capabilities" aria-current="location"');
  expect(html).not.toContain('href="#/capabilities/assets" aria-current="page"');
});

it("uses the caller as the secondary asset page parent and defaults direct links to the library", () => {
  const assetId = snapshot.catalog.data!.assets[0].id;
  const cases = [
    { origin: null, label: "← 资产库", href: "#/capabilities/assets" },
    { origin: { space: "capabilities", page: "scenarios", scenarioId: null } as const, label: "← 工作室", href: "#/capabilities" },
    { origin: { space: "projects", projectId: "sample-project", tab: "artifacts" } as const, label: "← 返回项目", href: "#/projects/sample-project?tab=artifacts" }
  ];
  for (const item of cases) {
    const html = renderToStaticMarkup(<CapabilitySpace catalog={snapshot.catalog} projects={snapshot.projects} route={{ space: "capabilities", page: "assets", assetId }} assetOrigin={item.origin} scenarioCatalog={ndtApplicationScenarioCatalog} />);
    expect(html).toContain(`href="${item.href}">${item.label}</a>`);
    expect(html.match(/aria-label="当前位置"/g)).toHaveLength(1);
    expect(html).not.toContain('aria-label="资产结果"');
  }
});
