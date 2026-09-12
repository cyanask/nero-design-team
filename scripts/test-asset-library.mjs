import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerAssets, readTaxonomy, filterAssets, readAssetPreview } from './asset-library.mjs';
import { readCatalog } from './registry-store.mjs';
import { readLibrary, mutateStyle } from './style-library.mjs';

const sourceRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=await fs.mkdtemp(path.join(os.tmpdir(),'ndt-asset-test-'));
const scenarios=[];
try {
  await fs.mkdir(path.join(root,'registry'));await fs.mkdir(path.join(root,'assets'));
  await fs.copyFile(path.join(sourceRoot,'registry/asset-taxonomy.json'),path.join(root,'registry/asset-taxonomy.json'));
  const taxonomy=await readTaxonomy(root);
  await fs.writeFile(path.join(root,'assets/one.svg'),'<svg>one</svg>');
  await fs.writeFile(path.join(root,'assets/two.svg'),'<svg>two</svg>');
  await fs.writeFile(path.join(root,'assets/copy.svg'),'<svg>one</svg>');
  const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
  await fs.writeFile(path.join(root,'assets/preview.png'),pixel);
  const catalog={assets:[],categories:[{id:'templates',prefix:'TPL',label:'模板'}],recipes:[{id:'preserved',asset_ids:[]}],styles:[]};
  await fs.writeFile(path.join(root,'registry/design-assets.json'),JSON.stringify(catalog));
  const first={id:'NDT-TPL-001',key:'first',name:'测试组件',category:'templates',asset_type:'component',purpose:'测试跨场景组件',rights:'fixture',source_ref:'assets/one.svg',routes:['frontend-ui','ppt'],use_for:['fixture'],tags:Object.fromEntries(taxonomy.visual_dimensions.map(d=>[d.id,[]])),use_case_tags:['frontend','poster','PPT','report'],tagging_basis:'fixture source',preview:{source_ref:'assets/preview.png',label:'fixture',boundary:'test only'}};
  first.tags.component=['SVG图形'];first.tags.geometry=['抽象图形'];
  const manifest=assets=>({schema_version:'ndt.asset-intake.v1',taxonomy_version:taxonomy.version,assets});
  const original=await readCatalog(root);
  const checked=await registerAssets(root,{action:'check',manifest:manifest([first])});
  await assert.rejects(registerAssets(root,{action:'check',manifest:{...manifest([first]),taxonomy_version:'unsupported-version'}}));
  assert.equal(checked.count,1);assert.equal((await readCatalog(root)).revision,original.revision);scenarios.push('dry-run does not write');
  for(const invalid of [
    {...first,tags:{...first.tags,method:['未知方法']}},
    {...first,tags:Object.fromEntries(taxonomy.visual_dimensions.map(d=>[d.id,[]]))},
    {...first,use_case_tags:['项目启动']},
    {...first,source_ref:'../outside.svg'},
    {...first,source_ref:'assets/missing.svg'},
    {...first,members:['../../outside.svg']},
    {...first,preview:{...first.preview,source_ref:'assets/one.svg'}},
    {...first,preview:undefined},
    {...first,asset_type:'style-pack'},
    {...first,category:'style-packs'},
    {...first,rights:''}
  ]) await assert.rejects(registerAssets(root,{action:'register',expected_revision:original.revision,manifest:manifest([invalid])}));
  assert.equal((await readCatalog(root)).revision,original.revision);scenarios.push('taxonomy, completeness, rights and source boundaries fail without writes');
  const created=await registerAssets(root,{action:'register',expected_revision:original.revision,manifest:manifest([first])});
  let live=await readLibrary(root);assert.equal(live.assets.length,1);assert.equal(live.assets[0].maturity,'candidate');
  assert.equal(filterAssets(live.assets,taxonomy,{use_case_tags:['PPT']}).assets[0].id,first.id);
  for (const scene of ['frontend','poster','PPT','report']) assert.equal(filterAssets(live.assets,taxonomy,{use_case_tags:[scene]}).assets[0].id,first.id);
  assert.equal(filterAssets(live.assets,taxonomy,{use_case_tags:['frontend','poster','PPT','report']}).total,1);
  assert.equal(filterAssets(live.assets,taxonomy,{tags:{graphics:['抽象图形'],usage:['网页','PPT']}}).total,1);
  assert.equal((await readAssetPreview(root,first.id)).url,'data:image/png;base64,'+pixel.toString('base64'));scenarios.push('one asset in multiple scenes, legacy query aliases and dynamic preview');
  for(const duplicate of [first,{...first,id:'NDT-TPL-002'}, {...first,id:'NDT-TPL-002',source_ref:'assets/copy.svg'}]) await assert.rejects(registerAssets(root,{action:'register',expected_revision:created.revision,manifest:manifest([duplicate])}),error=>error.code==='DUPLICATE');
  assert.equal((await readCatalog(root)).revision,created.revision);scenarios.push('duplicate ID, source and exact file contents rejected');
  const second={...first,id:'NDT-TPL-1001',key:'second',source_ref:'assets/two.svg'};
  await assert.rejects(registerAssets(root,{action:'register',expected_revision:original.revision,manifest:manifest([second])}),error=>error.code==='CONFLICT');
  const beforeBadBatch=(await readCatalog(root)).revision;
  await assert.rejects(registerAssets(root,{action:'register',expected_revision:beforeBadBatch,manifest:manifest([second,{...second,id:'NDT-TPL-1002',source_ref:'assets/missing.svg'}])}));
  assert.equal((await readCatalog(root)).revision,beforeBadBatch);scenarios.push('stale revision and all-or-nothing batch');
  const results=await Promise.allSettled([
    registerAssets(root,{action:'register',expected_revision:beforeBadBatch,manifest:manifest([second])}),
    mutateStyle(root,{action:'save',expected_revision:beforeBadBatch,manifest:{name:'fixture style',assets:[{asset_id:first.id,asset_version:live.assets[0].asset_version,use:'fixture'}],rules:['fixture'],parameters:[],templates:[],previews:[]}})
  ]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);scenarios.push('shared asset/style concurrency lock');
  const after=await readCatalog(root);assert.deepEqual(after.catalog.recipes,catalog.recipes);
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(root,'registry/style-history',original.revision+'.json'))),catalog);scenarios.push('existing routes and exact-byte rollback retained');
  const input=Array.from({length:1200},(_,i)=>({...after.catalog.assets[0],id:`NDT-TPL-${String(i+1).padStart(3,'0')}`}));
  const page=filterAssets(input,taxonomy,{tags:{component:['SVG图形']},use_case_tags:['PPT'],offset:1100,limit:100});
  assert.equal(page.total,1200);assert.equal(page.assets.length,100);assert.equal(page.assets.at(-1).id,'NDT-TPL-1200');scenarios.push('1200 assets and four-digit IDs paginate without omissions');
  console.log(JSON.stringify({status:'pass',scenarios},null,2));
} finally { await fs.rm(root,{recursive:true}); }
