import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseCheck = path.join(root, "release-check.mjs");
const allowlistCheck = path.join(root, "scripts", "check-release-allowlist.mjs");
const temp = await fs.mkdtemp(path.join(os.tmpdir(), "ndt-release-gates-"));

function run(args) {
  return spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });
}

function report(result) {
  try { return JSON.parse(result.stdout); } catch { throw new Error(`invalid gate output:\n${result.stdout}\n${result.stderr}`); }
}

try {
  const safe = path.join(temp, "safe-export");
  await fs.mkdir(safe);
  await fs.writeFile(path.join(safe, "README.md"), "# Public export\n", "utf8");
  await fs.writeFile(path.join(temp, "outside-secret.txt"), `${"OPENAI_"}API_KEY='outside-only-value'\n`, "utf8");
  const safeResult = run([releaseCheck, "--root", safe, "--strict"]);
  if (safeResult.status !== 0) throw new Error(`safe clean export failed:\n${safeResult.stdout}\n${safeResult.stderr}`);
  const safeReport = report(safeResult);
  if (safeReport.root !== await fs.realpath(safe)) throw new Error("--root did not bind the reported scan root");
  if (safeReport.summary.files_scanned !== 1) throw new Error("release-check scanned outside the supplied root");

  const unsafe = path.join(temp, "unsafe-export");
  await fs.mkdir(unsafe);
  await fs.writeFile(path.join(unsafe, ".env"), "TOKEN='placeholder'\n", "utf8");
  await fs.writeFile(path.join(unsafe, "config.py"), `source = '${"/"}Users/example/private/file.txt'\n`, "utf8");
  await fs.symlink(path.join(temp, "outside-secret.txt"), path.join(unsafe, "escape-link"));
  const unsafeResult = run([releaseCheck, "--root", unsafe, "--strict"]);
  if (unsafeResult.status === 0) throw new Error("unsafe clean export unexpectedly passed");
  const types = new Set(report(unsafeResult).findings.map((finding) => finding.type));
  for (const expected of ["env-file", "absolute-local-path", "symlink-escape"]) {
    if (!types.has(expected)) throw new Error(`release-check did not expose red boundary: ${expected}`);
  }

  const copiedExport = path.join(temp, "allowlist-export");
  await fs.mkdir(copiedExport);
  const releaseManifest = JSON.parse(await fs.readFile(path.join(root, "release-manifest.json"), "utf8"));
  for (const relative of releaseManifest.files) {
    const source = path.join(root, relative);
    const destination = path.join(copiedExport, relative);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
    await fs.chmod(destination, (await fs.stat(source)).mode & 0o777);
  }
  const allowlistPass = run([allowlistCheck, "--root", copiedExport]);
  if (allowlistPass.status !== 0) throw new Error(`exact allowlist baseline failed:\n${allowlistPass.stdout}\n${allowlistPass.stderr}`);
  await fs.writeFile(path.join(copiedExport, "assets", "unlisted-private.txt"), "private nested fixture\n", "utf8");
  const allowlistFail = run([allowlistCheck, "--root", copiedExport]);
  if (allowlistFail.status === 0) throw new Error("unknown nested release file unexpectedly passed");
  const allowlistTypes = new Set(report(allowlistFail).errors.map((error) => error.type));
  if (!allowlistTypes.has("unknown-release-file")) throw new Error("allowlist did not expose unknown nested file");

  console.log("PASS release gates honor --root, reject env/path/symlink escape, and fail closed on an unknown nested file");
} finally {
  await fs.rm(temp, { recursive: true, force: true });
}
