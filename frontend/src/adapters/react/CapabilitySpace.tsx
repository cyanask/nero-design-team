import type {
  CapabilityLibraryVM,
  ProjectCatalogSnapshotVM,
  ReadEnvelope
} from "../../core/contracts";
import type { ApplicationScenarioCatalog } from "../../core/application-scenarios";
import type { WorkbenchRoute } from "../../core/routes";
import { capabilityDirectoryHash, scenarioHash } from "../../core/routes";
import { ApplicationScenarioBrowser } from "./ApplicationScenarioBrowser";
import { CapabilityLibrary } from "./CapabilityLibrary";
import type { AssetProjectUsage } from "./CapabilityInspector";

type CapabilityRoute = Extract<WorkbenchRoute, { space: "capabilities" }>;

type Props = {
  catalog: ReadEnvelope<CapabilityLibraryVM>;
  projects: ReadEnvelope<ProjectCatalogSnapshotVM>;
  route: CapabilityRoute;
  scenarioCatalog: ApplicationScenarioCatalog;
};

export function CapabilitySpace({ catalog, projects, route, scenarioCatalog }: Props) {
  const library = catalog.data;
  if (!library) {
    return <section className="fatal-panel">能力快照不可用。</section>;
  }

  const usageByAssetId = collectProjectUsage(projects.data);
  const scenariosActive = route.page !== "assets";

  return (
    <section className="capability-experience" aria-label="设计能力">
      <nav className="capability-view-nav" aria-label="设计能力浏览方式">
        <a
          className={scenariosActive ? "active" : ""}
          href={scenarioHash()}
          aria-current={scenariosActive ? "page" : undefined}
        >
          <span>按应用场景</span>
          <small>先确定要交付什么</small>
        </a>
        <a
          className={route.page === "assets" ? "active" : ""}
          href={capabilityDirectoryHash()}
          aria-current={route.page === "assets" ? "page" : undefined}
        >
          <span>资产目录</span>
          <small>按稳定 ID 浏览目录</small>
        </a>
      </nav>

      <div className="capability-view-body">
        {route.page === "assets" ? (
          <CapabilityLibrary
            envelope={catalog}
            requestedAssetId={route.assetId}
            usageByAssetId={usageByAssetId}
          />
        ) : (
          <ApplicationScenarioBrowser
            catalog={scenarioCatalog}
            library={library}
            mode={route.page === "solution" ? "solution" : route.scenarioId ? "scenario" : "index"}
            scenarioId={route.page === "scenarios" ? route.scenarioId : null}
            recipeId={route.page === "solution" ? route.recipeId : null}
          />
        )}
      </div>
    </section>
  );
}

function collectProjectUsage(
  projects: ProjectCatalogSnapshotVM | null
): Record<string, AssetProjectUsage[]> {
  if (!projects) return {};

  const usage: Record<string, AssetProjectUsage[]> = {};
  for (const detail of Object.values(projects.detailsById)) {
    const verifiedAssetIds = new Set(
      detail.adoptionReceipts
        .filter((receipt) => receipt.state === "verified")
        .map((receipt) => receipt.assetId)
    );
    for (const assetId of new Set([...detail.declaredAssetIds, ...verifiedAssetIds])) {
      (usage[assetId] ??= []).push({
        id: detail.id,
        name: detail.name,
        evidence: verifiedAssetIds.has(assetId) ? "verified_receipt" : "manifest_declaration"
      });
    }
  }
  return usage;
}
