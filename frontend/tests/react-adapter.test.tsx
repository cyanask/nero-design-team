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
  it("renders the real two-space shell and permanent demo boundary", () => {
    const html = renderToStaticMarkup(
      <AppShell
        route={{ space: "capabilities", page: "assets", assetId: null }}
        demo
      >
        <CapabilityLibrary envelope={snapshot.catalog} requestedAssetId={null} />
      </AppShell>
    );
    expect(html).toContain("设计能力");
    expect(html).toContain("我的项目");
    expect(html.indexOf("设计能力")).toBeLessThan(html.indexOf("我的项目"));
    expect(html).toContain('class="brand-lockup" href="#/capabilities"');
    expect(html).toContain("NERO Design Team");
    expect(html).toContain("DEMO FIXTURE");
    expect(html).toContain("DEMO-001");
    expect(html).toContain("VISUAL ASSET BOARD");
    expect(html).toContain("设计资产");
    expect(html).toContain('src="./app-icon.svg"');
    expect(html).not.toContain('class="recipe-band"');
    expect(html).toContain("当前授权项目中未观察到显式声明");
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
    expect(overview).toContain("PROJECT / 项目");
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
    expect(html).toContain("REFERENCE INSTRUCTION");
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

  it("uses application scenarios as the default capability entry while retaining the asset directory", () => {
    const html = renderToStaticMarkup(
      <CapabilitySpace
        catalog={snapshot.catalog}
        projects={snapshot.projects}
        route={{ space: "capabilities", page: "scenarios", scenarioId: null }}
        scenarioCatalog={ndtApplicationScenarioCatalog}
      />
    );
    expect(html).toContain("按应用场景");
    expect(html).toContain("资产目录");
    expect(html).toContain("先说你要做什么，再选怎么做");
    expect(html).toContain("产品界面（App / 软件）");
    expect(html).toContain('href="#/capabilities/assets"');
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
    expect(html).toContain("REFERENCE VARIANTS");
    expect(html).toContain("参考变体 A");
    expect(html).toContain("参考变体 B");
    expect(html).toContain("非独立资产 ID");
    expect(html).toContain("REFERENCE VARIANT");
  });

  it("does not silently show the first asset for an invalid deep link", () => {
    const html = renderToStaticMarkup(
      <CapabilityLibrary envelope={snapshot.catalog} requestedAssetId="NDT-MISSING-999" />
    );
    expect(html).toContain("当前链接未匹配到设计资产");
    expect(html).not.toContain('aria-current="true"');
  });
});
