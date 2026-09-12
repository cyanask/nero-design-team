import {
  asNullableText,
  asText,
  asTextList,
  domainRecord,
  findRegistryAsset,
  flattenFacts,
  isRecord,
  path,
  readPackageJson,
  safeFact,
  safeRelative,
  sha256,
  stableStringify,
  tokenFiles
} from "./shared.mjs";

async function projectTokens(root, assets) {
  const records = [];
  for (const file of tokenFiles) {
    const sourceId = "tokens/" + file;
    const { data } = await readPackageJson(root, sourceId);
    const registryAsset = findRegistryAsset(assets, sourceId, "tokens");
    records.push(
      domainRecord({
        domain: "tokens",
        sourceId,
        label: file.replace(".json", ""),
        facts: [
          ...flattenFacts(data),
          { key: "/digest", value: sha256(stableStringify(data)) }
        ],
        registryAsset,
        issueCodes: registryAsset ? [] : ["UNBOUND_DOMAIN_RECORD"]
      })
    );
  }
  const digest = sha256(records.map((record) => record.facts.at(-1)?.value || "").join(":"));
  records.push(
    domainRecord({
      domain: "tokens",
      sourceId: "tokens",
      label: "token-set",
      facts: [{ key: "/combinedDigest", value: digest }],
      registryAsset: findRegistryAsset(assets, "tokens", "tokens"),
      issueCodes: []
    })
  );
  return records;
}

async function projectBrand(root, assets, integrityIssues) {
  const profileSource = "brand/brand-profile.json";
  const layoutSource = "brand/master-layouts.json";
  const profile = (await readPackageJson(root, profileSource)).data;
  const layouts = (await readPackageJson(root, layoutSource)).data;
  const brandIssueCodes = integrityIssues
    .filter((item) => item.status === "open")
    .map((item) => item.id);
  return [
    domainRecord({
      domain: "brand",
      sourceId: profileSource,
      label: asText(profile.name, "brand-profile"),
      sourceVersion: asNullableText(profile.version),
      rawStatus: brandIssueCodes.length ? "quarantined_partial" : "observed",
      rights: "placeholder-assets",
      facts: flattenFacts({
        positioning: profile.positioning,
        tone: profile.tone,
        voice: profile.voice,
        design_tokens: profile.design_tokens,
        wordmark: "placeholder",
        mark: brandIssueCodes.length ? "quarantined" : "placeholder"
      }),
      registryAsset: findRegistryAsset(assets, profileSource, "brand"),
      issueCodes: brandIssueCodes
    }),
    domainRecord({
      domain: "brand",
      sourceId: layoutSource,
      label: "master-layouts",
      sourceVersion: asNullableText(layouts.version),
      rawStatus: "observed",
      rights: null,
      facts: flattenFacts(layouts),
      registryAsset: findRegistryAsset(assets, layoutSource, "brand"),
      issueCodes: []
    })
  ];
}

export async function projectTemplates(root, assets) {
  const sourceId = "generators/templates.json";
  const registry = (await readPackageJson(root, sourceId)).data;
  const records = [];
  for (const [route, config] of Object.entries(registry.routes || {})) {
    const template = asText(config?.template);
    const registryAsset =
      assets.find(
        (asset) =>
          asset.category === "templates" &&
          typeof asset.source_ref === "string" &&
          template &&
          asset.source_ref.includes(template)
      ) || findRegistryAsset(assets, sourceId, "templates");
    records.push(
      domainRecord({
        domain: "templates",
        sourceId: sourceId + "#/routes/" + route,
        label: route,
        sourceVersion: asNullableText(registry.version),
        rawStatus: "registered",
        facts: flattenFacts({
          template,
          default_name: config?.default_name,
          description: config?.description,
          presets: config?.presets ? Object.keys(config.presets).join(", ") : null
        }),
        registryAsset,
        issueCodes: registryAsset ? [] : ["UNBOUND_DOMAIN_RECORD"]
      })
    );
  }
  return { records, routes: Object.keys(registry.routes || {}) };
}

async function projectCases(root, assets) {
  const records = [];
  const rootIndex = (await readPackageJson(root, "case-library/index.json")).data;
  for (const [route, reference] of Object.entries(rootIndex.case_indexes || {})) {
    if (typeof reference !== "string" || route === "snapshots") continue;
    const loaded = await readPackageJson(root, reference);
    const items = Array.isArray(loaded.data.cases)
      ? loaded.data.cases
      : Array.isArray(loaded.data.candidates)
        ? loaded.data.candidates
        : [];
    for (const item of items) {
      if (!isRecord(item)) continue;
      const itemId = asText(item.id, asText(item.name, "unnamed"));
      const sourceId = loaded.relative + "#" + itemId;
      const registryAsset = findRegistryAsset(assets, sourceId, "cases");
      records.push(
        domainRecord({
          domain: "cases",
          sourceId,
          label: asText(item.name, itemId),
          sourceVersion: asNullableText(loaded.data.version),
          rawStatus: asText(item.score?.rating, asText(item.status)) || null,
          rights: asNullableText(item.license_status),
          facts: flattenFacts({
            route,
            purpose: item.purpose,
            style: item.style,
            tokens: item.tokens,
            template: item.template,
            score: item.score,
            applies_to: item.applies_to,
            disabled_when: item.disabled_when,
            notes: item.notes
          }),
          registryAsset,
          issueCodes: registryAsset ? [] : ["UNBOUND_DOMAIN_RECORD"]
        })
      );
    }
  }

  const snapshots = (await readPackageJson(root, "case-library/snapshots/index.json")).data;
  for (const item of snapshots.snapshots || []) {
    if (!isRecord(item)) continue;
    const snapshotRef =
      typeof item.snapshot_path === "string"
        ? safeRelative(root, item.snapshot_path)
        : "case-library/snapshots";
    const sourceId = snapshotRef + "#" + asText(item.repo, "snapshot");
    const registryAsset = findRegistryAsset(assets, sourceId, "case-snapshots");
    records.push(
      domainRecord({
        domain: "cases",
        sourceId,
        label: asText(item.repo, "snapshot"),
        sourceVersion: null,
        rawStatus: asNullableText(item.status),
        rights: asNullableText(item.license_status),
        facts: flattenFacts({
          repo: item.repo,
          route: item.route,
          source_url: item.source_url,
          updated_at: item.updated_at
        }),
        registryAsset,
        issueCodes: registryAsset ? [] : ["UNBOUND_DOMAIN_RECORD"]
      })
    );
  }
  return records;
}

async function projectStyles(root, assets) {
  const index = (await readPackageJson(root, "assets/style-references/index.json")).data;
  const records = [];
  for (const item of index.style_reference_packs || []) {
    if (!isRecord(item) || typeof item.path !== "string") continue;
    const loaded = await readPackageJson(root, item.path);
    const manifest = loaded.data;
    const sourceId = loaded.relative;
    const registryAsset =
      findRegistryAsset(assets, sourceId, "style-packs") ||
      assets.find((asset) => asset.category === "style-packs" && asset.key === item.id) ||
      null;
    const sourceSummary = isRecord(manifest.source)
      ? Object.fromEntries(
          Object.entries(manifest.source).filter(([, value]) => safeFact(value) !== null)
        )
      : null;
    records.push(
      domainRecord({
        domain: "styles",
        sourceId,
        label: asText(item.name, asText(item.id, "style")),
        sourceVersion: asNullableText(manifest.version),
        rawStatus: asNullableText(item.status),
        rights: asNullableText(item.rights_status),
        facts: flattenFacts({
          route: manifest.route,
          secondary_routes: manifest.secondary_routes,
          formats: isRecord(manifest.formats) ? Object.keys(manifest.formats) : null,
          token_references: manifest.token_references,
          source: sourceSummary,
          asset_boundary: manifest.asset_boundary,
          layout_contract_present: manifest.layout_contract != null
        }),
        registryAsset,
        issueCodes: registryAsset ? [] : ["UNBOUND_DOMAIN_RECORD"]
      })
    );
  }
  return records;
}

function projectPreview(preview) {
  if (!isRecord(preview)) return null;
  const fit = preview.fit === "contain" || preview.fit === "cover" ? preview.fit : null;
  const sourceRef = asNullableText(preview.source_ref);
  const bundled = sourceRef?.match(/^assets\/library-previews\/([a-z0-9-]+\.png)$/i);
  return {
    state: bundled ? "resolved" : "unresolved",
    url: bundled ? `./library-previews/${bundled[1]}` : null,
    kind: asNullableText(preview.kind),
    label: asNullableText(preview.label),
    boundary: asNullableText(preview.boundary),
    fit: fit ?? (bundled ? "contain" : null),
    variants: []
  };
}

export function projectAssets(
  registry,
  knownRoutes
) {
  const issues = registry.integrity_issues || [];
  const assets = (registry.assets || []).map((asset) => {
    const issueCodes = issues
      .filter((item) => item.source_ref && item.source_ref === asset.source_ref)
      .map((item) => item.id);
    return {
      id: asText(asset.id),
      key: asText(asset.key),
      categoryId: asText(asset.category),
      name: asText(asset.name, asText(asset.id)),
      purpose: asText(asset.purpose),
      useFor: asTextList(asset.use_for),
      routes: asTextList(asset.routes),
      knownRoutes: asTextList(asset.routes).filter((route) => knownRoutes.includes(route)),
      rawStatus: asNullableText(asset.status),
      aliases: asTextList(asset.aliases),
      maturity: asText(asset.maturity, "unknown"),
      reuseState: asText(asset.reuse_state, "unknown"),
      rights: asNullableText(asset.rights),
      sourceRef: asNullableText(asset.source_ref),
      members: asTextList(asset.members),
      notes: asTextList(asset.notes),
      preview: projectPreview(asset.preview) || {
        state: "not_declared",
        url: null,
        kind: null,
        label: null,
        boundary: null,
        fit: null,
        variants: []
      },
      issueCodes
    };
  });

  return {
    categories: (registry.categories || []).map((category) => ({
      id: asText(category.id),
      label: asText(category.label, asText(category.id)),
      assetIds: assets.filter((asset) => asset.categoryId === category.id).map((asset) => asset.id)
    })),
    recipes: (registry.recipes || []).map((recipe) => ({
      id: asText(recipe.id),
      label: asText(recipe.name, asText(recipe.id)),
      assetIds: asTextList(recipe.asset_ids)
    })),
    assets
  };
}

export async function projectCatalogDomains(root, assets, integrityIssues) {
  const templateProjection = await projectTemplates(root, assets);
  const domainRecords = [
    ...(await projectTokens(root, assets)),
    ...(await projectBrand(root, assets, integrityIssues)),
    ...templateProjection.records,
    ...(await projectCases(root, assets)),
    ...(await projectStyles(root, assets))
  ];
  return { domainRecords, knownRoutes: templateProjection.routes };
}
