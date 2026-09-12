import { effectiveReuseState, hasUnresolvedReuseIssue } from "../../core/compose";
import type {
  ArtifactVM,
  CapabilityAssetVM,
  CapabilityLibraryVM,
  ProjectDetailVM,
  QaEvidenceVM,
  SourceState
} from "../../core/contracts";

export function adoptionReceiptStateLabel(
  state: ProjectDetailVM["adoptionReceipts"][number]["state"]
): string {
  return {
    declared_unverified: "项目已声明，尚未验证",
    verified: "已通过有效性验证",
    invalid: "记录无效"
  }[state];
}

export const ndtPack = {
  productName: "NERO Design Team",
  productShortName: "NERO",
  spaces: {
    capabilities: "设计能力",
    projects: "我的项目"
  },
  categoryAll: "全部能力",
  recipeAll: "全部任务组合"
} as const;

export function projectRouteLabel(route: string | null): string {
  if (!route) return "项目类型未说明";
  const labels: Record<string, string> = {
    "frontend-ui": "界面与工作台",
    "image-report": "报告图与长图",
    ppt: "演示文稿"
  };
  return labels[route] ?? "其他设计项目";
}

export function manifestStateLabel(state: string): string {
  const labels: Record<string, string> = {
    observed: "信息已读取",
    unsupported_schema: "信息格式暂不支持",
    malformed: "项目信息有误",
    unreadable: "项目信息暂不可读"
  };
  return labels[state] ?? "读取状态未知";
}

export function artifactDeclarationLabel(declaration: ArtifactVM["declaration"]): string {
  return {
    explicit_output: "项目已登记",
    observed_file_candidate: "系统已观察"
  }[declaration];
}

export function artifactReadinessLabel(readiness: string | null): string {
  if (!readiness) return "状态未说明";
  const labels: Record<string, string> = {
    candidate: "候选图稿（尚未采用）",
    ready: "项目记录为可供查看",
    adopted: "项目记录为已采用",
    approved: "项目记录为已确认",
    blocked: "项目记录为暂不可用"
  };
  return labels[readiness.toLowerCase()] ?? "已有状态记录";
}

export function qaKindLabel(kind: QaEvidenceVM["kind"]): string {
  return {
    input_manifest: "检查要求",
    captured_run_result: "检查结果",
    narrative_qa_note: "检查说明",
    historical_validation: "历史检查记录"
  }[kind];
}

export function qaStateLabel(state: QaEvidenceVM["state"]): string {
  return {
    not_declared: "未登记",
    observed: "已观察到记录",
    broken_reference: "来源不可用",
    stale: "记录可能已过期",
    unknown: "状态未知"
  }[state];
}

export function qaReportedStatusLabel(status: string | null): string {
  if (!status) return "未说明";
  const labels: Record<string, string> = {
    pass: "记录为通过",
    passed: "记录为通过",
    fail: "记录为未通过",
    failed: "记录为未通过",
    warning: "记录有提醒",
    blocked: "记录为受阻"
  };
  return labels[status.toLowerCase()] ?? "已有状态说明";
}

export function tokenCssVariables(library: CapabilityLibraryVM): Record<string, string> {
  const variables: Record<string, string> = {};
  for (const record of library.domainRecords) {
    if (record.domain !== "tokens") continue;
    for (const fact of record.facts) {
      if (!fact.key.startsWith("/") || typeof fact.value !== "string") continue;
      const name = fact.key
        .slice(1)
        .replaceAll("/", "-")
        .replaceAll("~1", "-")
        .replaceAll("~0", "~");
      if (name && name !== "digest" && name !== "combinedDigest") {
        variables["--ndt-" + name] = fact.value;
      }
    }
  }
  return variables;
}

export const reuseStateLabels = {
  reusable: "登记可复用", conditional: "按条件复用", reference_only: "仅供参考",
  placeholder: "占位资产", quarantined: "已隔离", unknown: "复用状态未知"
} as const;

export function reuseStateLabel(asset: CapabilityAssetVM): string {
  return reuseStateLabels[effectiveReuseState(asset)];
}

export function maturityLabel(asset: CapabilityAssetVM): string {
  return { registered: "已登记", reference: "工作参考", candidate: "候选", unknown: "成熟度未知" }[asset.maturity ?? "unknown"];
}

export function capabilityTone(asset: CapabilityAssetVM): string {
  if (hasUnresolvedReuseIssue(asset) || effectiveReuseState(asset) === "quarantined") return "warning";
  return effectiveReuseState(asset) === "reusable" && asset.maturity === "registered" ? "positive" : "neutral";
}

export function sourceStateLabel(state: SourceState): string {
  const freshness = {
    fingerprint_match_at_observation: "观测时指纹一致",
    version_match_at_observation: "观测时版本一致",
    stale_at_observation: "观测时已漂移",
    unknown: "新鲜度未知"
  }[state.freshnessAtObservation];
  return freshness;
}

export function projectionLabel(state: SourceState): string {
  return {
    sanitized_snapshot: "净化快照",
    project_manifest_snapshot: "项目 Manifest 快照",
    demo_fixture: "合成演示数据"
  }[state.projection];
}

export function authorityLabel(state: SourceState): string {
  return {
    canonical: "上游 canonical",
    project_local: "项目本地真源",
    derived: "上游派生",
    reference: "参考数据",
    unknown: "权威性未知"
  }[state.upstreamAuthority];
}

export function referenceInstruction(asset: CapabilityAssetVM): string {
  const routes = asset.routes.join(" / ") || "未声明";
  const state = effectiveReuseState(asset);
  const action = {
    reusable: "请引用 NDT 设计资产",
    conditional: "请在核对并满足以下条件后引用 NDT 设计资产",
    reference_only: "请仅将以下 NDT 设计资产作为参考，不直接复用",
    placeholder: "请核查以下 NDT 占位资产，尚不可作为成品复用",
    quarantined: "请核查已隔离、不可复用的 NDT 设计资产",
    unknown: "请先核查以下 NDT 设计资产的复用资格，确认前不复用"
  }[state];
  const conditions = [
    asset.purpose && `用途：${asset.purpose}`,
    asset.useFor.length && `适用场景：${asset.useFor.join("；")}`,
    asset.rights && `权利与使用条件：${asset.rights}`,
    asset.notes.length && `登记备注：${asset.notes.join("；")}`,
    asset.preview.boundary && `预览边界：${asset.preview.boundary}`,
    asset.issueCodes.length && `待核查问题：${asset.issueCodes.join("、")}`
  ].filter(Boolean).join("；") || "使用边界：按资产登记边界复核";
  return `${action} ${asset.id}（${asset.name}）。${conditions}；适用路由：${routes}；资产键：${asset.key}；复用状态：${reuseStateLabel(asset)}；成熟度：${maturityLabel(asset)}；登记状态不等于成品验收。`;
}


export const studioFeatures = [
  { assetId: "NDT-STY-003", caption: "大留白、单色锚点与纸媒质感。" },
  { assetId: "NDT-STY-004", caption: "清晰的证据结构，克制的商业表达。" },
  { assetId: "NDT-STY-006", caption: "在照片与抽象之间，保留决定性关系。" }
] as const;
