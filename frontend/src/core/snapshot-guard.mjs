const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value) => typeof value === "string";
const nullableText = (value) => value === null || text(value);
const textArray = (value) => Array.isArray(value) && value.every(text);

function issue(path, message) {
  return {
    code: "UNSUPPORTED_SCHEMA",
    severity: "error",
    message: path + ": " + message,
    sourceId: "workbench.snapshot.v1"
  };
}

function exactKeys(value, allowed, path, issues) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) issues.push(issue(path + "." + key, "unknown field"));
  }
}

function validateIssue(value, path, issues) {
  if (!record(value)) {
    issues.push(issue(path, "expected issue object"));
    return;
  }
  exactKeys(value, ["code", "severity", "message", "sourceId", "subjectId"], path, issues);
  if (!text(value.code) || !text(value.severity) || !text(value.message)) {
    issues.push(issue(path, "invalid issue fields"));
  }
}

function validateState(value, path, issues) {
  if (!record(value)) {
    issues.push(issue(path, "expected source state"));
    return;
  }
  const keys = [
    "upstreamAuthority",
    "availability",
    "configuration",
    "runtime",
    "freshnessAtObservation",
    "projection"
  ];
  exactKeys(value, keys, path, issues);
  for (const key of keys) {
    if (!text(value[key])) issues.push(issue(path + "." + key, "expected string"));
  }
}

function validateAsset(value, path, issues) {
  if (!record(value)) {
    issues.push(issue(path, "expected asset"));
    return;
  }
  const keys = [
    "id",
    "key",
    "categoryId",
    "name",
    "purpose",
    "useFor",
    "routes",
    "knownRoutes",
    "rawStatus",
    "rights",
    "sourceRef",
    "members",
    "notes",
    "preview",
    "issueCodes"
  ];
  exactKeys(value, keys, path, issues);
  for (const key of ["id", "key", "categoryId", "name", "purpose"]) {
    if (!text(value[key])) issues.push(issue(path + "." + key, "expected string"));
  }
  for (const key of ["useFor", "routes", "knownRoutes", "members", "notes", "issueCodes"]) {
    if (!textArray(value[key])) issues.push(issue(path + "." + key, "expected string array"));
  }
  for (const key of ["rawStatus", "rights", "sourceRef"]) {
    if (!nullableText(value[key])) issues.push(issue(path + "." + key, "expected string or null"));
  }
  if (
    !record(value.preview) ||
    !text(value.preview.state) ||
    !nullableText(value.preview.url) ||
    !nullableText(value.preview.kind) ||
    !nullableText(value.preview.label) ||
    !nullableText(value.preview.boundary) ||
    !(value.preview.fit === null || value.preview.fit === "cover" || value.preview.fit === "contain") ||
    !Array.isArray(value.preview.variants)
  ) {
    issues.push(issue(path + ".preview", "invalid preview"));
  } else {
    exactKeys(value.preview, ["state", "url", "kind", "label", "boundary", "fit", "variants"], path + ".preview", issues);
    value.preview.variants.forEach((variant, index) => {
      const variantPath = path + ".preview.variants[" + index + "]";
      if (!record(variant)) {
        issues.push(issue(variantPath, "expected preview variant"));
        return;
      }
      exactKeys(variant, ["id", "label", "purpose", "url", "boundary"], variantPath, issues);
      for (const key of ["id", "label", "purpose", "url", "boundary"]) {
        if (!text(variant[key])) issues.push(issue(variantPath + "." + key, "expected string"));
      }
    });
  }
}

function validateLibrary(value, path, issues) {
  if (!record(value)) {
    issues.push(issue(path, "expected capability library"));
    return;
  }
  const keys = [
    "categories",
    "recipes",
    "assets",
    "domainRecords",
    "integrityIssues",
    "unboundDomainRecords"
  ];
  exactKeys(value, keys, path, issues);
  for (const key of keys) {
    if (!Array.isArray(value[key])) issues.push(issue(path + "." + key, "expected array"));
  }
  if (Array.isArray(value.assets)) {
    value.assets.forEach((asset, index) => validateAsset(asset, path + ".assets[" + index + "]", issues));
  }
}

function validateProjects(value, path, issues) {
  if (!record(value)) {
    issues.push(issue(path, "expected project catalog"));
    return;
  }
  exactKeys(value, ["index", "detailsById"], path, issues);
  if (!record(value.index) || !record(value.detailsById)) {
    issues.push(issue(path, "invalid project catalog fields"));
    return;
  }
  exactKeys(value.index, ["discovery", "projects"], path + ".index", issues);
  if (!text(value.index.discovery) || !Array.isArray(value.index.projects)) {
    issues.push(issue(path + ".index", "invalid project index"));
  }
  if (Array.isArray(value.index.projects)) {
    value.index.projects.forEach((project, index) => validateProjectSummary(project, path + ".index.projects[" + index + "]", issues));
  }
  for (const [projectId, detail] of Object.entries(value.detailsById)) {
    validateProjectDetail(detail, path + ".detailsById." + projectId, issues);
  }
}

function validateProjectSummary(value, path, issues) {
  if (!record(value)) {
    issues.push(issue(path, "expected project summary"));
    return;
  }
  exactKeys(value, ["id", "name", "route", "manifestState"], path, issues);
  if (!text(value.id) || !text(value.name) || !nullableText(value.route) || !text(value.manifestState)) {
    issues.push(issue(path, "invalid project summary fields"));
  }
}

function validateProjectDetail(value, path, issues) {
  if (!record(value)) {
    issues.push(issue(path, "expected project detail"));
    return;
  }
  exactKeys(
    value,
    [
      "id",
      "name",
      "manifestVersion",
      "route",
      "template",
      "preset",
      "ndtIntegration",
      "declaredAssetIds",
      "adoptionReceipts",
      "caseReferences",
      "artifacts",
      "qaEvidence"
    ],
    path,
    issues
  );
  for (const key of ["id", "name"]) {
    if (!text(value[key])) issues.push(issue(path + "." + key, "expected string"));
  }
  for (const key of ["manifestVersion", "route", "template", "preset"]) {
    if (!nullableText(value[key])) issues.push(issue(path + "." + key, "expected string or null"));
  }
  if (!record(value.ndtIntegration)) {
    issues.push(issue(path + ".ndtIntegration", "expected object"));
  } else {
    exactKeys(value.ndtIntegration, ["state", "role", "declaredVersion"], path + ".ndtIntegration", issues);
    if (!["declared", "not_declared"].includes(value.ndtIntegration.state)) {
      issues.push(issue(path + ".ndtIntegration.state", "invalid state"));
    }
    for (const key of ["role", "declaredVersion"]) {
      if (!nullableText(value.ndtIntegration[key])) {
        issues.push(issue(path + ".ndtIntegration." + key, "expected string or null"));
      }
    }
  }
  for (const key of ["declaredAssetIds", "caseReferences"]) {
    if (!textArray(value[key])) issues.push(issue(path + "." + key, "expected string array"));
  }
  if (!Array.isArray(value.adoptionReceipts)) {
    issues.push(issue(path + ".adoptionReceipts", "expected array"));
  } else {
    value.adoptionReceipts.forEach((receipt, index) => {
      const receiptPath = path + ".adoptionReceipts[" + index + "]";
      if (!record(receipt)) {
        issues.push(issue(receiptPath, "expected object"));
        return;
      }
      exactKeys(receipt, ["assetId", "artifactId", "state", "source"], receiptPath, issues);
      if (!text(receipt.assetId) || !nullableText(receipt.artifactId) || !nullableText(receipt.source)) {
        issues.push(issue(receiptPath, "invalid receipt fields"));
      }
      if (!["declared_unverified", "verified", "invalid"].includes(receipt.state)) {
        issues.push(issue(receiptPath + ".state", "invalid receipt state"));
      }
    });
  }
  if (!Array.isArray(value.artifacts)) issues.push(issue(path + ".artifacts", "expected array"));
  if (!Array.isArray(value.qaEvidence)) issues.push(issue(path + ".qaEvidence", "expected array"));
}

function validateEnvelope(value, path, dataValidator, issues) {
  if (!record(value)) {
    issues.push(issue(path, "expected envelope"));
    return;
  }
  const keys = ["contractVersion", "adapterVersion", "observedAt", "source", "state", "data", "issues"];
  exactKeys(value, keys, path, issues);
  if (value.contractVersion !== "workbench.read.v1") {
    issues.push(issue(path + ".contractVersion", "unsupported contract"));
  }
  if (!text(value.adapterVersion) || !text(value.observedAt)) {
    issues.push(issue(path, "invalid adapter metadata"));
  }
  if (!record(value.source)) {
    issues.push(issue(path + ".source", "expected source"));
  } else {
    exactKeys(
      value.source,
      ["id", "sourceSchemaVersion", "sourceVersion", "fingerprint"],
      path + ".source",
      issues
    );
    if (
      !text(value.source.id) ||
      !nullableText(value.source.sourceSchemaVersion) ||
      !nullableText(value.source.sourceVersion) ||
      !nullableText(value.source.fingerprint)
    ) {
      issues.push(issue(path + ".source", "invalid source fields"));
    }
  }
  validateState(value.state, path + ".state", issues);
  if (!Array.isArray(value.issues)) {
    issues.push(issue(path + ".issues", "expected issue array"));
  } else {
    value.issues.forEach((item, index) => validateIssue(item, path + ".issues[" + index + "]", issues));
  }
  if (value.data !== null) dataValidator(value.data, path + ".data", issues);
}

export function validateWorkbenchSnapshot(value) {
  const issues = [];
  if (!record(value)) return [issue("$", "expected snapshot object")];
  exactKeys(
    value,
    ["schemaVersion", "snapshotId", "snapshotFingerprint", "catalog", "projects"],
    "$",
    issues
  );
  if (value.schemaVersion !== "workbench.snapshot.v1") {
    issues.push(issue("$.schemaVersion", "unsupported schema"));
  }
  if (!text(value.snapshotId) || !text(value.snapshotFingerprint)) {
    issues.push(issue("$", "invalid snapshot identity"));
  }
  validateEnvelope(value.catalog, "$.catalog", validateLibrary, issues);
  validateEnvelope(value.projects, "$.projects", validateProjects, issues);
  return issues;
}
