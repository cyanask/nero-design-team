import { Images } from "lucide-react";
import type { CapabilityAssetVM, CapabilityPreviewVariantVM } from "../../core/contracts";

type Props = {
  asset: CapabilityAssetVM;
  compact?: boolean;
  variant?: CapabilityPreviewVariantVM | null;
};

export function CapabilityPreview({ asset, compact = false, variant = null }: Props) {
  const preview = asset.preview;
  const resolvedUrl = variant?.url || (preview.state === "resolved" ? preview.url : null);
  const label = variant?.label || preview.label || asset.name;
  return (
    <div className={compact ? "capability-preview compact" : "capability-preview"}>
      {resolvedUrl ? (
        <img
          alt={label}
          className={
            variant
              ? "contain"
              : preview.fit === "contain"
                ? "contain"
                : "cover"
          }
          loading={compact ? "lazy" : "eager"}
          src={resolvedUrl}
        />
      ) : (
        <div className="preview-unavailable" aria-label="没有本地预览">
          <Images size={compact ? 22 : 28} strokeWidth={1.35} aria-hidden="true" />
          <span>{preview.state === "unresolved" ? "预览未打包" : "仅元数据"}</span>
        </div>
      )}
      <span className="preview-caption">
        {resolvedUrl
          ? variant
            ? "参考变体"
            : "资产预览"
          : "登记资料"}
      </span>
    </div>
  );
}
