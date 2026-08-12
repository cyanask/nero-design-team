import { ExternalLink, Layers3, TriangleAlert } from "lucide-react";
import type { JSX } from "react";
import type { ApplicationScenarioCatalog } from "../../core/application-scenarios";
import type { CapabilityAssetVM, CapabilityLibraryVM } from "../../core/contracts";
import { capabilityHash, scenarioHash } from "../../core/routes";
import { CapabilityPreview } from "./CapabilityPreview";
import { ScenarioEmptyState } from "./ApplicationScenarioIndex";

type GroupedAssets = {
  byRole: Record<string, CapabilityAssetVM[]>;
  missingAssetIds: string[];
  unmappedAssetIds: string[];
  unmappedAssets: CapabilityAssetVM[];
};

export function ApplicationSolutionDetail({
  catalog,
  library,
  recipeId
}: {
  catalog: ApplicationScenarioCatalog;
  library: CapabilityLibraryVM;
  recipeId: string | null;
}): JSX.Element {
  const solution = recipeId
    ? catalog.solutions.find((item) => item.recipeId === recipeId)
    : undefined;
  const recipe = recipeId ? library.recipes.find((item) => item.id === recipeId) : undefined;
  if (!solution || !recipe) {
    const detail = !recipeId
      ? "当前链接没有提供方案 ID。"
      : !solution
        ? `链接中的方案 ID “${recipeId}”不在当前 Pack 目录内。`
        : "Pack 已登记方案，但能力快照中没有对应 Recipe。";
    return <ScenarioEmptyState eyebrow="SOLUTION NOT FOUND" title="没有找到这个应用方案" detail={detail} />;
  }
  const scenario = catalog.scenarios.find(
    (item) => item.id === solution.primaryScenarioId
  );
  const grouped = groupRecipeAssets(catalog, library, recipe.assetIds);
  const populatedRoles = catalog.roles.filter((role) => (grouped.byRole[role.id] ?? []).length > 0);
  const unusedRoles = catalog.roles.filter((role) => (grouped.byRole[role.id] ?? []).length === 0);
  return (
    <div className="scenario-browser-page solution-detail-page">
      <header className="solution-detail-head">
        <div>
          <span className="section-label">SOLUTION / {solution.recipeId}</span>
          <h1>{solution.label}</h1>
          <p>{solution.summary}</p>
          <div className="solution-context-links">
            <a href={scenarioHash(solution.primaryScenarioId)}>
              主场景：{scenario?.label ?? solution.primaryScenarioId}
            </a>
            {solution.supportingScenarioIds.map((id) => {
              const supporting = catalog.scenarios.find((item) => item.id === id);
              return <a href={scenarioHash(id)} key={id}>协作：{supporting?.label ?? id}</a>;
            })}
          </div>
        </div>
        <div className="solution-deliverables">
          <DeliverableList label="直接产物" items={solution.directDeliverables} />
          <DeliverableList label="下游目标" items={solution.downstreamTargets} downstream />
        </div>
      </header>
      <section className="solution-boundary" aria-label="方案边界">
        <span className="section-label">BOUNDARY</span>
        <p>{solution.boundary}</p>
      </section>
      {grouped.missingAssetIds.length ? (
        <div className="scenario-warning" role="alert">
          <TriangleAlert size={17} aria-hidden="true" />
          <span>
            有 {grouped.missingAssetIds.length} 项 Recipe 资产未出现在当前能力快照：{grouped.missingAssetIds.join("、")}。它们没有被静默忽略，请先补齐来源或重新读取快照。
          </span>
        </div>
      ) : null}
      {grouped.unmappedAssetIds.length ? (
        <div className="scenario-warning secondary" role="alert">
          <TriangleAlert size={17} aria-hidden="true" />
          <span>
            有 {grouped.unmappedAssetIds.length} 项资产没有角色映射：{grouped.unmappedAssetIds.join("、")}。当前仍保留在“未分组资产”中。
          </span>
        </div>
      ) : null}
      <section className="role-section" aria-labelledby="role-section-heading">
        <div className="role-section-head">
          <div>
            <span className="section-label">SOLUTION BUILD</span>
            <h2 id="role-section-heading">这套方案由什么组成</h2>
          </div>
          <span className="role-section-note"><Layers3 size={15} aria-hidden="true" /> {recipe.assetIds.length} 项 Recipe 资产</span>
        </div>
        <div className="role-groups">
          {populatedRoles.map((role) => (
            <RoleGroup
              key={role.id}
              roleId={role.id}
              label={role.label}
              description={role.description}
              guidance={role.selectionGuidance}
              assets={grouped.byRole[role.id] ?? []}
            />
          ))}
          {grouped.unmappedAssets.length ? (
            <RoleGroup
              roleId="reference"
              label="未分组资产"
              description="当前分类没有对应的应用角色，请在资产目录中复核。"
              guidance="这些资产保留在方案上下文中，但不能自动归入六类能力角色。"
              assets={grouped.unmappedAssets}
              unmapped
            />
          ) : null}
        </div>
        {unusedRoles.length ? (
          <p className="unused-role-summary">
            本方案未使用：{unusedRoles.map((role) => role.label).join("、")}。
          </p>
        ) : null}
      </section>
    </div>
  );
}

function DeliverableList({ label, items, downstream = false }: { label: string; items: readonly string[]; downstream?: boolean }): JSX.Element {
  return (
    <div className={downstream ? "deliverable-list downstream" : "deliverable-list"}>
      <span>{label}</span>
      <ul>{items.length ? items.map((item) => <li key={item}>{item}</li>) : <li>未登记</li>}</ul>
      <small>{downstream ? "需要后续渲染或交付动作" : "本方案直接负责的结果"}</small>
    </div>
  );
}

function RoleGroup({
  roleId,
  label,
  description,
  guidance,
  assets,
  unmapped = false
}: {
  roleId: string;
  label: string;
  description: string;
  guidance: string;
  assets: CapabilityAssetVM[];
  unmapped?: boolean;
}): JSX.Element {
  return (
    <section className={`role-group ${unmapped ? "unmapped-role" : roleTone(roleId)}`}>
      <div className="role-group-head">
        <div>
          <span className="role-kicker">{unmapped ? "UNMAPPED" : roleId.toUpperCase()}</span>
          <h3>{label}</h3>
        </div>
        <span>{assets.length} 项</span>
      </div>
      <p className="role-description">{description}</p>
      <p className="role-guidance">{guidance}</p>
      {assets.length ? (
        <div className="role-assets">{assets.map((asset) => <AssetReference asset={asset} key={asset.id} />)}</div>
      ) : (
        <p className="role-empty">这套方案暂未登记此类资产。</p>
      )}
    </section>
  );
}

function AssetReference({ asset }: { asset: CapabilityAssetVM }): JSX.Element {
  return (
    <a className="scenario-asset" href={capabilityHash(asset.id)}>
      <CapabilityPreview asset={asset} compact />
      <div className="scenario-asset-copy">
        <span className="mono">{asset.id}</span>
        <strong>{asset.name}</strong>
        <p>{asset.purpose || asset.useFor.join("；") || "用途未登记"}</p>
        <span className="scenario-asset-link">打开资产 <ExternalLink size={12} aria-hidden="true" /></span>
      </div>
    </a>
  );
}

function roleTone(roleId: string): string {
  return ({
    workflow: "workflow",
    scaffold: "scaffold",
    "visual-language": "visual",
    "building-block": "building",
    "quality-gate": "quality",
    reference: "reference"
  } as Record<string, string>)[roleId] ?? "reference";
}

function groupRecipeAssets(
  catalog: ApplicationScenarioCatalog,
  library: CapabilityLibraryVM,
  assetIds: readonly string[]
): GroupedAssets {
  const byRole: Record<string, CapabilityAssetVM[]> = {};
  const missingAssetIds: string[] = [];
  const unmappedAssetIds: string[] = [];
  const unmappedAssets: CapabilityAssetVM[] = [];
  const roleByCategory = new Map<string, string>(
    catalog.categoryRoles.map((mapping) => [mapping.categoryId, mapping.roleId])
  );
  const knownRoleIds = new Set(catalog.roles.map((role) => role.id));
  for (const assetId of assetIds) {
    const asset = library.assets.find((item) => item.id === assetId);
    if (!asset) {
      missingAssetIds.push(assetId);
      continue;
    }
    const roleId = roleByCategory.get(asset.categoryId);
    if (!roleId || !knownRoleIds.has(roleId)) {
      unmappedAssetIds.push(asset.id);
      unmappedAssets.push(asset);
      continue;
    }
    (byRole[roleId] ??= []).push(asset);
  }
  return { byRole, missingAssetIds, unmappedAssetIds, unmappedAssets };
}
