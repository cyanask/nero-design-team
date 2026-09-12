import { fail, readCatalog, updateCatalog } from './registry-store.mjs';
import { dimensionLabels, filterAssets, readTaxonomy } from './asset-library.mjs';
export { catalogPath } from './registry-store.mjs';
const text = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 12000;
const list = value => Array.isArray(value) && value.length <= 100;
export async function readLibrary(root, { styleId, version, recommendedOnly = false, search, tags, use_case_tags, offset, limit } = {}) {
  const { catalog, revision } = await readCatalog(root);
  const taxonomy = await readTaxonomy(root);
  const selection = filterAssets(catalog.assets, taxonomy, { search, tags, use_case_tags, offset, limit });
  const resourceSelection = filterAssets(catalog.supporting_resources || [], taxonomy, { search, tags, use_case_tags, offset, limit });
  const assets = selection.assets;
  const styles = (catalog.styles || []).filter(style => styleId ? style.id === styleId : !style.deleted_at).map(style => ({
    ...style,
    versions: style.versions.filter(item => (version === undefined || item.version === version) && (!recommendedOnly || (item.status === 'approved' && item.approval?.by === 'NERO')))
  })).filter(style => !recommendedOnly || (!style.deleted_at && style.versions.some(item => item.status === 'approved' && item.approval?.by === 'NERO')));
  const cases = catalog.cases || [];
  const references = [...cases, ...(catalog.supporting_resources || [])].map(item => ({
    id: item.id, name: item.name, category: item.category, source_ref: item.source_ref,
    reason: item.retired_from_case_library?.reason || item.retired_from_asset_library?.reason || '',
    replacement_ids: item.retired_from_asset_library?.replacement_ids || []
  }));
  return { revision, dimensions: dimensionLabels(taxonomy), taxonomy, assets, styles, cases, references,
    resources: resourceSelection.assets, resource_total: resourceSelection.total, recipes: catalog.recipes || [],
    categories: catalog.categories || [], total: selection.total, offset: selection.offset, limit: selection.limit };
}

function validateManifest(catalog, manifest, historicalManifest) {
  if (!manifest || !text(manifest.name) || !list(manifest.assets) || !manifest.assets.length || !list(manifest.rules) || !manifest.rules.every(text) || !manifest.rules.length || !list(manifest.parameters) || !list(manifest.templates) || !list(manifest.previews)) fail('请填写风格名称、资产清单与组合规则。');
  const refs = new Set();
  const historicalRefs = [...(historicalManifest?.assets || []), ...(historicalManifest?.templates || [])];
  const availableAssets = [...catalog.assets, ...(catalog.supporting_resources || []).filter(item =>
    item.retired_from_asset_library?.action === 'delete-asset' && historicalRefs.some(ref => ref.asset_id === item.id && ref.asset_version === item.asset_version))];
  for (const ref of [...manifest.assets, ...manifest.templates]) {
    const asset = availableAssets.find(item => item.id === ref.asset_id);
    if (!asset || ref.asset_version !== asset.asset_version || !text(ref.use)) fail('资产 ID、版本或用途无效。');
    if (refs.has(ref.asset_id)) fail('同一资产只引用一次，请合并用途。');
    refs.add(ref.asset_id);
  }
  if (manifest.templates.some(ref => availableAssets.find(a => a.id === ref.asset_id)?.category !== 'templates')) fail('模板引用必须指向已登记的模板资产。');
  for (const parameter of manifest.parameters) if (!text(parameter.name) || !text(parameter.value) || !text(parameter.constraint)) fail('可调参数必须包含名称、值和约束。');
  for (const [field, records] of [['case_ids', [...(catalog.cases || []), ...(catalog.supporting_resources || []).filter(item => item.retired_from_case_library)]], ['resource_ids', catalog.supporting_resources || []]]) {
    if (manifest[field] !== undefined && (!list(manifest[field]) || new Set(manifest[field]).size !== manifest[field].length || manifest[field].some(id => !records.some(item => item.id === id)))) fail('案例或制作依据引用无效。');
  }
  if (manifest.prompts !== undefined) {
    if (!list(manifest.prompts) || new Set(manifest.prompts.map(p => p.id)).size !== manifest.prompts.length) fail('风格提示词格式无效。');
    for (const prompt of manifest.prompts) {
      if (!text(prompt.id) || !text(prompt.name) || !text(prompt.text) || !list(prompt.source_refs) || prompt.source_refs.some(ref => !text(ref) || ref.startsWith('/') || ref.includes('\\') || ref.split('/').includes('..'))) fail('提示词须有名称、正文和安全的来源引用。');
    }
  }
  if (catalog.library_contract?.version === '2.0.0' && !manifest.prompts?.length) fail('请为风格绑定至少一份制作提示词。');
  for (const preview of [...manifest.previews, ...manifest.templates.flatMap(ref => ref.previews || [])]) {
    if (!text(preview.src) || !/^\/ndt-assets\/[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\.(png|jpe?g|svg|webp)$/i.test(preview.src) || !text(preview.label) || !text(preview.boundary)) fail('预览须引用现有预览包，并填写说明和使用边界。');
    if (catalog.preview_files && !catalog.preview_files.includes(preview.src)) fail('预览文件未登记。');
  }
}

export function retireCase(catalog, caseId, reason = '已从设计案例库删除；历史引用与原始文件保留。') {
  const item = catalog.cases?.find(item => item.id === caseId);
  if (!item) fail('案例已删除或不存在。', 'NOT_FOUND');
  const now = new Date().toISOString();
  catalog.cases = catalog.cases.filter(item => item.id !== caseId);
  catalog.supporting_resources ||= [];
  if (catalog.supporting_resources.some(reference => reference.id === caseId)) fail('案例编号存在重复引用。');
  catalog.supporting_resources.push({ ...item, retired_from_case_library: { at: now, reason } });
  for (const recipe of catalog.recipes || []) {
    if (!recipe.case_ids?.includes(caseId)) continue;
    recipe.case_ids = recipe.case_ids.filter(id => id !== caseId);
    recipe.resource_ids = [...new Set([...(recipe.resource_ids || []), caseId])];
  }
  catalog.case_updated_at = now;
  return { case_id: caseId, status: 'removed_from_library' };
}

export async function mutateCase(root, request) {
  if (request?.action !== 'delete-case' || request.confirmed !== true || !text(request.case_id)) fail('请确认要删除的案例。');
  return updateCatalog(root, request.expected_revision, catalog => retireCase(catalog, request.case_id));
}

export async function mutateAsset(root, request) {
  if (!['delete-asset', 'delete-assets'].includes(request?.action) || request.confirmed !== true) fail('请确认要删除的资产。');
  const ids = request.action === 'delete-assets' ? request.asset_ids : [request.asset_id];
  if (!Array.isArray(ids) || !ids.length || ids.length > 1000 || !ids.every(text) || new Set(ids).size !== ids.length) fail('请选择 1 至 1000 项不重复的资产。');
  return updateCatalog(root, request.expected_revision, catalog => {
    const selected = new Set(ids);
    const items = ids.map(id => catalog.assets?.find(item => item.id === id));
    if (items.some(item => !item)) fail('部分资产已删除或不存在，请重新选择。', 'NOT_FOUND');
    catalog.supporting_resources ||= [];
    if (catalog.supporting_resources.some(reference => selected.has(reference.id))) fail('资产编号存在重复引用。');
    const now = new Date().toISOString();
    catalog.assets = catalog.assets.filter(asset => !selected.has(asset.id));
    catalog.supporting_resources.push(...items.map(item => ({ ...item, retired_from_asset_library: { action: 'delete-asset', at: now, reason: '已从资产库删除；已有风格的历史引用与原始文件保留。' } })));
    for (const recipe of catalog.recipes || []) {
      const removed = recipe.asset_ids?.filter(id => selected.has(id)) || [];
      if (!removed.length) continue;
      recipe.asset_ids = recipe.asset_ids.filter(id => !selected.has(id));
      recipe.resource_ids = [...new Set([...(recipe.resource_ids || []), ...removed])];
    }
    catalog.asset_updated_at = now;
    return { ...(request.action === 'delete-asset' ? { asset_id: ids[0] } : { asset_ids: ids }), count: ids.length, status: 'removed_from_library' };
  });
}

export async function mutateStyle(root, request) {
  if (!request || !['save', 'approve', 'deactivate', 'delete'].includes(request.action)) fail('不支持的风格操作。');
  if (!text(request.style_id)) fail('请选择已有风格。');
  return updateCatalog(root, request.expected_revision, catalog => {
    const style = catalog.styles?.find(item => item.id === request.style_id);
    if (!style || style.deleted_at) fail('风格已撤下或不存在。', 'NOT_FOUND');
    const now = new Date().toISOString();
    let selected;
    if (request.action === 'save') {
      const base = style.versions.find(item => item.version === request.version);
      if (!base) fail('编辑的风格版本不存在。');
      validateManifest(catalog, request.manifest, base.manifest);
      // Every save appends a candidate; even past candidates remain addressable.
      selected = { version: Math.max(0, ...style.versions.map(item => item.version)) + 1, status: 'candidate', created_at: now, based_on: base.version, manifest: structuredClone(request.manifest), approval: null };
      style.versions.push(selected);
    } else {
      selected = style.versions.find(item => item.version === request.version);
      if (!selected) fail('风格版本不存在。');
      if (request.action === 'approve') {
        if (request.confirmed_by !== 'NERO' || request.confirmed !== true) fail('须由 NERO 明确确认此版本。');
        if (selected.status !== 'candidate') fail('只有候选版本可以认可。');
        validateManifest(catalog, selected.manifest, selected.manifest);
        if (!selected.manifest.previews.length || selected.manifest.templates.some(ref => !ref.previews?.length)) fail('请先补充风格及各模板的完整效果预览，再认可风格。');
        for (const item of style.versions) if (item.status === 'approved') item.status = 'disabled';
        selected.status = 'approved';
        selected.approval = { by: 'NERO', at: now };
      } else if (request.action === 'deactivate') {
        selected.status = 'disabled';
      } else {
        style.deleted_at = now;
        for (const item of style.versions) item.status = 'disabled';
      }
    }
    style.updated_at = now;
    catalog.style_updated_at = now;
    return { style_id: style.id, version: selected.version, status: selected.status };
  });
}
