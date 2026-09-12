import fs from 'node:fs/promises';
import path from 'node:path';
import { digest, fail, readCatalog, updateCatalog } from './registry-store.mjs';

export async function readTaxonomy(root) {
  return JSON.parse(await fs.readFile(path.join(root, 'registry/asset-taxonomy.json'), 'utf8'));
}
export const dimensionLabels = taxonomy => Object.fromEntries(taxonomy.visual_dimensions.map(d => [d.id, d.label]));
export const referenceRecords = catalog => [...catalog.assets, ...(catalog.cases || []), ...(catalog.supporting_resources || [])];
const nonempty = value => typeof value === 'string' && !!value.trim() && value.length <= 12000;
const strings = value => Array.isArray(value) && value.every(nonempty) && new Set(value).size === value.length;
const stable = value => JSON.stringify(value);
export const sourceIdentity = asset => JSON.stringify([path.posix.normalize(asset.source_ref?.split('#')[0] || '').replace(/\/$/, '') + (asset.source_ref?.includes('#') ? '#' + asset.source_ref.split('#').slice(1).join('#') : ''), [...(asset.members || [])].map(m => path.posix.normalize(m).replace(/\/$/, '')).sort()]);

export function validateAssetMetadata(asset, taxonomy, categories) {
  const errors = [];
  const check = (ok, field) => { if (!ok) errors.push(field); };
  for (const field of ['id', 'key', 'name', 'purpose', 'rights', 'source_ref', 'tagging_basis']) check(nonempty(asset[field]), field);
  check(/^NDT-[A-Z0-9]+-[0-9]{3,}$/.test(asset.id || ''), 'id_format');
  const category = categories.find(c => c.id === asset.category);
  check(!!category && asset.id?.startsWith(`NDT-${category.prefix}-`), 'category');
  check(['brand', 'tokens', 'templates', 'components'].includes(asset.category), 'visual_asset_category');
  check(['brand-mark', 'palette', 'typography', 'spacing', 'geometry', 'shadow', 'motion', 'component', 'template', 'texture', 'image-treatment', 'design-method'].includes(asset.asset_type), 'asset_type');
  check(!['placeholder', 'quarantined'].includes(asset.reuse_state), 'usable_asset_required');
  check(strings(asset.routes) && asset.routes.length > 0, 'routes');
  check(strings(asset.use_for) && asset.use_for.length > 0, 'use_for');
  check(asset.members === undefined || strings(asset.members), 'members');
  check(['registered', 'reference', 'candidate', 'unknown'].includes(asset.maturity), 'maturity');
  check(['reusable', 'conditional', 'reference_only', 'placeholder', 'quarantined', 'unknown'].includes(asset.reuse_state), 'reuse_state');
  const dimensions = taxonomy.visual_dimensions;
  check(asset.tags && !Array.isArray(asset.tags) && Object.keys(asset.tags).length === dimensions.length && Object.keys(asset.tags).every(k => dimensions.some(d => d.id === k)), 'tag_dimensions');
  for (const dimension of dimensions) check(strings(asset.tags?.[dimension.id]) && asset.tags[dimension.id].every(v => dimension.values.includes(v)), `tags.${dimension.id}`);
  check(dimensions.some(d => asset.tags?.[d.id]?.length), 'visual_tag_required');
  check(strings(asset.use_case_tags) && asset.use_case_tags.length > 0 && asset.use_case_tags.every(v => taxonomy.use_cases.some(u => u.id === v)), 'use_case_tags');
  check(asset.taxonomy_version === taxonomy.version, 'taxonomy_version');
  check(!!asset.preview, 'preview_required');
  if (asset.preview) {
    check(nonempty(asset.preview.label) && nonempty(asset.preview.boundary), 'preview_description');
    check(nonempty(asset.preview.source_ref) || /^\/ndt-assets\/[a-zA-Z0-9_.-]+\.(png|jpe?g|svg|webp)$/i.test(asset.preview.src || ''), 'preview_source');
  }
  return errors;
}

async function localSource(root, reference) {
  if (!nonempty(reference)) fail('来源引用不能为空。');
  const relative = reference.split('#')[0];
  if (!relative || path.isAbsolute(relative) || relative.includes('\\') || relative.split('/').some(p => p === '..' || p === '.')) fail('来源必须是目录内的相对路径。');
  const realRoot = await fs.realpath(root);
  const resolved = await fs.realpath(path.resolve(root, relative)).catch(() => fail(`来源不存在：${reference}`));
  const contained = path.relative(realRoot, resolved);
  if (contained.startsWith('..' + path.sep) || contained === '..' || path.isAbsolute(contained)) fail('来源超出当前资产库。');
  return resolved;
}

export async function validateAssetSources(root, asset, { intake = false } = {}) {
  const source = await localSource(root, asset.source_ref);
  const stat = await fs.stat(source);
  if (intake && stat.isDirectory() && !asset.members?.length) fail('目录资产须列出本次登记的成员文件。');
  if (asset.members) {
    const memberRoot = stat.isDirectory() ? source : path.dirname(source);
    for (const member of asset.members) {
      const relativeRoot = path.relative(await fs.realpath(root), memberRoot);
      const candidate = path.join(relativeRoot, member);
      const resolved = await localSource(root, candidate).catch(error => {
        if (intake || path.extname(candidate)) throw error;
        return localSource(root, candidate + '.md');
      });
      const relation = path.relative(memberRoot, resolved);
      if (relation.startsWith('..' + path.sep) || relation === '..' || path.isAbsolute(relation)) fail('成员文件超出来源目录。');
    }
  }
  if (asset.preview?.source_ref) {
    const preview = await localSource(root, asset.preview.source_ref);
    if (!/\.(png|jpe?g|webp)$/i.test(preview) || !(await fs.stat(preview)).isFile()) fail('新增预览须为目录内 PNG、JPEG 或 WebP 图片。');
    if ((await fs.stat(preview)).size > 2 * 1024 * 1024) fail('预览图片不得超过 2 MB；请登记缩略图并保留原始来源。');
    const bytes = await fs.readFile(preview);
    const extension = path.extname(preview).toLowerCase();
    const valid = extension === '.png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : extension === '.webp' ? bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    if (!valid) fail('预览内容与图片格式不一致。');
  }
  // File identity is evidence for exact duplicate detection, not visual similarity.
  return stat.isFile() && !asset.source_ref.includes('#') ? digest(await fs.readFile(source)) : null;
}

export function filterAssets(assets, taxonomy, { search = '', tags = {}, use_case_tags = [], offset = 0, limit } = {}) {
  if (typeof search !== 'string' || !tags || typeof tags !== 'object' || Array.isArray(tags) || !strings(use_case_tags)) fail('检索条件格式无效。');
  const selected = { ...tags };
  const useCases = [...use_case_tags];
  for (const [key, values] of Object.entries(selected)) {
    if (!strings(values)) fail('筛选标签须为不重复的字符串数组。');
    const name = taxonomy.legacy_dimension_aliases[key] || key;
    if (name === 'use_case') {
      useCases.push(...values.flatMap(v => taxonomy.legacy_use_case_aliases[v] || [v]));
      delete selected[key];
    } else if (name !== key) { selected[name] = [...(selected[name] || []), ...values]; delete selected[key]; }
  }
  for(const [key,values] of Object.entries(selected)) {
    const dimension = taxonomy.visual_dimensions.find(d => d.id === key);
    if (!dimension || values.some(v => !dimension.values.includes(v))) fail('未知视觉筛选标签。');
  }
  if (useCases.some(v => !taxonomy.use_cases.some(u => u.id === v))) fail('未知应用场景。');
  if (!Number.isInteger(offset) || offset < 0 || (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 1000))) fail('分页范围无效。');
  const terms = search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matched = assets.filter(a => useCases.every(v => a.use_case_tags?.includes(v)) && Object.entries(selected).every(([key,values]) => values.every(v => a.tags?.[key]?.includes(v))) && terms.every(term => [a.id,a.key,a.name,a.purpose,...(a.use_for || []),...(a.aliases || []),...Object.values(a.tags || {}).flat(),...(a.use_case_tags || [])].join(' ').toLocaleLowerCase().includes(term)));
  return { total: matched.length, assets: matched.slice(offset, limit === undefined ? undefined : offset + limit), offset, limit: limit ?? null };
}

export async function prepareAssetBatch(root, catalog, input) {
  const taxonomy = await readTaxonomy(root);
  if (!input || input.schema_version !== 'ndt.asset-intake.v1' || input.taxonomy_version !== taxonomy.version || !Array.isArray(input.assets) || !input.assets.length || input.assets.length > 1000) fail('请使用当前入库合同，一批登记 1–1000 项资产。');
  const registered = referenceRecords(catalog);
  const ids = new Set(registered.map(a => a.id));
  const identities = new Set(registered.map(sourceIdentity));
  const contents = new Map();
  // Recheck current files: an old registration digest may describe a previous revision.
  for (const prior of catalog.assets) {
    if (prior.source_ref?.startsWith('not-bundled-') || prior.source_ref?.includes('#')) continue;
    const source = await localSource(root, prior.source_ref);
    if ((await fs.stat(source)).isFile()) contents.set(digest(await fs.readFile(source)), prior.id);
  }
  const prepared = [];
  for (const entry of input.assets) {
    const asset = { ...structuredClone(entry), taxonomy_version: taxonomy.version, maturity: entry.maturity || 'candidate', reuse_state: entry.reuse_state || 'conditional', status: entry.status || '候选登记' };
    const errors = validateAssetMetadata(asset, taxonomy, catalog.categories);
    if (errors.length) fail(`${asset.id || '未命名资产'} 入库字段无效：${errors.join(', ')}`);
    if (!asset.preview?.source_ref) fail('新增资产须登记实际预览文件，不能只填写预览包地址。');
    if (ids.has(asset.id)) fail(`资产 ID 已存在：${asset.id}`, 'DUPLICATE');
    asset.source_sha256 = await validateAssetSources(root, asset, { intake: true });
    const [source, ...fragment] = asset.source_ref.split('#');
    asset.source_ref = path.relative(await fs.realpath(root), await localSource(root, source)) + (fragment.length ? '#' + fragment.join('#') : '');
    if (identities.has(sourceIdentity(asset))) fail(`来源及成员范围已登记：${asset.source_ref}`, 'DUPLICATE');
    if (asset.source_sha256 && contents.has(asset.source_sha256)) fail(`文件内容与 ${contents.get(asset.source_sha256)} 完全相同，请复用原资产。`, 'DUPLICATE');
    asset.asset_version = 'catalog-sha256:' + digest(stable(asset));
    asset.registered_at = new Date().toISOString();
    ids.add(asset.id); identities.add(sourceIdentity(asset));
    if (asset.source_sha256) contents.set(asset.source_sha256, asset.id);
    prepared.push(asset);
  }
  return prepared;
}

export async function registerAssets(root, request) {
  if (request.action === 'check') {
    const { catalog, revision } = await readCatalog(root);
    const assets = await prepareAssetBatch(root, catalog, request.manifest);
    return { status: 'ready_to_register', revision, count: assets.length, assets };
  }
  if (request.action !== 'register') fail('不支持的资产入库操作。');
  return updateCatalog(root, request.expected_revision, async catalog => {
    const assets = await prepareAssetBatch(root, catalog, request.manifest);
    catalog.assets.push(...assets);
    catalog.asset_updated_at = new Date().toISOString();
    catalog.updated_at = catalog.asset_updated_at.slice(0,10);
    return { status: 'registered', asset_ids: assets.map(a => a.id), count: assets.length };
  });
}

export async function readAssetPreview(root, assetId) {
  const { catalog } = await readCatalog(root);
  const asset = [...catalog.assets, ...(catalog.cases || [])].find(a => a.id === assetId);
  if (!asset?.preview?.source_ref) fail('该资产没有登记动态预览。', 'NOT_FOUND');
  const file = await localSource(root, asset.preview.source_ref);
  const stat = await fs.stat(file);
  if (!/\.(png|jpe?g|webp)$/i.test(file) || !stat.isFile() || stat.size > 2 * 1024 * 1024) fail('预览文件格式或大小无效。');
  const mime = /\.png$/i.test(file) ? 'image/png' : /\.webp$/i.test(file) ? 'image/webp' : 'image/jpeg';
  return { asset_id: asset.id, asset_version: asset.asset_version, url: `data:${mime};base64,${(await fs.readFile(file)).toString('base64')}` };
}
