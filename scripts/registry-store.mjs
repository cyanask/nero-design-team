import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

export const digest = value => createHash('sha256').update(value).digest('hex');
export const catalogPath = root => path.join(root, 'registry/design-assets.json');
export const fail = (message, code = 'INVALID_REQUEST') => { throw Object.assign(new Error(message), { code }); };

export async function readCatalog(root) {
  const raw = await fs.readFile(catalogPath(root), 'utf8');
  return { catalog: JSON.parse(raw), revision: digest(raw), raw };
}

// Styles and asset intake share the same lock, revision and exact-byte history.
export async function updateCatalog(root, expectedRevision, update) {
  const target = catalogPath(root);
  const lockPath = `${target}.lock`;
  const lock = await fs.open(lockPath, 'wx').catch(() => fail('目录正在保存，请稍后重试。', 'BUSY'));
  let temporary;
  try {
    const { catalog, raw, revision } = await readCatalog(root);
    if (expectedRevision !== revision) fail('目录已变更。请重新载入后再保存，现有编辑已保留。', 'CONFLICT');
    const result = await update(catalog);
    const backupDir = path.join(root, 'registry/style-history');
    await fs.mkdir(backupDir, { recursive: true });
    await fs.writeFile(path.join(backupDir, `${revision}.json`), raw, { flag: 'wx' }).catch(error => { if (error.code !== 'EEXIST') throw error; });
    const output = JSON.stringify(catalog, null, 2) + '\n';
    temporary = `${target}.${randomUUID()}.tmp`;
    const handle = await fs.open(temporary, 'wx');
    try { await handle.writeFile(output); await handle.sync(); } finally { await handle.close(); }
    await fs.rename(temporary, target);
    return { ...result, revision: digest(output) };
  } finally {
    if (temporary) await fs.unlink(temporary).catch(() => {});
    await lock.close();
    await fs.unlink(lockPath);
  }
}
