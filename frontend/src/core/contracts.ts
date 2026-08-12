export type IssueSeverity = "info" | "warning" | "error" | "blocked";

export type ReadIssue = {
  code: string;
  severity: IssueSeverity;
  message: string;
  sourceId?: string;
  subjectId?: string;
};

export type SourceState = {
  upstreamAuthority: "canonical" | "project_local" | "derived" | "reference" | "unknown";
  availability:
    | "observed_available"
    | "observed_missing"
    | "unreadable"
    | "malformed"
    | "not_checked";
  configuration: "configured" | "not_configured" | "not_applicable" | "unknown";
  runtime: "observed_live" | "observed_offline" | "not_observed" | "not_applicable";
  freshnessAtObservation:
    | "fingerprint_match_at_observation"
    | "version_match_at_observation"
    | "stale_at_observation"
    | "unknown";
  projection: "sanitized_snapshot" | "project_manifest_snapshot" | "demo_fixture";
};

export type ReadEnvelope<T> = {
  contractVersion: "workbench.read.v1";
  adapterVersion: string;
  observedAt: string;
  source: {
    id: string;
    sourceSchemaVersion: string | null;
    sourceVersion: string | null;
    fingerprint: string | null;
  };
  state: SourceState;
  data: T | null;
  issues: ReadIssue[];
};

export type CapabilityAssetVM = {
  id: string;
  key: string;
  categoryId: string;
  name: string;
  purpose: string;
  useFor: string[];
  routes: string[];
  knownRoutes: string[];
  rawStatus: string | null;
  rights: string | null;
  sourceRef: string | null;
  members: string[];
  notes: string[];
  preview: {
    state: "resolved" | "unresolved" | "not_declared";
    url: string | null;
    kind: string | null;
    label: string | null;
    boundary: string | null;
    fit: "cover" | "contain" | null;
    variants: CapabilityPreviewVariantVM[];
  };
  issueCodes: string[];
};

export type CapabilityPreviewVariantVM = {
  id: string;
  label: string;
  purpose: string;
  url: string;
  boundary: string;
};

export type CapabilityDomainRecordVM = {
  domain: string;
  sourceId: string;
  registryAssetId: string | null;
  label: string;
  sourceVersion: string | null;
  rawStatus: string | null;
  rights: string | null;
  facts: { key: string; value: string | number | boolean | null }[];
  issueCodes: string[];
};

export type CapabilityLibraryVM = {
  categories: { id: string; label: string; assetIds: string[] }[];
  recipes: { id: string; label: string; assetIds: string[] }[];
  assets: CapabilityAssetVM[];
  domainRecords: CapabilityDomainRecordVM[];
  integrityIssues: { id: string; severity: string; assetIds: string[] }[];
  unboundDomainRecords: { domain: string; sourceId: string; issueCode: string }[];
};

export type ProjectIndexVM = {
  discovery: "not_configured" | "observed_empty" | "observed" | "unavailable";
  projects: { id: string; name: string; route: string | null; manifestState: string }[];
};

export type ArtifactVM = {
  id: string;
  relativePath: string;
  mediaType: string | null;
  size: number | null;
  modifiedAt: string | null;
  declaration: "explicit_output" | "observed_file_candidate";
  explicitVersion: string | null;
  readiness: string | null;
};

export type QaEvidenceVM = {
  kind: "input_manifest" | "captured_run_result" | "narrative_qa_note" | "historical_validation";
  state: "not_declared" | "observed" | "broken_reference" | "stale" | "unknown";
  relativeSource: string | null;
  reportedStatus: string | null;
};

export type ProjectDetailVM = {
  id: string;
  name: string;
  manifestVersion: string | null;
  route: string | null;
  template: string | null;
  preset: string | null;
  ndtIntegration: {
    state: "declared" | "not_declared";
    role: string | null;
    declaredVersion: string | null;
  };
  declaredAssetIds: string[];
  adoptionReceipts: {
    assetId: string;
    artifactId: string | null;
    state: "declared_unverified" | "verified" | "invalid";
    source: string | null;
  }[];
  caseReferences: string[];
  artifacts: ArtifactVM[];
  qaEvidence: QaEvidenceVM[];
};

export type ProjectCatalogSnapshotVM = {
  index: ProjectIndexVM;
  detailsById: Record<string, ProjectDetailVM>;
};

export type WorkbenchSnapshot = {
  schemaVersion: "workbench.snapshot.v1";
  snapshotId: string;
  snapshotFingerprint: string;
  catalog: ReadEnvelope<CapabilityLibraryVM>;
  projects: ReadEnvelope<ProjectCatalogSnapshotVM>;
};

export interface CapabilityCatalogPort {
  read(): Promise<ReadEnvelope<CapabilityLibraryVM>>;
}

export interface ProjectCatalogPort {
  read(): Promise<ReadEnvelope<ProjectIndexVM>>;
  readProject(projectId: string): Promise<ReadEnvelope<ProjectDetailVM>>;
}
