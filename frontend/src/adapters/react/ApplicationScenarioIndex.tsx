import { StudioHome, type StudioSelection } from "./StudioHome";
import { ArrowRight } from "lucide-react";
import type { JSX } from "react";
import type {
  ApplicationScenarioCatalog,
  ApplicationSolution
} from "../../core/application-scenarios";
import type { CapabilityLibraryVM } from "../../core/contracts";
import { scenarioHash, solutionHash } from "../../core/routes";
import type { ApplicationScenarioBrowserProps } from "./ApplicationScenarioBrowser";

type Props = Pick<ApplicationScenarioBrowserProps, "catalog" | "library" | "mode" | "scenarioId"> & {
  mode: "index" | "scenario";
  studioSelection?: StudioSelection;
  query?: string;
  onQueryChange?: (value: string) => void;
};

export function ApplicationScenarioIndex({ catalog, library, mode, scenarioId, query, onQueryChange, studioSelection }: Props): JSX.Element {
  return mode === "index" ? (
    <StudioHome features={studioSelection} catalog={catalog} library={library} query={query} onQueryChange={onQueryChange} />
  ) : (
    <ScenarioDetail catalog={catalog} library={library} scenarioId={scenarioId} />
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
          <span className="section-label">设计方案</span>
          <h1>{scenario.label}</h1>
          <p>{scenario.description}</p>
        </div>
        <div className="scenario-detail-intent">
          <span>风格方向</span>
          <strong>{scenario.styleIntent}</strong>
        </div>
      </header>
      <section className="scenario-boundary" aria-label="场景边界">
        <span className="section-label">使用边界</span>
        <p>{scenario.boundary}</p>
      </section>
      <SolutionSection library={library} title="选择适合的方案" label="" solutions={primary} primary />
      <SolutionSection
        library={library}
        title="相关方案"
        label="协作方案"
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
          {label && <span className="section-label">{label}</span>}
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
          <span>{primary ? "适用方案" : "相关方案"}</span>
          <span>当前快照缺少方案组合</span>
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
        <span>{primary ? "适用方案" : "相关方案"}</span>
        <span>{recipe.assetIds.length} 项关联资产</span>
      </div>
      <h3>{solution.label}</h3>
      <p>{solution.summary}</p>
      <div className="solution-card-deliverables">
        <span>直接产物</span>
        <strong>{solution.directDeliverables.join(" · ")}</strong>
      </div>
      <span className="solution-card-link">
        查看方案 <ArrowRight size={14} aria-hidden="true" />
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
