import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readLibrary, mutateStyle, mutateCase, mutateAsset } from './style-library.mjs';
import { readAssetPreview } from './asset-library.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try {
  let input = '';
  for await (const chunk of process.stdin) { input += chunk; if (input.length > 256000) throw new Error('请求过大。'); }
  const request = JSON.parse(input || '{}');
  const result = request.action === 'read' ? await readLibrary(root, request) : request.action === 'preview' ? await readAssetPreview(root, request.asset_id) : request.action === 'delete-case' ? await mutateCase(root, request) : ['delete-asset', 'delete-assets'].includes(request.action) ? await mutateAsset(root, request) : await mutateStyle(root, request);
  process.stdout.write(JSON.stringify({ ok: true, data: result }));
} catch (error) {
  process.stdout.write(JSON.stringify({ ok: false, error: error.message, code: error.code || 'INVALID_REQUEST' }));
  process.exitCode = 1;
}
