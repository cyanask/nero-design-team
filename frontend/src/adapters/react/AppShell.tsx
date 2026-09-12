import type { ReactNode } from "react";
import { PanelsTopLeft, Shapes, FolderOpen, Info, ArrowUpRight } from "lucide-react";
import type { WorkbenchRoute } from "../../core/routes";
import type { ReadEnvelope } from "../../core/contracts";
import { ndtPack, sourceStateLabel } from "../../packs/ndt/pack";
import { SourcePassport } from "./SourcePassport";

type Props = {
  route: WorkbenchRoute;
  demo: boolean;
  assetOrigin?: WorkbenchRoute | null;
  source?: ReadEnvelope<unknown>;
  summary?: { version: string | null; assetCount: number; recipeCount: number; integrityCount: number };
  children: ReactNode;
};

export function AppShell({ route, assetOrigin, demo, source, summary, children }: Props) {
  const navRoute = route.space === "capabilities" && route.page === "assets" && route.assetId && assetOrigin ? assetOrigin : route;
  const active = navRoute.space === "projects" ? "projects" : navRoute.space === "capabilities" ? navRoute.page === "assets" ? "assets" : "plans" : null;
  const destinations = [
    { id: "plans", label: "工作室", href: "#/capabilities", icon: PanelsTopLeft },
    { id: "assets", label: "资产库", href: "#/capabilities/assets", icon: Shapes },
    { id: "projects", label: "我的项目", href: "#/projects", icon: FolderOpen }
  ];
  return (
    <main className={demo ? "app-shell with-demo" : "app-shell"}>
      <aside className="workspace-sidebar" aria-label="NDT 工作空间">
        <a className="brand-lockup" href="#/capabilities" aria-label={ndtPack.productName}>
          <img className="brand-symbol" src="./brand-symbol.svg" alt="" />
          <span className="brand-wordmark"><strong>NERO</strong><small>DESIGN TEAM</small></span>
        </a>
        <nav className="space-nav" aria-label="主导航">
          {destinations.map(({ id, label, href, icon: Icon }) => (
            <a key={id} className={active === id ? "active" : ""} href={href} aria-current={active === id ? (assetOrigin ? "location" : "page") : undefined}>
              <Icon size={19} strokeWidth={1.6} aria-hidden="true" /><span>{label}</span>
              <ArrowUpRight className="nav-direction" size={14} aria-hidden="true" />
            </a>
          ))}
        </nav>
        <div className="sidebar-meta">
          {summary && <p className="catalog-count">{summary.assetCount} 资产 <span>·</span> {summary.recipeCount} 方案</p>}
          <details className="catalog-source">
            <summary><Info size={15} aria-hidden="true" /><span>目录信息</span>{!!summary?.integrityCount && <span className="source-issue">{summary.integrityCount} 项待核查</span>}</summary>
            <div className="catalog-popover">
              <p>NDT {summary?.version ?? "版本未知"}</p>
              {source ? <SourcePassport envelope={source} /> : <p>来源信息未载入。</p>}
            </div>
          </details>
          {source && <small className="source-state">{sourceStateLabel(source.state)}</small>}
        </div>
      </aside>
      <section className="workspace-frame">
        {demo && <div className="demo-banner" role="status">DEMO FIXTURE · 合成演示，不代表当前 NERO Design Team 状态</div>}
        <section className="workspace">{children}</section>
      </section>
    </main>
  );
}
