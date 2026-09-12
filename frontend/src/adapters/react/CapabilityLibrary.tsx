import { Grid2X2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CapabilityAssetVM, CapabilityLibraryVM, ReadEnvelope } from "../../core/contracts";
import { filterCapabilities, selectCapability, revealCapabilityFilters, type CapabilityFilter } from "../../core/compose";
import { capabilityDirectoryHash, capabilityHash } from "../../core/routes";
import {
  capabilityTone, maturityLabel, reuseStateLabel, reuseStateLabels
} from "../../packs/ndt/pack";
import { CapabilityInspector, type AssetProjectUsage } from "./CapabilityInspector";
import { CapabilityPreview } from "./CapabilityPreview";

type Props = {
  envelope: ReadEnvelope<CapabilityLibraryVM>;
  requestedAssetId: string | null;
  usageByAssetId?: Record<string, AssetProjectUsage[]>;
  backTo?: { href: string; label: string };
};

export function CapabilityLibrary({ envelope, requestedAssetId, usageByAssetId = {}, backTo }: Props) {
  const [filters, setFilters] = useState<CapabilityFilter>({ search: "", categoryId: null, recipeId: null, reuseState: null, previewOnly: false });
  const { search, categoryId, recipeId, reuseState, previewOnly } = filters;
  const setSearch = (search: string) => setFilters((current) => ({ ...current, search }));
  const setReuseState = (reuseState: CapabilityFilter["reuseState"]) => setFilters((current) => ({ ...current, reuseState }));
  const setRecipeId = (recipeId: string | null) => setFilters((current) => ({ ...current, recipeId }));
  const setCategory = (categoryId: string | null) => setFilters((current) => ({ ...current, categoryId }));
  const library = envelope.data;

  useEffect(() => {
    if (library) setFilters((current) => revealCapabilityFilters(library, current, requestedAssetId));
  }, [library, requestedAssetId]);

  const filtered = useMemo(
    () => (library ? filterCapabilities(library, {
      search,
      categoryId,
      recipeId,
      previewOnly,
      reuseState
    }) : []),
    [library, search, categoryId, recipeId, previewOnly, reuseState]
  );

  if (!library) {
    return <section className="fatal-panel">能力快照不可用。</section>;
  }

  if (requestedAssetId !== null) {
    const asset = selectCapability(library.assets, requestedAssetId);
    return <section className="asset-detail-view" aria-label="资产详情页">
      <nav className="capability-breadcrumb" aria-label="当前位置"><a href={backTo?.href ?? capabilityDirectoryHash()}>← {backTo?.label ?? "资产库"}</a><span>{asset?.name ?? "资产未找到"}</span></nav>
      <CapabilityInspector asset={asset} usageProjects={asset ? usageByAssetId[asset.id] ?? [] : []} />
    </section>;
  }
  const activeRecipe = recipeId ? library.recipes.find((recipe) => recipe.id === recipeId) : null;
  const activeCategory = categoryId
    ? library.categories.find((category) => category.id === categoryId)
    : null;
  const contextLabel = activeRecipe?.label
    ?? activeCategory?.label
    ?? "全部资产";

  return (
    <section className="capability-space" aria-label="能力库">
      <section className="asset-workbench">
        <section className="asset-board" aria-label="资产结果">
          <div className="asset-context">
            <div>
              <h1>资产库</h1>
            </div>
            <p>{contextLabel} <span aria-hidden="true">·</span> 查看、选择与引用</p>
            <div className="asset-context-actions">
              <b>{filtered.length} 项结果</b>
            </div>
          </div>
          <div className="asset-toolbar">
            <label className="search-field">
              <Search size={15} aria-hidden="true" />
              <span className="sr-only">搜索能力</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索编号、名称、用途或 Prompt"
              />
            </label>
            <label className="recipe-select category-select">
              <span className="sr-only">资产类别</span>
              <select value={categoryId ?? ""} onChange={(event) => setCategory(event.target.value || null)}>
                <option value="">全部类别</option>
                {library.categories.map((category) => <option value={category.id} key={category.id}>{category.label}</option>)}
              </select>
            </label>
            <label className="recipe-select">
              <Grid2X2 size={14} aria-hidden="true" />
              <span className="sr-only">按方案筛选</span>
              <select
                value={recipeId ?? ""}
                onChange={(event) => setRecipeId(event.target.value || null)}
              >
                <option value="">全部方案</option>
                {library.recipes.map((recipe) => (
                  <option value={recipe.id} key={recipe.id}>
                    {recipe.label} · {recipe.assetIds.length}
                  </option>
                ))}
              </select>
            </label>

            <label className="recipe-select">
              <span className="sr-only">复用状态筛选</span>
              <select value={reuseState ?? ""} onChange={(event) => setReuseState(event.target.value ? event.target.value as CapabilityAssetVM["reuseState"] : null)}>
                <option value="">全部复用状态</option>
                {Object.entries(reuseStateLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="preview-filter">
              <input type="checkbox" checked={!!previewOnly} onChange={(event) => setFilters((current) => ({ ...current, previewOnly: event.target.checked }))} />
              有预览
            </label>
          </div>
          <div className="asset-grid-scroll" aria-live="polite">
            {filtered.length ? (
              <div className="asset-grid">
                {filtered.map((asset) => (
                  <CapabilityCard
                    asset={asset}
                    categoryLabel={library.categories.find((category) => category.id === asset.categoryId)?.label ?? asset.categoryId}
                    active={false}
                    key={asset.id}
                  />
                ))}
              </div>
            ) : (
              <div className="asset-empty">
                <Search size={24} strokeWidth={1.25} aria-hidden="true" />
                <strong>没有匹配的设计资产</strong>
                <span>调整类别、方案筛选或搜索词。</span>
              </div>
            )}
          </div>
        </section>


      </section>
    </section>
  );
}

export function CapabilityCard({ asset, active, categoryLabel }: { asset: CapabilityAssetVM; active: boolean; categoryLabel: string }) {
  const tone = capabilityTone(asset);
  return (
    <a
      className={`asset-card${active ? " selected" : ""}${asset.preview.state !== "resolved" ? " metadata-card" : ""}`}
      href={capabilityHash(asset.id)}
      aria-current={active ? "true" : undefined}
    >
      {asset.preview.state === "resolved" && <CapabilityPreview asset={asset} compact />}
      <div className="asset-card-copy">
        <div className="asset-card-meta">
          <span className="mono">{asset.id}</span>
          <span>{categoryLabel}</span>
          <i className={"status-dot " + tone} aria-hidden="true" />
        </div>
        <strong>{asset.name}</strong>
        <p>{asset.purpose || asset.useFor.join("；")}</p>
        <small className={tone}>{reuseStateLabel(asset)} · {maturityLabel(asset)}</small>
        {asset.preview.state !== "resolved" && <small>暂无预览 · 可查看登记资料</small>}
        {asset.preview.variants.length ? (
          <small className="asset-variant-count">
            {asset.id === "NDT-STY-002"
              ? `${asset.preview.variants.length} 个子风格`
              : `${asset.preview.variants.length} 张原始参考`}
          </small>
        ) : null}
      </div>
    </a>
  );
}
