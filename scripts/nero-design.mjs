import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatesRoot = path.join(root, "templates");
const generatorsRoot = path.join(root, "generators");
const templateRegistryPath = path.join(generatorsRoot, "templates.json");
const projectManifestSchemaVersion = "1.0.0";

function usage() {
  return [
    "Usage:",
    "  node scripts/nero-design.mjs list",
    "  node scripts/nero-design.mjs new <route> --name <project-name> --out <target-parent-dir>",
    "  node scripts/nero-design.mjs init <route> --project-root <existing-project-dir> [--name <project-name>]",
    "",
    "Routes: frontend-ui, image-report, ppt, short-video, ai-image-generation"
  ].join("\n");
}

function parseArgs(argv) {
  const [command, route, ...rest] = argv;
  const options = { command, route };
  for (let index = 0; index < rest.length; index += 1) {
    const key = rest[index];
    const value = rest[index + 1];
    if (key === "--name") {
      options.name = value;
      index += 1;
    } else if (key === "--out") {
      options.out = value;
      index += 1;
    } else if (key === "--project-root") {
      options.projectRoot = value;
      index += 1;
    } else if (key === "--help" || key === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${key}`);
    }
  }
  return options;
}

async function readRegistry() {
  return JSON.parse(await fs.readFile(templateRegistryPath, "utf8"));
}

function runNode(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: root,
      stdio: "inherit"
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(scriptPath)} exited with ${code}`));
    });
  });
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function replaceIfExists(filePath, replacements) {
  if (!(await pathExists(filePath))) return;
  let text = await fs.readFile(filePath, "utf8");
  for (const [from, to] of replacements) {
    text = text.replaceAll(from, to);
  }
  await fs.writeFile(filePath, text, "utf8");
}

async function copyThemeAssets(targetDir) {
  const themeDir = path.join(targetDir, "theme");
  await fs.mkdir(themeDir, { recursive: true });
  await fs.copyFile(path.join(root, "build", "css", "nero-tokens.css"), path.join(themeDir, "nero-tokens.css"));
  for (const fileName of ["report-theme.mjs", "pptx-theme.mjs", "remotion-theme.mjs", "remotion-theme.ts"]) {
    await fs.copyFile(path.join(root, "build", "themes", fileName), path.join(themeDir, fileName));
  }
}

async function localizeTemplateImports(targetDir) {
  await replaceIfExists(path.join(targetDir, "src", "styles.css"), [
    ["../../../build/css/nero-tokens.css", "../theme/nero-tokens.css"]
  ]);
  await replaceIfExists(path.join(targetDir, "src", "style.css"), [
    ["../../../build/css/nero-tokens.css", "../theme/nero-tokens.css"]
  ]);
  await replaceIfExists(path.join(targetDir, "src", "render.mjs"), [
    ["../../../build/themes/report-theme.mjs", "../theme/report-theme.mjs"]
  ]);
  await replaceIfExists(path.join(targetDir, "src", "build.mjs"), [
    ["../../../build/themes/pptx-theme.mjs", "../theme/pptx-theme.mjs"]
  ]);
  await replaceIfExists(path.join(targetDir, "src", "SignalVideo.tsx"), [
    ["../../../build/themes/remotion-theme", "../theme/remotion-theme"]
  ]);
}

async function listRoutes() {
  const registry = await readRegistry();
  for (const [route, config] of Object.entries(registry.routes)) {
    console.log(`${route}\t${config.template}\t${config.description}`);
  }
}

async function createProjectLocalDirs(projectRoot) {
  await fs.mkdir(path.join(projectRoot, ".nero-design"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, "design-output"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, "exports"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, "screenshots"), { recursive: true });
}

async function writeProjectManifest({ projectRoot, projectName, route, config, registry, mode }) {
  await createProjectLocalDirs(projectRoot);
  const manifestPath = path.join(projectRoot, ".nero-design", "manifest.json");
  if (await pathExists(manifestPath)) {
    throw new Error(`NERO design manifest already exists: ${manifestPath}`);
  }

  const now = new Date().toISOString();
  const manifest = {
    schema_version: projectManifestSchemaVersion,
    project_name: projectName,
    route,
    template: config.template,
    created_at: now,
    updated_at: now,
    mode,
    design_team: {
      role: "background-support-design-system",
      root,
      version: registry.version,
      token_root: path.join(root, "tokens"),
      template_root: templatesRoot,
      case_library_root: path.join(root, "case-library"),
      build_outputs: {
        css_variables: path.join(root, "build", "css", "nero-tokens.css"),
        tailwind: path.join(root, "build", "tailwind", "nero-tailwind.cjs"),
        report_theme: path.join(root, "build", "themes", "report-theme.mjs"),
        pptx_theme: path.join(root, "build", "themes", "pptx-theme.mjs"),
        remotion_theme: path.join(root, "build", "themes", "remotion-theme.ts")
      }
    },
    project_local: {
      manifest: manifestPath,
      output_root: path.join(projectRoot, "design-output"),
      exports_root: path.join(projectRoot, "exports"),
      screenshots_root: path.join(projectRoot, "screenshots")
    },
    brand_assets: {
      profile: path.join(root, "brand", "brand-profile.json"),
      layouts: path.join(root, "brand", "master-layouts.json"),
      mark: path.join(root, "brand", "assets", "nero-mark.svg"),
      wordmark: path.join(root, "brand", "assets", "nero-wordmark.svg")
    },
    case_references: [],
    qa: {
      visual_qa_manifest: null,
      visual_score_manifest: null,
      production_check_manifest: null,
      latest_status: "not_run"
    },
    gpt_image_2: {
      used: false,
      brief_path: null,
      boundary: "Use only for visual素材. Exact text, financial figures, charts, tables, and regulatory conclusions must be layered or verified outside gpt-image-2."
    },
    asset_boundary: [
      "Do not copy restricted external assets into public or client deliverables without license review.",
      "Project outputs stay in the project directory; reusable patterns can be promoted back to NERO Design Team after review.",
      "This manifest records design-system usage. It is not a factual source, disclosure record, or license opinion."
    ],
    next_steps: [
      "Replace sample content with project-specific source-backed content.",
      "Run visual QA and visual score before delivery.",
      "If the output becomes reusable, archive a lightweight case snapshot or promote the pattern to templates/rules/tokens."
    ]
  };

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifestPath;
}

async function createProject(options) {
  const registry = await readRegistry();
  const config = registry.routes[options.route];
  if (!config) {
    throw new Error(`Unsupported route: ${options.route}\n${usage()}`);
  }

  const projectName = options.name || config.default_name;
  const outParent = path.resolve(options.out || process.cwd());
  const targetDir = path.join(outParent, projectName);

  if (await pathExists(targetDir)) {
    throw new Error(`Target already exists: ${targetDir}`);
  }

  await runNode(path.join(root, "scripts", "build-tokens.mjs"));
  await fs.mkdir(outParent, { recursive: true });
  await fs.cp(path.join(templatesRoot, config.template), targetDir, {
    recursive: true,
    force: false,
    errorOnExist: true
  });
  await copyThemeAssets(targetDir);
  await localizeTemplateImports(targetDir);

  const manifestPath = await writeProjectManifest({
    projectRoot: targetDir,
    projectName,
    route: options.route,
    config,
    registry,
    mode: "generated-template-project"
  });
  console.log(`Created ${options.route} project at ${targetDir}`);
  console.log(`NERO design manifest: ${manifestPath}`);
}

async function initExistingProject(options) {
  const registry = await readRegistry();
  const config = registry.routes[options.route];
  if (!config) {
    throw new Error(`Unsupported route: ${options.route}\n${usage()}`);
  }
  if (!options.projectRoot) {
    throw new Error(`Missing --project-root\n${usage()}`);
  }

  const projectRoot = path.resolve(options.projectRoot);
  if (!(await pathExists(projectRoot))) {
    throw new Error(`Project root does not exist: ${projectRoot}`);
  }

  const projectName = options.name || path.basename(projectRoot);
  const manifestPath = await writeProjectManifest({
    projectRoot,
    projectName,
    route: options.route,
    config,
    registry,
    mode: "existing-project-integration"
  });
  console.log(`Initialized NERO design integration at ${projectRoot}`);
  console.log(`NERO design manifest: ${manifestPath}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || options.command === "--help" || options.command === "-h") {
    console.log(usage());
    return;
  }
  if (options.command === "list") {
    await listRoutes();
    return;
  }
  if (options.command === "new") {
    await createProject(options);
    return;
  }
  if (options.command === "init") {
    await initExistingProject(options);
    return;
  }
  throw new Error(usage());
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
