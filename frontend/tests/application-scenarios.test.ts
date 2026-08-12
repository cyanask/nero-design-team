import { describe, expect, it } from "vitest";
import type { ApplicationScenarioCatalog } from "../src/core/application-scenarios";
import { validateApplicationScenarioCatalog } from "../src/core/application-scenarios";
import { ndtApplicationScenarioCatalog } from "../src/packs/ndt/application-scenarios";

const expectedScenarioIds = [
  "product-ui",
  "web-html",
  "business-document",
  "presentation",
  "visual-communication",
  "motion-video"
];

const expectedRecipeIds = [
  "ai-image-brief",
  "architecture-map",
  "cold-white-business-editorial",
  "dual-trajectory-evidence-map",
  "editorial-handwritten-research-note",
  "embedded-report-figure",
  "financial-broadsheet-investigative",
  "formal-pptx",
  "internal-workbench",
  "minimal-zine-editorial",
  "photo-derived-editorial-diptych",
  "presentation-chain",
  "research-image",
  "research-series-identity-cover",
  "short-video"
];

const expectedCategoryIds = [
  "brand",
  "cases",
  "external-packs",
  "prompts",
  "rules",
  "snapshots",
  "style-packs",
  "templates",
  "tokens",
  "tools"
];

describe("NDT application scenario catalog", () => {
  it("passes the provider-agnostic catalog validator", () => {
    expect(
      validateApplicationScenarioCatalog(ndtApplicationScenarioCatalog, {
        recipeIds: expectedRecipeIds,
        categoryIds: expectedCategoryIds
      })
    ).toEqual([]);
  });

  it("defines six scenarios and gives each at least one primary solution", () => {
    expect(ndtApplicationScenarioCatalog.scenarios.map((scenario) => scenario.id)).toEqual(
      expectedScenarioIds
    );
    for (const scenarioId of expectedScenarioIds) {
      expect(
        ndtApplicationScenarioCatalog.solutions.some(
          (solution) => solution.primaryScenarioId === scenarioId
        ),
        scenarioId
      ).toBe(true);
    }
  });

  it("assigns one distinct representative asset to every scenario", () => {
    expect(
      Object.fromEntries(
        ndtApplicationScenarioCatalog.scenarios.map((scenario) => [
          scenario.id,
          scenario.representativeAssetId
        ])
      )
    ).toEqual({
      "product-ui": "NDT-TPL-001",
      "web-html": "NDT-EXT-001",
      "business-document": "NDT-CAS-008",
      presentation: "NDT-SNP-006",
      "visual-communication": "NDT-CAS-015",
      "motion-video": "NDT-TPL-005"
    });
    expect(
      new Set(
        ndtApplicationScenarioCatalog.scenarios.map(
          (scenario) => scenario.representativeAssetId
        )
      ).size
    ).toBe(6);
  });

  it("maps exactly the 15 agreed Recipe IDs without copying Recipe assets", () => {
    expect(
      ndtApplicationScenarioCatalog.solutions.map((solution) => solution.recipeId).sort()
    ).toEqual(expectedRecipeIds);
    expect(
      ndtApplicationScenarioCatalog.solutions.every(
        (solution) => !("assetIds" in solution) && !("outputFormats" in solution)
      )
    ).toBe(true);
  });

  it("covers the six selection roles and all ten capability categories", () => {
    expect(
      Object.fromEntries(
        ndtApplicationScenarioCatalog.categoryRoles.map(({ categoryId, roleId }) => [
          categoryId,
          roleId
        ])
      )
    ).toEqual({
      rules: "workflow",
      prompts: "workflow",
      templates: "scaffold",
      "style-packs": "visual-language",
      brand: "building-block",
      tokens: "building-block",
      tools: "quality-gate",
      cases: "reference",
      snapshots: "reference",
      "external-packs": "reference"
    });

    const guidance = Object.fromEntries(
      ndtApplicationScenarioCatalog.roles.map((role) => [role.id, role.selectionGuidance])
    );
    expect(guidance.workflow).toContain("自动匹配");
    expect(guidance.scaffold).toContain("起始结构");
    expect(guidance["visual-language"]).toContain("主风格");
    expect(guidance["building-block"]).toContain("自动组装");
    expect(guidance["quality-gate"]).toContain("导出前");
    expect(guidance.reference).toContain("需要时");
  });

  it("distinguishes direct Pack guidance from downstream targets", () => {
    const solutions = Object.fromEntries(
      ndtApplicationScenarioCatalog.solutions.map((solution) => [solution.recipeId, solution])
    );

    expect(solutions["presentation-chain"].directDeliverables).toEqual([
      "JSON 生产包",
      "Markdown 生产包"
    ]);
    expect(solutions["presentation-chain"].downstreamTargets).toEqual([
      "PPTX 演示文稿",
      "HTML 演示页面",
      "PDF 汇报版"
    ]);
    expect(solutions["ai-image-brief"].directDeliverables).toEqual(["图像生成 Brief"]);
    expect(solutions["ai-image-brief"].downstreamTargets).toEqual(["PNG 图像", "JPG 图像"]);
    expect(solutions["embedded-report-figure"].directDeliverables.join(" ")).not.toContain(
      "DOCX"
    );
    expect(solutions["embedded-report-figure"].boundary).toContain("不虚构整份 DOCX");
  });

  it("keeps cross-scenario use, visual style and recommendation boundaries explicit", () => {
    const solutions = Object.fromEntries(
      ndtApplicationScenarioCatalog.solutions.map((solution) => [solution.recipeId, solution])
    );
    const scenarios = Object.fromEntries(
      ndtApplicationScenarioCatalog.scenarios.map((scenario) => [scenario.id, scenario])
    );

    expect(solutions["architecture-map"].avoidScenarioIds).toContain("product-ui");
    expect(solutions["ai-image-brief"].supportingScenarioIds).toContain("business-document");
    expect(solutions["internal-workbench"].avoidScenarioIds).toContain("presentation");
    expect(solutions["photo-derived-editorial-diptych"].boundary).toContain("不得将合成画面当作事实证据");
    expect(solutions["editorial-handwritten-research-note"].boundary).toContain("不得伪造");
    expect(solutions["editorial-handwritten-research-note"].supportingScenarioIds).toContain(
      "web-html"
    );
    expect(scenarios["visual-communication"].styleIntent).toContain("统一视觉语言");
    expect(scenarios.presentation.boundary).toContain("可编辑");
  });

  it("rejects broken references, overlaps, duplicates and incomplete guidance", () => {
    const invalid: ApplicationScenarioCatalog = {
      contractVersion: "invalid" as ApplicationScenarioCatalog["contractVersion"],
      scenarios: [
        ...ndtApplicationScenarioCatalog.scenarios,
        { ...ndtApplicationScenarioCatalog.scenarios[0], label: "" }
      ],
      solutions: [
        ...ndtApplicationScenarioCatalog.solutions.filter(
          (solution) => solution.recipeId !== "short-video"
        ),
        {
          ...ndtApplicationScenarioCatalog.solutions[0],
          primaryScenarioId: "missing-scenario",
          supportingScenarioIds: ["web-html", "web-html"],
          avoidScenarioIds: ["web-html"],
          directDeliverables: [],
          downstreamTargets: []
        }
      ],
      roles: [
        ...ndtApplicationScenarioCatalog.roles,
        ndtApplicationScenarioCatalog.roles[0]
      ],
      categoryRoles: [
        ...ndtApplicationScenarioCatalog.categoryRoles,
        ndtApplicationScenarioCatalog.categoryRoles[0],
        { categoryId: "orphan", categoryLabel: "", roleId: "missing-role" }
      ]
    };

    const codes = validateApplicationScenarioCatalog(invalid, {
      recipeIds: [...expectedRecipeIds.filter((id) => id !== "internal-workbench"), "future-recipe"],
      categoryIds: [...expectedCategoryIds.filter((id) => id !== "rules"), "future-category"]
    }).map((issue) => issue.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "invalid_contract_version",
        "duplicate_scenario_id",
        "duplicate_solution_id",
        "duplicate_role_id",
        "duplicate_category_id",
        "missing_text",
        "unknown_scenario_reference",
        "duplicate_scenario_reference",
        "overlapping_scenario_reference",
        "missing_deliverable_guidance",
        "unknown_category_role",
        "missing_primary_solution",
        "missing_recipe_solution",
        "unknown_recipe_solution",
        "missing_category_role_mapping",
        "unknown_category_role_mapping"
      ])
    );
  });
});
