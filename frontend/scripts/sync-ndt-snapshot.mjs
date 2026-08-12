import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  mergeProjectSpecs,
  parseProjectSpec,
  parseProjectsFilePath,
  posix,
  readProjectsFile
} from "./snapshot/shared.mjs";
import { observeProjects } from "./snapshot/project-observer.mjs";
import { atomicWrite, createSnapshot } from "./snapshot/snapshot-builder.mjs";

export { mergeProjectSpecs, observeProjects, readProjectsFile };

export function parseArgs(argv) {
  const options = {
    ndtHome: process.env.NERO_DESIGN_TEAM_HOME || "",
    projects: [],
    projectsFile: null,
    out: path.resolve(".local/generated"),
    check: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--ndt-home") options.ndtHome = argv[++index] || "";
    else if (argument === "--project") options.projects.push(parseProjectSpec(argv[++index] || ""));
    else if (argument === "--projects-file") options.projectsFile = parseProjectsFilePath(argv[++index] || "");
    else if (argument === "--out") options.out = path.resolve(argv[++index] || "");
    else if (argument === "--check") options.check = true;
    else throw new Error("Unknown argument: " + argument);
  }

  if (!options.ndtHome) throw new Error("ROOT_NOT_CONFIGURED: provide --ndt-home");
  options.projects = mergeProjectSpecs(options.projects);
  return options;
}

export async function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.projectsFile) {
    options.projects = mergeProjectSpecs(options.projects, await readProjectsFile(options.projectsFile));
  }
  const snapshot = await createSnapshot(options);
  let target = null;
  if (!options.check) target = await atomicWrite(options.out, snapshot);
  const result = {
    status: "pass",
    mode: options.check ? "check" : "sync",
    target: target ? posix(path.relative(process.cwd(), target)) : null,
    snapshotId: snapshot.snapshotId,
    snapshotFingerprint: snapshot.snapshotFingerprint,
    registryVersion: snapshot.catalog.source.sourceVersion,
    assets: snapshot.catalog.data?.assets.length ?? 0,
    categories: snapshot.catalog.data?.categories.length ?? 0,
    recipes: snapshot.catalog.data?.recipes.length ?? 0,
    projectDiscovery: snapshot.projects.data?.index.discovery ?? "unavailable",
    openIntegrityIssues: snapshot.catalog.data?.integrityIssues.length ?? 0
  };
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  return { snapshot, result };
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(fileURLToPath(pathToFileURL(process.argv[1]))).href;

if (isMain) {
  run().catch((error) => {
    process.stderr.write(String(error?.message || error) + "\n");
    process.exitCode = 1;
  });
}
