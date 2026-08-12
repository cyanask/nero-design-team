import { useEffect, useState, type CSSProperties } from "react";
import type { WorkbenchSnapshot } from "../core/contracts";
import { parseWorkbenchHash } from "../core/routes";
import { tokenCssVariables } from "../packs/ndt/pack";
import { ndtApplicationScenarioCatalog } from "../packs/ndt/application-scenarios";
import { AppShell } from "../adapters/react/AppShell";
import { CapabilitySpace } from "../adapters/react/CapabilitySpace";
import { ProjectList } from "../adapters/react/ProjectList";
import "../packs/ndt/pack.css";

type Props = {
  snapshot: WorkbenchSnapshot;
};

export function App({ snapshot }: Props) {
  const [route, setRoute] = useState(() => parseWorkbenchHash(window.location.hash));
  useEffect(() => {
    const onHashChange = () => setRoute(parseWorkbenchHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const scrollTarget = document.querySelector<HTMLElement>(
      ".scenario-browser, .projects-space, .asset-grid-scroll"
    );
    scrollTarget?.scrollTo({ top: 0, left: 0 });
    const heading = document.querySelector<HTMLElement>(".workspace h1");
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
      <AppShell route={route} demo={demo} summary={shellSummary}>
        {route.space === "invalid" ? (
          <section className="fatal-panel" role="alert">
            <p className="eyebrow">PAGE NOT FOUND</p>
            <h1>没有找到这个页面</h1>
            <p>当前链接不符合 NERO Design Team 的页面结构，请从设计能力或我的项目重新进入。</p>
          </section>
        ) : route.space === "capabilities" ? (
          <CapabilitySpace
            catalog={snapshot.catalog}
            projects={snapshot.projects}
            route={route}
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
