import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const server = path.join(root, "mcp-lite", "server.mjs");
const generator = path.join(root, "scripts", "nero-design.mjs");
const scorer = path.join(root, "scripts", "score-visual.mjs");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ndt-ai-app-ui-"));

function run(args, options = {}) {
  return spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
    ...options
  });
}

function route(task, preferredFrontendProfile = undefined) {
  const payload = { task };
  if (preferredFrontendProfile) payload.frontend_profile = preferredFrontendProfile;
  const result = run([server, "--dry-run", "nero_design_route", JSON.stringify(payload)]);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

try {
  const toolList = run([server, "--list-tools"]);
  assert.equal(toolList.status, 0, toolList.stderr);
  const routeSchema = JSON.parse(toolList.stdout).tools.find((tool) => tool.name === "nero_design_route")?.inputSchema;
  assert.equal(routeSchema?.properties?.frontend_profile?.type, "string");
  const generatorSchema = JSON.parse(toolList.stdout).tools.find((tool) => tool.name === "nero_design_generate_project")?.inputSchema;
  assert.equal(generatorSchema?.properties?.frontend_profile?.type, "string");

  const routed = route("NDT 设计一个需要工具调用、人工确认和失败恢复的 AI 软件前端");
  assert.equal(routed.route, "frontend-ui");
  assert.equal(routed.frontend_profile.id, "ai-app-ui");
  assert.equal(routed.frontend_profile.template_preset, "ai-app-ui");
  assert.ok(routed.rules.includes("references/ai-app-ui.md"));
  assert.deepEqual(
    routed.frontend_profile.fused_sources.map((source) => source.repo),
    [
      "outshift-open/hax",
      "microsoft/HAXPlaybook",
      "google-labs-code/design.md",
      "aa-on-ai/agentic-design-system"
    ]
  );

  const ordinary = route("NDT 设计一个普通财务分析 Dashboard", "default");
  assert.equal(ordinary.frontend_profile.id, "default");
  assert.equal(ordinary.rules.includes("references/ai-app-ui.md"), false);

  const generationPreview = run([
    server,
    "--dry-run",
    "nero_design_generate_project",
    JSON.stringify({ route: "frontend-ui", mode: "new", frontend_profile: "ai-app-ui" })
  ]);
  assert.equal(generationPreview.status, 0, generationPreview.stderr);
  assert.deepEqual(JSON.parse(generationPreview.stdout).command.slice(-2), ["--frontend-profile", "ai-app-ui"]);

  const generated = run([
    generator,
    "new",
    "frontend-ui",
    "--preset",
    "ai-app-ui",
    "--name",
    "profile-fixture",
    "--out",
    tempRoot
  ]);
  assert.equal(generated.status, 0, `${generated.stdout}\n${generated.stderr}`);

  const projectRoot = path.join(tempRoot, "profile-fixture");
  const manifest = JSON.parse(await fs.readFile(path.join(projectRoot, ".nero-design", "manifest.json"), "utf8"));
  assert.equal(manifest.route, "frontend-ui");
  assert.equal(manifest.preset, "ai-app-ui");
  assert.equal(manifest.frontend_profile.id, "ai-app-ui");
  assert.equal(manifest.frontend_profile.rule, path.join(root, "rules", "ai-app-ui.md"));
  assert.equal(manifest.frontend_profile.design_intent_schema, path.join(projectRoot, "design-intent.schema.json"));
  assert.equal(manifest.frontend_profile.state_catalog, path.join(projectRoot, "state-catalog.json"));
  assert.equal(manifest.frontend_profile.scorecard, path.join(root, "scorecards", "ai-app-ui-scorecard.json"));

  for (const relativePath of [
    "design-intent.schema.json",
    "state-catalog.json",
    "qa.md",
    "score-manifest.example.json",
    path.join("src", "App.tsx"),
    path.join("src", "styles.css")
  ]) {
    await fs.access(path.join(projectRoot, relativePath));
  }

  const appSource = await fs.readFile(path.join(projectRoot, "src", "App.tsx"), "utf8");
  assert.match(appSource, /data-frontend-profile="ai-app-ui"/);
  const designIntentSchema = JSON.parse(await fs.readFile(path.join(projectRoot, "design-intent.schema.json"), "utf8"));
  assert.equal(designIntentSchema.properties.acceptance_viewports.items.properties.width.minimum, 900);
  const designIntentExample = JSON.parse(await fs.readFile(path.join(root, "templates", "frontend-dashboard", "presets", "ai-app-ui", "design-intent.example.json"), "utf8"));
  assert.ok(designIntentExample.acceptance_viewports.every((viewport) => viewport.width >= 900));
  const generatedStyles = await fs.readFile(path.join(projectRoot, "src", "styles.css"), "utf8");
  assert.match(generatedStyles, /min-width:\s*900px/);
  assert.doesNotMatch(generatedStyles, /@media\s*\(max-width:\s*(?:[0-8]\d\d|\d{1,2})px\)/);

  const scoreResult = run([scorer, path.join(projectRoot, "score-manifest.example.json")]);
  assert.equal(scoreResult.status, 0, `${scoreResult.stdout}\n${scoreResult.stderr}`);
  assert.match(scoreResult.stdout, /Scorecard: ai-app-ui-scorecard\.json/);
  assert.match(scoreResult.stdout, /Score: 100\/100/);

  const unsafeScoreManifest = path.join(tempRoot, "unsafe-score.json");
  await fs.writeFile(unsafeScoreManifest, JSON.stringify({ scorecard: "../registry/design-team.json", scores: {} }));
  const unsafeScoreResult = run([scorer, unsafeScoreManifest]);
  assert.notEqual(unsafeScoreResult.status, 0);
  assert.match(unsafeScoreResult.stderr, /scorecard must be a JSON file name from the NDT scorecards directory/);

  const profileOnly = run([
    generator,
    "new",
    "frontend-ui",
    "--frontend-profile",
    "ai-app-ui",
    "--name",
    "profile-only",
    "--out",
    tempRoot
  ]);
  assert.equal(profileOnly.status, 0, `${profileOnly.stdout}\n${profileOnly.stderr}`);
  const profileOnlyManifest = JSON.parse(await fs.readFile(path.join(tempRoot, "profile-only", ".nero-design", "manifest.json"), "utf8"));
  assert.equal(profileOnlyManifest.preset, "ai-app-ui");
  assert.equal(profileOnlyManifest.frontend_profile.id, "ai-app-ui");

  const existingProject = path.join(tempRoot, "existing-project");
  await fs.mkdir(existingProject);
  const initialized = run([
    generator,
    "init",
    "frontend-ui",
    "--project-root",
    existingProject,
    "--frontend-profile",
    "ai-app-ui"
  ]);
  assert.equal(initialized.status, 0, `${initialized.stdout}\n${initialized.stderr}`);
  const initializedManifest = JSON.parse(await fs.readFile(path.join(existingProject, ".nero-design", "manifest.json"), "utf8"));
  assert.equal(initializedManifest.preset, null);
  assert.equal(initializedManifest.frontend_profile.id, "ai-app-ui");
  assert.equal(
    initializedManifest.frontend_profile.design_intent_schema,
    path.join(root, "templates", "frontend-dashboard", "presets", "ai-app-ui", "design-intent.schema.json")
  );

  const unknownProfile = run([
    generator,
    "new",
    "frontend-ui",
    "--frontend-profile",
    "unknown",
    "--name",
    "unknown-profile",
    "--out",
    tempRoot
  ]);
  assert.notEqual(unknownProfile.status, 0);
  assert.match(unknownProfile.stderr, /Unsupported frontend profile: unknown/);

  const wrongRoute = run([
    generator,
    "new",
    "image-report",
    "--frontend-profile",
    "ai-app-ui",
    "--name",
    "wrong-route",
    "--out",
    tempRoot
  ]);
  assert.notEqual(wrongRoute.status, 0);
  assert.match(wrongRoute.stderr, /--frontend-profile is only supported for the frontend-ui route/);

  console.log("PASS ai-app-ui is a frontend-ui profile with routed rules, a generated state template, project intent bindings, and a dedicated scorecard");
} finally {
  await fs.rm(tempRoot, { recursive: true, force: true });
}
