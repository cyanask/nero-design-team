import { ArrowRight } from "lucide-react";
import type { JSX } from "react";
import type {
  ApplicationScenarioCatalog,
  ApplicationSolution
} from "../../core/application-scenarios";
import type { CapabilityAssetVM, CapabilityLibraryVM } from "../../core/contracts";
import { scenarioHash, solutionHash } from "../../core/routes";
import { CapabilityPreview } from "./CapabilityPreview";
import type { ApplicationScenarioBrowserProps } from "./ApplicationScenarioBrowser";

type Props = Pick<ApplicationScenarioBrowserProps, "catalog" | "library" | "mode" | "scenarioId"> & {
  mode: "index" | "scenario";
};

export function ApplicationScenarioIndex({ catalog, library, mode, scenarioId }: Props): JSX.Element {
  return mode === "index" ? (
    <ScenarioIndex catalog={catalog} library={library} />
  ) : (
    <ScenarioDetail catalog={catalog} library={library} scenarioId={scenarioId} />
  );
}

function ScenarioIndex({
  catalog,
  library
}: {
  catalog: ApplicationScenarioCatalog;
  library: CapabilityLibraryVM;
}): JSX.Element {
  return (
    <div className="scenario-browser-page scenario-index">
      <header className="scenario-page-head">
        <div>
          <span className="section-label">
            APPLICATION SCENARIOS / {String(catalog.scenarios.length).padStart(2, "0")}
          </span>
          <h1>先说你要做什么，再选怎么做</h1>
          <p>
            应用场景是入口，不要求你先分辨 Skill、模板、风格和设计资产。选择目标后，NDT 会把一套可复用方案拆给你。
          </p>
        </div>
        <div className="scenario-head-note">
          <span>能力构成</span>
          <strong>做法 → 起始结构 → 视觉语言 → 资产 → 检查</strong>
        </div>
      </header>
      <div className="scenario-index-grid">
        {catalog.scenarios.map((scenario, index) => {
          const primary = catalog.solutions.filter(
            (solution) => solution.primaryScenarioId === scenario.id
          );
          const supporting = catalog.solutions.filter((solution) =>
            new Set<string>(solution.supportingScenarioIds).has(scenario.id)
          );
          const representative = findScenarioRepresentativeAsset(library, scenario.representativeAssetId, [
            ...primary,
            ...supporting
          ]);
          return (
            <a
              className="scenario-card"
              data-preview-asset-id={representative?.id}
              data-scenario={scenario.id}
              href={scenarioHash(scenario.id)}
              key={scenario.id}
            >
              <div className="scenario-card-topline">
                <span className="scenario-index-number">0{index + 1}</span>
                <span className="scenario-card-count">
                  {primary.length} 主方案 · {supporting.length} 协作
                </span>
              </div>
              <div className="scenario-card-preview">
                {representative ? (
                  <>
                    <CapabilityPreview asset={representative} compact />
                    <span className="scenario-card-preview-name">{representative.name}</span>
                  </>
                ) : (
                  <span className="scenario-card-no-preview">暂无已登记的真实预览</span>
                )}
              </div>
              <h2>{scenario.label}</h2>
              <p>{scenario.description}</p>
              <div className="scenario-card-style">
                <span>STYLE INTENT</span>
                <strong>{scenario.styleIntent}</strong>
              </div>
              <span className="scenario-card-link">
                查看适用方案 <ArrowRight size={15} aria-hidden="true" />
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function ScenarioDetail({
  catalog,
  library,
  scenarioId
}: {
  catalog: ApplicationScenarioCatalog;
  library: CapabilityLibraryVM;
  scenarioId: string | null;
}): JSX.Element {
  const scenario = scenarioId
    ? catalog.scenarios.find((item) => item.id === scenarioId)
    : undefined;
  if (!scenario) {
    return (
      <ScenarioEmptyState
        eyebrow="SCENARIO NOT FOUND"
        title="没有找到这个应用场景"
        detail={scenarioId ? `链接中的场景 ID “${scenarioId}”不在当前 Pack 目录内。` : "当前链接没有提供应用场景 ID。"}
      />
    );
  }
  const primary = catalog.solutions.filter(
    (solution) => solution.primaryScenarioId === scenario.id
  );
  const supporting = catalog.solutions.filter((solution) =>
    new Set<string>(solution.supportingScenarioIds).has(scenario.id)
  );
  return (
    <div className="scenario-browser-page scenario-detail-page">
      <header className="scenario-detail-head">
        <div>
          <span className="section-label">SCENARIO / {scenario.id}</span>
          <h1>{scenario.label}</h1>
          <p>{scenario.description}</p>
        </div>
        <div className="scenario-detail-intent">
          <span>STYLE INTENT</span>
          <strong>{scenario.styleIntent}</strong>
        </div>
      </header>
      <section className="scenario-boundary" aria-label="场景边界">
        <span className="section-label">BOUNDARY</span>
        <p>{scenario.boundary}</p>
      </section>
      <SolutionSection library={library} title="优先从这些方案开始" label="PRIMARY SOLUTIONS" solutions={primary} primary />
      <SolutionSection
        library={library}
        title="可以协作，但不是默认入口"
        label="SUPPORTING SOLUTIONS"
        solutions={supporting}
      />
    </div>
  );
}

function SolutionSection({
  library,
  title,
  label,
  solutions,
  primary = false
}: {
  library: CapabilityLibraryVM;
  title: string;
  label: string;
  solutions: readonly ApplicationSolution[];
  primary?: boolean;
}): JSX.Element {
  const grid = (
    <div className={primary ? "solution-grid" : "solution-grid supporting-grid"}>
      {solutions.length ? (
        solutions.map((solution) => (
          <SolutionCard library={library} solution={solution} key={solution.recipeId} primary={primary} />
        ))
      ) : (
        <p className="solution-empty">当前场景尚未登记此类方案。</p>
      )}
    </div>
  );

  return (
    <section className={primary ? "solution-section" : "solution-section supporting-section"}>
      <div className="solution-section-head">
        <div>
          <span className="section-label">{label}</span>
          <h2>{title}</h2>
        </div>
        <span className="solution-count">{solutions.length} 个方案</span>
      </div>
      {primary ? grid : (
        <details className="supporting-solutions-details">
          <summary>展开 {solutions.length} 个协作方案</summary>
          {grid}
        </details>
      )}
    </section>
  );
}

function SolutionCard({
  library,
  solution,
  primary = false
}: {
  library: CapabilityLibraryVM;
  solution: ApplicationSolution;
  primary?: boolean;
}): JSX.Element {
  const recipe = library.recipes.find((item) => item.id === solution.recipeId);
  if (!recipe) {
    return (
      <article className="solution-card unavailable" aria-disabled="true">
        <div className="solution-card-topline">
          <span className="mono">{solution.recipeId}</span>
          <span>当前快照未提供 Recipe</span>
        </div>
        <h3>{solution.label}</h3>
        <p>{solution.summary}</p>
        <div className="solution-card-deliverables">
          <span>直接产物</span>
          <strong>{solution.directDeliverables.join(" · ")}</strong>
        </div>
        <span className="solution-card-link">当前不可打开</span>
      </article>
    );
  }
  return (
    <a className={primary ? "solution-card primary" : "solution-card"} href={solutionHash(solution.recipeId)}>
      <div className="solution-card-topline">
        <span className="mono">{solution.recipeId}</span>
        <span>{recipe.assetIds.length} 项关联资产</span>
      </div>
      <h3>{solution.label}</h3>
      <p>{solution.summary}</p>
      <div className="solution-card-deliverables">
        <span>直接产物</span>
        <strong>{solution.directDeliverables.join(" · ")}</strong>
      </div>
      <span className="solution-card-link">
        查看方案构成 <ArrowRight size={14} aria-hidden="true" />
      </span>
    </a>
  );
}

export function ScenarioEmptyState({
  eyebrow,
  title,
  detail
}: {
  eyebrow: string;
  title: string;
  detail: string;
}): JSX.Element {
  return (
    <div className="scenario-browser-page">
      <div className="scenario-empty-state">
        <span className="section-label">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{detail}</p>
        <a href={scenarioHash()}>
          返回应用场景 <ArrowRight size={14} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

function findScenarioRepresentativeAsset(
  library: CapabilityLibraryVM,
  representativeAssetId: string | undefined,
  solutions: readonly ApplicationSolution[]
): CapabilityAssetVM | null {
  if (representativeAssetId) {
    const representative = library.assets.find((item) => item.id === representativeAssetId);
    if (representative?.preview.state === "resolved" && representative.preview.url) {
      return representative;
    }
  }
  for (const solution of solutions) {
    const recipe = library.recipes.find((item) => item.id === solution.recipeId);
    if (!recipe) continue;
    for (const assetId of recipe.assetIds) {
      const asset = library.assets.find((item) => item.id === assetId);
      if (asset?.preview.state === "resolved" && asset.preview.url) return asset;
    }
  }
  return null;
}
