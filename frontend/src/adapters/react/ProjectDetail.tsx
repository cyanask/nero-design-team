import type { ProjectDetailVM } from "../../core/contracts";
import { capabilityHash, projectHash } from "../../core/routes";
import {
  adoptionReceiptStateLabel,
  artifactDeclarationLabel,
  artifactReadinessLabel,
  projectRouteLabel,
  qaKindLabel,
  qaReportedStatusLabel,
  qaStateLabel
} from "../../packs/ndt/pack";

type Props = {
  detail: ProjectDetailVM | null;
  tab: "overview" | "artifacts" | "review";
};

export function ProjectDetail({ detail, tab }: Props) {
  if (!detail) {
    return (
      <section className="project-detail">
        <p>项目信息已登记，但当前版本暂时无法显示详情。</p>
      </section>
    );
  }

  return (
    <section className="project-detail">
      <header>
        <div>
          <span className="section-label">项目详情</span>
          <h2>{detail.name}</h2>
        </div>
      </header>
      <nav className="detail-tabs" aria-label="项目详情">
        {(["overview", "artifacts", "review"] as const).map((item) => (
          <a
            className={tab === item ? "active" : ""}
            href={projectHash(detail.id, item)}
            key={item}
            aria-current={tab === item ? "page" : undefined}
          >
            {{ overview: "项目概览", artifacts: "图稿文件", review: "检查记录" }[item]}
          </a>
        ))}
      </nav>

      {tab === "overview" ? (
        <div className="project-overview-panel">
          <dl className="project-overview">
            <div><dt>项目类型</dt><dd>{projectRouteLabel(detail.route)}</dd></div>
            <div>
              <dt>NDT 接入</dt>
              <dd>{detail.ndtIntegration.state === "declared" ? "项目已声明接入 NDT" : "项目未声明接入 NDT"}</dd>
            </div>
            <div><dt>具体资产声明</dt><dd>{detail.declaredAssetIds.length} 项</dd></div>
            <div>
              <dt>有效采用收据</dt>
              <dd>{detail.adoptionReceipts.filter((receipt) => receipt.state === "verified").length} 条</dd>
            </div>
            <div><dt>参考案例</dt><dd>{detail.caseReferences.length} 个</dd></div>
            <div><dt>图稿文件</dt><dd>已观察到 {detail.artifacts.length} 个</dd></div>
          </dl>
          <section className="project-capability-links" aria-label="项目声明的设计能力">
            <div>
              <h3>本项目声明的设计能力</h3>
              <p>以下记录来自项目 Manifest 中显式声明的 NDT Asset ID。</p>
            </div>
            {detail.declaredAssetIds.length ? (
              <div className="project-capability-link-list">
                {detail.declaredAssetIds.map((assetId) => (
                  <a href={capabilityHash(assetId)} key={assetId}>{assetId}</a>
                ))}
              </div>
            ) : (
              <strong>项目 Manifest 尚未声明稳定设计资产 ID。</strong>
            )}
          </section>
          <section className="project-adoption-receipts" aria-label="项目采用收据">
            <div>
              <h3>项目采用收据</h3>
              <p>收据必须经过已登记的校验器，才会计入“有效采用收据”。</p>
            </div>
            {detail.adoptionReceipts.length ? (
              <ul>
                {detail.adoptionReceipts.map((receipt, index) => (
                  <li data-state={receipt.state} key={[receipt.assetId, receipt.artifactId, receipt.source, index].join("-")}>
                    <div>
                      <a href={capabilityHash(receipt.assetId)}>{receipt.assetId}</a>
                      <strong>{adoptionReceiptStateLabel(receipt.state)}</strong>
                    </div>
                    <small>
                      {receipt.artifactId ? `产物：${receipt.artifactId}` : "产物未说明"}
                      {receipt.source ? ` · 来源：${receipt.source}` : " · 来源未登记或不在项目内"}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <strong>项目 Manifest 尚未声明采用收据。</strong>
            )}
          </section>
          <details className="project-technical-details">
            <summary>来源与技术信息</summary>
            <dl className="project-technical-grid">
              <div><dt>Project ID</dt><dd className="mono">{detail.id}</dd></div>
              <div><dt>Manifest schema</dt><dd>{detail.manifestVersion ?? "未说明"}</dd></div>
              <div><dt>Route</dt><dd>{detail.route ?? "未说明"}</dd></div>
              <div><dt>Template</dt><dd>{detail.template ?? "未说明"}</dd></div>
              <div><dt>Preset</dt><dd>{detail.preset ?? "未说明"}</dd></div>
              <div><dt>NDT integration role</dt><dd>{detail.ndtIntegration.role ?? "未声明"}</dd></div>
              <div><dt>NDT declared version</dt><dd>{detail.ndtIntegration.declaredVersion ?? "未声明"}</dd></div>
              <div>
                <dt>NDT Asset IDs</dt>
                <dd>{detail.declaredAssetIds.length ? detail.declaredAssetIds.join(" · ") : "未声明"}</dd>
              </div>
              <div>
                <dt>Case references</dt>
                <dd>{detail.caseReferences.length ? detail.caseReferences.join(" · ") : "未声明"}</dd>
              </div>
            </dl>
          </details>
        </div>
      ) : null}

      {tab === "artifacts" ? (
        detail.artifacts.length ? (
          <div className="artifact-panel">
            <div className="artifact-table-wrap">
              <table className="artifact-table">
                <thead>
                  <tr>
                    <th>文件</th>
                    <th>格式</th>
                    <th>大小</th>
                    <th>记录方式</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.artifacts.map((artifact) => (
                    <tr key={artifact.id}>
                      <td className="mono">{artifact.relativePath}</td>
                      <td>{artifact.mediaType ?? "未说明"}</td>
                      <td>{artifact.size == null ? "未说明" : Math.ceil(artifact.size / 1024) + " KB"}</td>
                      <td>{artifactDeclarationLabel(artifact.declaration)}</td>
                      <td>{artifactReadinessLabel(artifact.readiness)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="boundary-note">
              这里显示的是项目记录中的状态；只有带有效采用收据的图稿，才可视为正式采用。
            </p>
          </div>
        ) : (
          <div className="inline-empty">
            <strong>没有观察到图稿文件</strong>
            <p>这不代表项目尚未交付；当前只能确认没有可见的文件记录。</p>
          </div>
        )
      ) : null}

      {tab === "review" ? (
        <div className="review-list">
          {detail.qaEvidence.map((evidence, index) => (
            <article key={evidence.kind + index}>
              <div>
                <span className="section-label">{qaKindLabel(evidence.kind)}</span>
                <strong>{qaStateLabel(evidence.state)}</strong>
              </div>
              <p>{evidence.relativeSource ?? "未登记来源"}</p>
              <small>记录中的状态：{qaReportedStatusLabel(evidence.reportedStatus)}</small>
            </article>
          ))}
          <p className="boundary-note">
            这里只显示已经观察到的检查记录；有检查文件，不代表检查已经运行或通过。
          </p>
        </div>
      ) : null}
    </section>
  );
}
