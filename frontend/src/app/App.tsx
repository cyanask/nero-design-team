import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { WorkbenchSnapshot } from "../core/contracts";
import { parseWorkbenchHash } from "../core/routes";
import { tokenCssVariables, studioFeatures } from "../packs/ndt/pack";
import { ndtApplicationScenarioCatalog } from "../packs/ndt/application-scenarios";
import { AppShell } from "../adapters/react/AppShell";
import { CapabilitySpace } from "../adapters/react/CapabilitySpace";
import { ProjectList } from "../adapters/react/ProjectList";
import "../packs/ndt/pack.css";

type Props = {
  snapshot: WorkbenchSnapshot;
};

function savedAssetContext(hash: string): { hash: string; originHash: string | null } | null {
  const saved = window.history.state?.ndtAssetContext;
  if (saved?.hash !== hash) return null;
  if (saved.originHash === null || (typeof saved.originHash === "string" && parseWorkbenchHash(saved.originHash).space !== "invalid")) return saved;
  return null;
}

export function App({ snapshot }: Props) {
  const [navigation, setNavigation] = useState(() => {
    const hash = window.location.hash || "#/capabilities";
    return { hash, originHash: savedAssetContext(hash)?.originHash ?? null };
  });
  const navigationRef = useRef(navigation);
  const route = useMemo(() => parseWorkbenchHash(navigation.hash), [navigation.hash]);
  const assetOrigin = useMemo(() => navigation.originHash ? parseWorkbenchHash(navigation.originHash) : null, [navigation.originHash]);
  useEffect(() => {
    window.history.replaceState({ ...window.history.state, ndtAssetContext: navigationRef.current }, "");
    const onHashChange = () => {
      const hash = window.location.hash || "#/capabilities";
      const current = navigationRef.current;
      const previous = parseWorkbenchHash(current.hash);
      const next = parseWorkbenchHash(hash);
      const detail = next.space === "capabilities" && next.page === "assets" && next.assetId !== null;
      const wasDetail = previous.space === "capabilities" && previous.page === "assets" && previous.assetId !== null;
      const saved = savedAssetContext(hash);
      const originHash = detail ? (saved ? saved.originHash : wasDetail ? current.originHash : current.hash) : null;
      const value = { hash, originHash };
      navigationRef.current = value;
      window.history.replaceState({ ...window.history.state, ndtAssetContext: value }, "");
      setNavigation(value);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const assetDetail = route.space === "capabilities" && route.page === "assets";
    const projectDetail = route.space === "projects" && !!route.projectId;
    const scrollTarget = document.querySelector<HTMLElement>(assetDetail
      ? ".asset-inspector"
      : projectDetail ? ".project-detail" : ".scenario-browser, .projects-space");
    if (!assetDetail || route.assetId) scrollTarget?.scrollTo({ top: 0, left: 0 });
    const visibleHeading = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)]
      .find((element) => element.getClientRects().length > 0);
    const heading = (assetDetail && route.assetId ? visibleHeading("[data-asset-title]") : projectDetail ? visibleHeading(".project-detail h2") : undefined)
      ?? visibleHeading(".workspace h1");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }, [route]);

  const library = snapshot.catalog.data;
  const style = (library ? tokenCssVariables(library) : {}) as CSSProperties;
  const demo = snapshot.catalog.state.projection === "demo_fixture";
  const shellSummary = {
    version: snapshot.catalog.source.sourceVersion,
    assetCount: library?.assets.length ?? 0,
    recipeCount: library?.recipes.length ?? 0,
    integrityCount: library?.integrityIssues.length ?? 0
  };

  return (
    <div style={style}>
      <AppShell route={route} assetOrigin={assetOrigin} demo={demo} summary={shellSummary} source={snapshot.catalog}>
        {route.space === "invalid" ? (
          <section className="fatal-panel" role="alert">
            <p className="eyebrow">PAGE NOT FOUND</p>
            <h1>没有找到这个页面</h1>
            <p>当前链接不符合 NERO Design Team 的页面结构，请从工作室、资产库或我的项目重新进入。</p>
          </section>
        ) : route.space === "capabilities" ? (
          <CapabilitySpace
            catalog={snapshot.catalog}
            projects={snapshot.projects}
            route={route}
            assetOrigin={assetOrigin}
            studioSelection={studioFeatures}
            scenarioCatalog={ndtApplicationScenarioCatalog}
          />
        ) : (
          <ProjectList
            envelope={snapshot.projects}
            requestedProjectId={route.projectId}
            tab={route.tab}
          />
        )}
      </AppShell>
    </div>
  );
}

export function InvalidSnapshot({ messages }: { messages: string[] }) {
  return (
    <main className="fatal-screen">
      <section className="fatal-panel" role="alert">
        <p className="eyebrow">SOURCE INVALID</p>
        <h1>无法读取 Workbench 快照</h1>
        <p>正式入口不会静默回退到 demo。请重新运行 snapshot:check / snapshot:sync。</p>
        <ul>
          {messages.slice(0, 6).map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
