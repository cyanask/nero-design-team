import type { ReactNode } from "react";
import type { WorkbenchRoute } from "../../core/routes";
import { ndtPack } from "../../packs/ndt/pack";

type Props = {
  route: WorkbenchRoute;
  demo: boolean;
  summary?: {
    version: string | null;
    assetCount: number;
    recipeCount: number;
    integrityCount: number;
  };
  children: ReactNode;
};

export function AppShell({ route, demo, summary, children }: Props) {
  const activeSpace = route.space === "projects" ? "projects" : "capabilities";
  const catalogSummary = summary ?? {
    version: null,
    assetCount: 0,
    recipeCount: 0,
    integrityCount: 0
  };
  const versionLabel = catalogSummary.version
    ? `NDT ${catalogSummary.version}`
    : "NDT unknown";
  return (
    <main className={demo ? "app-shell with-demo" : "app-shell"}>
      <header className="app-topbar" aria-label={ndtPack.productName}>
        <a className="brand-lockup" href="#/capabilities" aria-label={ndtPack.productName}>
          <img className="brand-symbol" src="./app-icon.svg" alt="" />
          <strong>{ndtPack.productName}</strong>
        </a>
        <nav className="space-nav" aria-label="一级空间">
          <a
            className={activeSpace === "capabilities" ? "active" : ""}
            href="#/capabilities"
            aria-current={activeSpace === "capabilities" ? "page" : undefined}
          >
            {ndtPack.spaces.capabilities}
          </a>
          <a
            className={activeSpace === "projects" ? "active" : ""}
            href="#/projects"
            aria-current={activeSpace === "projects" ? "page" : undefined}
          >
            {ndtPack.spaces.projects}
          </a>
        </nav>
        <div className="top-summary" aria-label="目录概览">
          <span>{versionLabel}</span>
          <span>{catalogSummary.assetCount} 项能力</span>
          <span>{catalogSummary.recipeCount} 个组合</span>
          <span className={catalogSummary.integrityCount ? "warning" : ""}>{catalogSummary.integrityCount} 个开放问题</span>
        </div>
      </header>
      {demo ? (
        <div className="demo-banner" role="status">
          DEMO FIXTURE · 合成数据，不代表当前 NERO Design Team 状态
        </div>
      ) : null}
      <section className="workspace">{children}</section>
    </main>
  );
}
