import { FileQuestion, FolderOpen, ShieldCheck } from "lucide-react";
import type { ProjectCatalogSnapshotVM, ReadEnvelope } from "../../core/contracts";
import { projectHash } from "../../core/routes";
import {
  authorityLabel,
  manifestStateLabel,
  projectRouteLabel,
  projectionLabel,
  sourceStateLabel
} from "../../packs/ndt/pack";
import { ProjectDetail } from "./ProjectDetail";

type Props = {
  envelope: ReadEnvelope<ProjectCatalogSnapshotVM>;
  requestedProjectId: string | null;
  tab: "overview" | "artifacts" | "review";
};

export function ProjectList({ envelope, requestedProjectId, tab }: Props) {
  const catalog = envelope.data;
  const index = catalog?.index;
  const requestedProject = requestedProjectId
    ? index?.projects.find((project) => project.id === requestedProjectId) ?? null
    : null;
  const selectedSummary = requestedProjectId
    ? requestedProject
    : index?.projects[0] ?? null;
  const detail = selectedSummary ? catalog?.detailsById[selectedSummary.id] ?? null : null;
  const projectCount = index?.projects.length ?? 0;
  const projectCountLabel =
    index?.discovery === "observed" || index?.discovery === "observed_empty"
      ? `${projectCount} 个已识别项目`
      : "项目数量待确认";

  return (
    <section className="projects-space" aria-label="我的项目与图稿">
      <header className="projects-head">
        <div>
          <p className="eyebrow">MY PROJECTS</p>
          <h1>我的项目与图稿</h1>
          <p>选择一个项目，查看图稿文件和检查记录。</p>
        </div>
        <div className="projects-summary" aria-label="项目概览">
          <span>{projectCountLabel}</span>
        </div>
      </header>

      <details className="projects-source-details">
        <summary>数据来源与更新时间</summary>
        <section className="projects-source-strip" aria-label="项目数据来源与更新时间">
          <div><span>数据权威</span><strong>{authorityLabel(envelope.state)}</strong></div>
          <div><span>数据形态</span><strong>{projectionLabel(envelope.state)}</strong></div>
          <div><span>观测时新鲜度</span><strong>{sourceStateLabel(envelope.state)}</strong></div>
          <div><span>更新时间</span><strong>{envelope.observedAt}</strong></div>
        </section>
      </details>

      {!index || index.discovery === "not_configured" ? (
        <section className="projects-empty">
          <FileQuestion size={28} aria-hidden="true" />
          <div>
            <span className="section-label">尚未连接</span>
            <h2>还没有已授权的项目</h2>
            <p>
              当前项目数量未知，不代表“0 个项目”。应用不会扫描您的电脑，只有您明确
              授权的项目才会显示在这里。
            </p>
          </div>
        </section>
      ) : index.discovery === "unavailable" ? (
        <section className="projects-empty error-state">
          <ShieldCheck size={28} aria-hidden="true" />
          <div>
            <span className="section-label">暂时不可用</span>
            <h2>暂时无法读取项目</h2>
            <p>这不代表项目为空。您可以展开“数据来源与更新时间”查看当前读取状态。</p>
          </div>
        </section>
      ) : index.discovery === "observed_empty" ? (
        <section className="projects-empty">
          <FolderOpen size={28} aria-hidden="true" />
          <div>
            <span className="section-label">未发现项目</span>
            <h2>没有发现可识别的项目</h2>
            <p>已授权位置可以读取，但其中没有符合当前项目识别规则的信息。</p>
          </div>
        </section>
      ) : requestedProjectId && !requestedProject ? (
        <section className="projects-empty error-state">
          <FileQuestion size={28} aria-hidden="true" />
          <div>
            <span className="section-label">PROJECT NOT FOUND</span>
            <h2>没有找到这个已授权项目</h2>
            <p>链接中的项目 ID 不在当前项目快照中。请从项目列表重新选择。</p>
          </div>
        </section>
      ) : (
        <section className="project-layout">
          <aside className="project-list" aria-label="项目列表">
            <span className="section-label">已授权项目</span>
            {index.projects.map((project) => (
              <a
                className={selectedSummary?.id === project.id ? "active" : ""}
                href={projectHash(project.id, tab)}
                key={project.id}
                aria-current={selectedSummary?.id === project.id ? "true" : undefined}
              >
                <strong>{project.name}</strong>
                <span>{projectRouteLabel(project.route)}</span>
                <small>{manifestStateLabel(project.manifestState)}</small>
              </a>
            ))}
          </aside>
          <ProjectDetail detail={detail} tab={tab} />
        </section>
      )}
    </section>
  );
}
