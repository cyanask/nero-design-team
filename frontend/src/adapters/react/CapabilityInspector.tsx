import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { CapabilityAssetVM } from "../../core/contracts";
import { projectHash } from "../../core/routes";
import { referenceInstruction, statusTone } from "../../packs/ndt/pack";
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
  const [copied, setCopied] = useState(false);
  const [variantId, setVariantId] = useState<string | null>(null);

  useEffect(() => {
    setVariantId(asset?.preview.variants[0]?.id ?? null);
  }, [asset?.id]);

  if (!asset) {
    return (
      <aside className="asset-inspector inspector-empty">
        <span className="section-label">INSPECTOR</span>
        <p>当前链接未匹配到设计资产。</p>
      </aside>
    );
  }

  const selectedVariant = asset.preview.variants.find((variant) => variant.id === variantId) ?? null;
  const referenceText = selectedVariant
    ? `${referenceInstruction(asset)}；参考变体：${selectedVariant.label}（${selectedVariant.id}）。该变体不是独立 Registry 资产 ID。`
    : referenceInstruction(asset);

  async function copyReference() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(referenceText);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = referenceText;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const tone = statusTone(asset.rawStatus, asset.issueCodes);
  return (
    <aside className="asset-inspector" aria-label="能力详情">
      <CapabilityPreview asset={asset} variant={selectedVariant} />
      <div className="asset-inspector-body">
        <div className="inspector-heading">
          <span className="section-label">{asset.id}</span>
          <span className={"status-dot " + tone} aria-hidden="true" />
        </div>
        <h2>{asset.name}</h2>
        <p className="asset-category">{asset.categoryId}</p>

        {asset.preview.variants.length ? (
          <section className="style-variant-set" aria-label="视觉参考变体组">
            <div className="style-variant-heading">
              <span className="section-label">
                REFERENCE VARIANTS
              </span>
              <small>
                PUBLIC METADATA · 非独立资产 ID
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

        <section className="reference-box" aria-label="可复制引用指令">
          <span className="section-label">REFERENCE INSTRUCTION</span>
          <p>{referenceText}</p>
          <button className="copy-button" type="button" onClick={copyReference}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "已复制" : "复制引用指令"}
          </button>
          <small>这是调用该资产的引用指令，不等于生成视觉时使用的原始 Prompt。</small>
        </section>

        <dl className="inspector-meta">
          <div className="inspector-block">
            <dt>复用用途</dt>
            <dd>{asset.purpose || "未声明"}</dd>
            {asset.useFor.map((item) => (
              <dd className="secondary-use" key={item}>→ {item}</dd>
            ))}
          </div>
          <MetaList label="适用路线" values={asset.routes} />
          <div className="inspector-block split-row">
            <dt>状态</dt>
            <dd>{asset.rawStatus ?? "unknown"}</dd>
          </div>
          <div className="inspector-block split-row">
            <dt>Rights</dt>
            <dd>{asset.rights ?? "未声明"}</dd>
          </div>
          <div className="inspector-block split-row">
            <dt>Asset key</dt>
            <dd className="mono">{asset.key}</dd>
          </div>
          <div className="inspector-block">
            <dt>Source ref</dt>
            <dd className="mono source-ref">{asset.sourceRef ?? "未声明"}</dd>
          </div>
          {asset.preview.boundary ? (
            <div className="inspector-block">
              <dt>预览边界</dt>
              <dd>{asset.preview.boundary}</dd>
            </div>
          ) : null}
          {selectedVariant ? (
            <div className="inspector-block">
              <dt>参考变体边界</dt>
              <dd>{selectedVariant.boundary}</dd>
            </div>
          ) : null}
          <MetaList label="成员" values={asset.members} />
          <MetaList label="备注" values={asset.notes} />
          <MetaList label="完整性问题" values={asset.issueCodes} />
        </dl>
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
      </div>
    </aside>
  );
}
