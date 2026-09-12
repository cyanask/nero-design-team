import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { CapabilityAssetVM } from "../../core/contracts";
import { projectHash } from "../../core/routes";
import { referenceInstruction, capabilityTone, reuseStateLabel, maturityLabel } from "../../packs/ndt/pack";
import { CapabilityPreview } from "./CapabilityPreview";

export type AssetProjectUsage = {
  id: string;
  name: string;
  evidence: "manifest_declaration" | "verified_receipt";
};

type Props = {
  asset: CapabilityAssetVM | null;
  usageProjects?: AssetProjectUsage[];
};

function MetaList({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="inspector-block">
      <dt>{label}</dt>
      <dd className="tag-list">
        {values.map((value) => (
          <span key={value}>{value}</span>
        ))}
      </dd>
    </div>
  );
}

export function CapabilityInspector({ asset, usageProjects = [] }: Props) {
  const zoomRef = useRef<HTMLDialogElement>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const copyRequest = useRef(0);
  const [variantId, setVariantId] = useState<string | null>(null);

  useEffect(() => {
    setVariantId(asset?.preview.variants[0]?.id ?? null);
  }, [asset?.id, asset?.preview.variants]);

  useEffect(() => {
    copyRequest.current += 1;
    setCopyState("idle");
    return () => { copyRequest.current += 1; };
  }, [asset, variantId]);

  useEffect(() => {
    if (copyState !== "copied") return;
    const timer = window.setTimeout(() => setCopyState("idle"), 1600);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  if (!asset) {
    return (
      <aside className="asset-inspector inspector-empty">
        <span className="section-label">资产详情</span>
        <p>当前链接未匹配到设计资产。</p>
      </aside>
    );
  }

  const selectedVariant = asset.preview.variants.find((variant) => variant.id === variantId) ?? asset.preview.variants[0] ?? null;
  const referenceText = selectedVariant
    ? `${referenceInstruction(asset)}；参考变体：${selectedVariant.label}（${selectedVariant.id}）。用途：${selectedVariant.purpose}；使用边界：${selectedVariant.boundary}。该变体不是独立 Registry 资产 ID。`
    : referenceInstruction(asset);

  async function copyReference() {
    const request = ++copyRequest.current;
    setCopyState("idle");
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(referenceText);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = referenceText;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        try {
          textarea.select();
          if (!document.execCommand("copy")) throw new Error("Copy unavailable");
        } finally {
          textarea.remove();
        }
      }
      if (copyRequest.current === request) setCopyState("copied");
    } catch {
      if (copyRequest.current === request) setCopyState("failed");
    }
  }

  const tone = capabilityTone(asset);
  const previewUrl = selectedVariant?.url || (asset.preview.state === "resolved" ? asset.preview.url : null);
  return (
    <aside className="asset-inspector" aria-label="能力详情">
      <div className={`asset-inspector-body${previewUrl ? "" : " metadata-only"}`}>
        {previewUrl && <section className="studio-asset-preview" aria-label="资产视觉预览">
        <div className="studio-preview-stage"><CapabilityPreview asset={asset} variant={selectedVariant} /><button className="zoom-preview" type="button" onClick={() => zoomRef.current?.showModal()}>放大预览 ↗</button></div>
        {asset.preview.variants.length ? (
          <section className="style-variant-set" aria-label="视觉参考变体组">
            <div className="style-variant-heading">
              <span className="section-label">
                参考变体
              </span>
              <small>
                公开参考 · 非独立资产 ID
              </small>
            </div>
            <div className="style-variant-grid">
              {asset.preview.variants.map((variant) => (
                <button
                  className={variant.id === selectedVariant?.id ? "active" : ""}
                  key={variant.id}
                  onClick={() => setVariantId(variant.id)}
                  type="button"
                >
                  <img
                    alt=""
                    className="source-reference-thumb"
                    src={variant.url}
                  />
                  <span>{variant.label}</span>
                </button>
              ))}
            </div>
            {selectedVariant ? (
              <p className="style-variant-purpose">{selectedVariant.purpose}</p>
            ) : null}
          </section>
        ) : null}

        </section>}
        <section className="studio-asset-information" aria-label="资产使用信息">
        <div className="inspector-heading">
          <span className="section-label">{asset.id}</span>
          <span className={"status-dot " + tone} aria-hidden="true" />
        </div>
        <h1 data-asset-title>{asset.name}</h1>
        <p className="inspector-purpose">{asset.purpose || "用途未声明"}</p>
        <p className={"reuse-summary " + tone}>{reuseStateLabel(asset)} · {maturityLabel(asset)}</p>
        <dl className="inspector-meta" aria-label="使用条件">
          <MetaList label="适用场景" values={asset.useFor} />
          <div className="inspector-block"><dt>权利与使用条件</dt><dd>{asset.rights ?? "未声明"}</dd></div>
          <MetaList label="登记备注" values={asset.notes} />
          <MetaList label="待核查问题" values={asset.issueCodes} />
          {asset.preview.boundary && <div className="inspector-block"><dt>预览边界</dt><dd>{asset.preview.boundary}</dd></div>}
          {selectedVariant && <div className="inspector-block"><dt>参考变体边界</dt><dd>{selectedVariant.boundary}</dd></div>}
        </dl>

        <section className="reference-box" aria-label="可复制引用指令">
          <button className="copy-button" type="button" onClick={copyReference}>
            {copyState === "copied" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
            {copyState === "copied" ? "已复制" : "复制引用指令"}
          </button>
          <small>复制内容包含上方使用条件；登记状态不等于成品验收。</small>
          <p role="status">{copyState === "failed" ? "复制失败，请在下方选中完整指令手动复制。" : copyState === "copied" ? "完整引用指令已复制。" : ""}</p>
          <details open={copyState === "failed" || undefined}>
            <summary>查看完整指令</summary>
            <textarea aria-label="完整引用指令" readOnly value={referenceText} onFocus={(event) => event.target.select()} rows={8} />
          </details>
        </section>
        <details className="inspector-source">
          <summary>来源与登记信息</summary>
          <dl className="inspector-meta">
            <MetaList label="适用路线" values={asset.routes} />
            <div className="inspector-block"><dt>原始登记</dt><dd>{asset.rawStatus ?? "unknown"}</dd></div>
            <div className="inspector-block"><dt>资产类别</dt><dd>{asset.categoryId}</dd></div>
            <div className="inspector-block"><dt>资产键</dt><dd className="mono">{asset.key}</dd></div>
            <div className="inspector-block"><dt>来源引用</dt><dd className="mono source-ref">{asset.sourceRef ?? "未声明"}</dd></div>
            <MetaList label="成员" values={asset.members} />
          </dl>
        </details>
        <section className="adoption-evidence" aria-label="项目声明记录">
          <span>项目声明记录</span>
          <strong>
            {usageProjects.some((project) => project.evidence === "verified_receipt")
              ? `${usageProjects.filter((project) => project.evidence === "verified_receipt").length} 个项目存在已验证采用收据`
              : usageProjects.length
                ? `${usageProjects.length} 个项目在 Manifest 中显式声明`
              : "当前授权项目中未观察到显式声明"}
          </strong>
          {usageProjects.length ? (
            <div className="adoption-project-links">
              {usageProjects.map((project) => (
                <a href={projectHash(project.id)} key={project.id}>
                  {project.name} · {project.evidence === "verified_receipt" ? "收据已验证" : "Manifest 声明"}
                </a>
              ))}
            </div>
          ) : null}
          <p>
            Manifest 声明证明项目引用了该 NDT Asset ID，不等于图稿已经获得有效采用收据；
            Case reference 也不等于资产采用。
          </p>
        </section>
        </section>
      </div>
      {previewUrl && <dialog ref={zoomRef} className="asset-image-dialog" aria-label="放大预览" onClick={(event) => { if (event.target === event.currentTarget) zoomRef.current?.close(); }}>
        <button type="button" onClick={() => zoomRef.current?.close()}>关闭 ×</button>
        <img src={previewUrl} alt={selectedVariant?.label ?? asset.name} />
      </dialog>}
    </aside>
  );
}
