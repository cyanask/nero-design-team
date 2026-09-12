import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerAssets } from './asset-library.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try {
  const [action, manifestPath, expectedRevision] = process.argv.slice(2);
  if (!['check','register'].includes(action) || !manifestPath) throw new Error('用法：node scripts/asset-library-cli.mjs check|register <manifest.json> [expected_revision]');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const result = await registerAssets(root, { action, manifest, expected_revision: expectedRevision });
  process.stdout.write(JSON.stringify({ ok: true, data: result }, null, 2) + '\n');
} catch (error) {
  process.stderr.write(JSON.stringify({ ok: false, code: error.code || 'INVALID_REQUEST', error: error.message }) + '\n');
  process.exitCode = 1;
}
