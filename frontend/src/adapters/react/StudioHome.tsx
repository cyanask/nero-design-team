import { useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import type { CapabilityAssetVM, CapabilityLibraryVM } from "../../core/contracts";
import type { ApplicationScenarioCatalog } from "../../core/application-scenarios";
import { filterCapabilities, effectiveReuseState } from "../../core/compose";
import { capabilityHash, scenarioHash } from "../../core/routes";
import { reuseStateLabel, maturityLabel } from "../../packs/ndt/pack";
import { CapabilityCard } from "./CapabilityLibrary";

export type StudioSelection = ReadonlyArray<{ assetId: string; caption: string }>;

type Props = { features?: StudioSelection; library: CapabilityLibraryVM; catalog: ApplicationScenarioCatalog; query?: string; onQueryChange?: (value: string) => void };

export function StudioHome({ library, catalog, query, onQueryChange, features = [] }: Props) {
  const [localQuery, setLocalQuery] = useState("");
  const search = query ?? localQuery;
  const setSearch = onQueryChange ?? setLocalQuery;
  const eligible = library.assets.filter((asset) => !["quarantined", "placeholder"].includes(effectiveReuseState(asset)) && asset.issueCodes.length === 0);
  const selected = features.map((item) => eligible.find((asset) => asset.id === item.assetId)).filter((asset): asset is CapabilityAssetVM => !!asset);
  const featured = selected.length ? selected : eligible.slice(0, 3);
  const results = filterCapabilities(library, { search, categoryId: null, recipeId: null });
  return <div className="scenario-browser-page studio-home">
    <header className="studio-page-head">
      <div><p className="eyebrow">风格、材料与表达</p><h1>设计工作室</h1><p>按任务找到方案，从样本选择表达。</p></div>
      <label className="studio-search"><Search size={16} aria-hidden="true" /><span className="sr-only">查找工作室资产</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="查找风格、模板或规则" /></label>
    </header>
    {!library.assets.length && <section className="empty-result" aria-label="空库说明"><h2>连接你自己的设计资料</h2><p>开源包提供系统和 Skill，不附带资产库、案例库或风格库内容。</p><p>请按 README 接入本地目录；当前浏览器为只读，不会自动导入或发布你的资料。</p></section>}
    {search.trim() ? <section className="studio-results" aria-label="工作室搜索结果">
      <p>{results.length} 项结果</p>
      <div className="asset-grid">{results.map((asset) => <CapabilityCard key={asset.id} asset={asset} active={false} categoryLabel={library.categories.find((category) => category.id === asset.categoryId)?.label ?? asset.categoryId} />)}</div>
      {!results.length && <p className="empty-result">没有匹配的资产，试试其他关键词。</p>}
    </section> : <>
      {featured.length > 0 && <section className="studio-feature-grid" aria-label="精选设计资产">
        <StudioFeature asset={featured[0]} features={features} primary />
        <div className="studio-side-studies">{featured.slice(1).map((asset) => <StudioFeature key={asset.id} asset={asset} features={features} />)}</div>
      </section>}
      <section className="studio-tasks" aria-label="按任务选择方案">
        <div className="studio-section-heading"><h2>从交付目标开始</h2><span>{catalog.scenarios.length} 类任务</span></div>
        <div className="studio-task-grid">{catalog.scenarios.map((scenario) => <a key={scenario.id} href={scenarioHash(scenario.id)}>
          <strong>{scenario.label}</strong><span>{catalog.solutions.filter((solution) => solution.primaryScenarioId === scenario.id).length} 个主方案</span><ArrowUpRight size={15} aria-hidden="true" />
        </a>)}</div>
      </section>
      <p className="studio-boundary">预览用于选择表达方式；使用前请核对资产详情中的来源与边界。</p>
    </>}
  </div>;
}

function StudioFeature({ asset, features, primary = false }: { asset: CapabilityAssetVM; features: StudioSelection; primary?: boolean }) {
  const resolved = asset.preview.state === "resolved" && asset.preview.url;
  const pair = primary && resolved && asset.preview.variants.length > 1;
  const caption = features.find((item) => item.assetId === asset.id)?.caption ?? asset.purpose;
  return <a href={capabilityHash(asset.id)} className={primary ? "studio-feature primary" : "studio-feature secondary"}>
    <div className={`studio-art${pair ? " paper-pair" : ""}`}>
      {resolved ? <>{pair && <img className="paper-back" src={asset.preview.variants[1].url} alt={asset.preview.variants[1].label} />}<img className={pair ? "paper-front" : ""} src={asset.preview.url!} alt={asset.preview.label || asset.name} /></> : <span>此包未提供视觉预览</span>}
    </div>
    <div className="studio-feature-copy"><span className="studio-kicker">{reuseStateLabel(asset)} · {maturityLabel(asset)}</span><h2>{asset.name}</h2><p>{caption}</p><span className="studio-open">查看资产 <ArrowUpRight size={15} aria-hidden="true" /></span></div>
  </a>;
}
