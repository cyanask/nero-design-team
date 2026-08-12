import { Grid2X2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CapabilityAssetVM, CapabilityLibraryVM, ReadEnvelope } from "../../core/contracts";
import { filterCapabilities, selectCapability } from "../../core/compose";
import { capabilityHash } from "../../core/routes";
import {
  statusTone
} from "../../packs/ndt/pack";
import { CapabilityInspector, type AssetProjectUsage } from "./CapabilityInspector";
import { CapabilityPreview } from "./CapabilityPreview";
import { SourcePassport } from "./SourcePassport";

type Props = {
  envelope: ReadEnvelope<CapabilityLibraryVM>;
  requestedAssetId: string | null;
  usageByAssetId?: Record<string, AssetProjectUsage[]>;
};

export function CapabilityLibrary({ envelope, requestedAssetId, usageByAssetId = {} }: Props) {
  const [search, setSearch] = useState("");
  const [filterId, setFilterId] = useState(() => {
    const requested = envelope.data?.assets.find((asset) => asset.id === requestedAssetId);
    return requested && requested.preview.state !== "resolved" ? "all" : "visual";
  });
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const library = envelope.data;

  useEffect(() => {
    const requested = library?.assets.find((asset) => asset.id === requestedAssetId);
    if (!requested) return;
    setFilterId(requested.preview.state === "resolved" ? "visual" : "all");
    setRecipeId(null);
    setSearch("");
  }, [library, requestedAssetId]);

  const categoryId = filterId === "visual" || filterId === "all" ? null : filterId;

  const filtered = useMemo(
    () => (library ? filterCapabilities(library, {
      search,
      categoryId,
      recipeId,
      previewOnly: filterId === "visual"
    }) : []),
    [library, search, categoryId, recipeId, filterId]
  );

  if (!library) {
    return <section className="fatal-panel">能力快照不可用。</section>;
  }

  const requestedExists = requestedAssetId
    ? library.assets.some((asset) => asset.id === requestedAssetId)
    : false;
  const selected = requestedAssetId && !requestedExists
    ? null
    : selectCapability(
        filtered,
        requestedAssetId && filtered.some((asset) => asset.id === requestedAssetId)
          ? requestedAssetId
          : null
      );
  const activeRecipe = recipeId ? library.recipes.find((recipe) => recipe.id === recipeId) : null;
  const activeCategory = categoryId
    ? library.categories.find((category) => category.id === categoryId)
    : null;
  const previewCount = library.assets.filter((asset) => asset.preview.state === "resolved").length;
  const contextLabel = activeRecipe?.label
    ?? activeCategory?.label
    ?? (filterId === "visual" ? "全部可视资产" : "完整资产目录");
  const contextEyebrow = activeRecipe
    ? "REUSE SET"
    : activeCategory
      ? categoryPrefix(activeCategory.assetIds, library.assets)
      : filterId === "visual"
        ? "VISUAL ASSET BOARD"
        : "ASSET DIRECTORY";

  return (
    <section className="capability-space" aria-label="能力库">
      <section className="asset-workbench">
        <aside className="asset-rail" aria-label="能力分类">
          <div className="asset-rail-head">
            <span className="section-label">CATEGORY / ID RANGE</span>
            <h1>设计资产</h1>
            <p>{library.assets.length} ASSETS · {previewCount} VISUAL</p>
            <strong className={library.integrityIssues.length ? "warning" : "positive"}>
              NDT {envelope.source.sourceVersion ?? "unknown"} · {library.integrityIssues.length} 个开放问题
            </strong>
          </div>
          <div className="asset-rail-scroll">
            <FilterButton
              prefix="VIS"
              label="可视资产"
              count={previewCount}
              active={filterId === "visual"}
              onClick={() => setFilterId("visual")}
            />
            <FilterButton
              prefix="ALL"
              label="全部资产"
              count={library.assets.length}
              active={filterId === "all"}
              onClick={() => setFilterId("all")}
            />
            {library.categories.map((category) => (
              <FilterButton
                prefix={categoryPrefix(category.assetIds, library.assets)}
                label={category.label}
                count={category.assetIds.length}
                active={filterId === category.id}
                onClick={() => setFilterId(category.id)}
                key={category.id}
              />
            ))}
          </div>
          <div className="asset-rail-boundary">
            <span className="section-label">STABLE ID RULE</span>
            <p>编号按资产类别分配并永久保留；新增资产只追加，不重排既有编号。</p>
            <small>{library.unboundDomainRecords.length} 条领域记录尚未绑定稳定资产 ID。</small>
          </div>
        </aside>

        <section className="asset-board" aria-label="视觉资产板">
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
          </div>
          <div className="asset-context">
            <div>
              <span>{contextEyebrow}</span>
              <strong>{contextLabel}</strong>
            </div>
            <p>点击资产查看预览、复用边界、真源与可复制引用指令。</p>
            <div className="asset-context-actions">
              <b>{filtered.length} ITEMS</b>
              <details className="capability-source-details">
                <summary>来源与版本</summary>
                <div className="capability-source-popover">
                  <SourcePassport envelope={envelope} />
                </div>
              </details>
            </div>
          </div>
          <div className="asset-grid-scroll" aria-live="polite">
            {filtered.length ? (
              <div className="asset-grid">
                {filtered.map((asset) => (
                  <CapabilityCard
                    asset={asset}
                    active={selected?.id === asset.id}
                    key={asset.id}
                  />
                ))}
              </div>
            ) : (
              <div className="asset-empty">
                <Search size={24} strokeWidth={1.25} aria-hidden="true" />
                <strong>没有匹配的设计资产</strong>
                <span>调整编号目录、方案筛选或搜索词。</span>
              </div>
            )}
          </div>
        </section>

        <CapabilityInspector
          asset={selected}
          usageProjects={selected ? usageByAssetId[selected.id] ?? [] : []}
        />
      </section>
      <div className="mobile-asset-inspector">
        <CapabilityInspector
          asset={selected}
          usageProjects={selected ? usageByAssetId[selected.id] ?? [] : []}
        />
      </div>
    </section>
  );
}

function categoryPrefix(assetIds: string[], assets: CapabilityAssetVM[]): string {
  const first = assets.find((asset) => assetIds.includes(asset.id));
  return first?.id.split("-")[1] ?? "NDT";
}

function FilterButton({ prefix, label, count, active, onClick }: {
  prefix: string;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={active ? "active" : ""} onClick={onClick} type="button">
      <span className="mono">{prefix}</span>
      <strong>{label}</strong>
      <small>{count}</small>
    </button>
  );
}

function CapabilityCard({ asset, active }: { asset: CapabilityAssetVM; active: boolean }) {
  const tone = statusTone(asset.rawStatus, asset.issueCodes);
  return (
    <a
      className={active ? "asset-card selected" : "asset-card"}
      href={capabilityHash(asset.id)}
      aria-current={active ? "true" : undefined}
    >
      <CapabilityPreview asset={asset} compact />
      <div className="asset-card-copy">
        <div className="asset-card-meta">
          <span className="mono">{asset.id}</span>
          <span>{asset.categoryId}</span>
          <i className={"status-dot " + tone} aria-hidden="true" />
        </div>
        <strong>{asset.name}</strong>
        <p>{asset.purpose || asset.useFor.join("；")}</p>
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
