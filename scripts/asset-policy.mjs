import fs from "node:fs/promises";
import path from "node:path";

function blockedSourceRefs(catalog) {
  return new Set([
    ...(catalog.integrity_issues || []).filter((item) => item.status === "open").map((item) => item.source_ref),
    ...(catalog.assets || []).filter((item) => item.reuse_state === "quarantined" || /quarantined|blocked|retired|禁止|隔离/i.test(item.status || "")).map((item) => item.source_ref)
  ].filter((ref) => typeof ref === "string" && ref.length > 0));
}

function resolveReference(root, ref) {
  return path.resolve(root, ref.replace(/^\$NERO_DESIGN_TEAM_HOME(?=\/|$)/, root));
}

async function isBlockedReference(root, file, catalog) {
  // Resolve the package root without losing a link's location inside a blocked directory.
  const realRoot = await fs.realpath(root);
  const targets = new Set([path.resolve(file), path.resolve(realRoot, path.relative(root, file)), await fs.realpath(file).catch(() => path.resolve(file))]);
  // A parent alias may enter a quarantined directory before the final link exits it.
  for (let parent = path.dirname(file); parent !== path.dirname(parent); parent = path.dirname(parent)) {
    const resolved = await fs.realpath(parent).catch(() => null);
    if (resolved) targets.add(resolved);
  }
  for (const ref of blockedSourceRefs(catalog)) {
    const declared = resolveReference(root, ref);
    const source = await fs.realpath(declared).catch(() => declared);
    const directory = ref.endsWith("/") || await fs.stat(source).then((stat) => stat.isDirectory(), () => false);
    for (const blocked of new Set([declared, path.resolve(realRoot, path.relative(root, declared)), source])) for (const target of targets) {
      if (blocked === target) return true;
      const relative = path.relative(blocked, target);
      if (directory && relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)) return true;
    }
  }
  return false;
}

export async function isBlockedBrandAsset(root, file) {
  const catalog = JSON.parse(await fs.readFile(path.join(root, "registry", "design-assets.json"), "utf8"));
  await fs.realpath(file); // Explicit declarations must still identify an existing file.
  return isBlockedReference(root, file, catalog);
}

export async function resolveBrandAssets(root) {
  const profilePath = path.join(root, "brand", "brand-profile.json");
  const profile = JSON.parse(await fs.readFile(profilePath, "utf8"));
  const catalog = JSON.parse(await fs.readFile(path.join(root, "registry", "design-assets.json"), "utf8"));
  const result = { profile: profilePath, layouts: path.join(root, "brand", "master-layouts.json") };
  for (const name of ["mark", "wordmark"]) {
    const declared = profile.brand_assets?.[name];
    const target = declared ? resolveReference(root, declared) : null;
    const prohibited = target ? await isBlockedReference(root, target, catalog) : false;
    let available = false;
    if (target && !prohibited) {
      try { available = (await fs.stat(target)).isFile(); } catch { /* Missing optional brand art permits an unbranded layout. */ }
    }
    result[name] = available ? target : null;
    result[`${name}_status`] = available ? "available_reference" : prohibited ? "quarantined" : "unavailable";
  }
  return result;
}
