import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

const timeoutMs = 15000;
const mcpRoot = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(mcpRoot, "..");
const serverPath = path.join(mcpRoot, "server.mjs");
const sourceSampleSpec = path.join(
  root,
  "templates",
  "report-card-image",
  "presets",
  "report-figure-compiler",
  "figure-spec.example.json"
);
const registryPaths = [
  path.join(root, "registry", "design-team.json"),
  path.join(root, "registry", "design-assets.json")
];
const registryBefore = registryPaths.map((filePath) => fs.readFileSync(filePath));

function startNdjsonClient() {
  const child = spawn(process.execPath, [serverPath], {
    cwd: root,
    stdio: ["pipe", "pipe", "pipe"]
  });
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  let stdout = "";
  let stderr = "";
  let nextId = 1;
  const pending = new Map();

  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
    while (true) {
      const newline = stdout.indexOf("\n");
      if (newline === -1) break;
      const line = stdout.slice(0, newline).replace(/\r$/, "");
      stdout = stdout.slice(newline + 1);
      if (!line.trim()) continue;
      const response = JSON.parse(line);
      const waiter = pending.get(response.id);
      if (!waiter) continue;
      pending.delete(response.id);
      clearTimeout(waiter.timer);
      waiter.resolve(response);
    }
  });
  child.on("exit", (code, signal) => {
    const detail = stderr.trim();
    for (const waiter of pending.values()) {
      clearTimeout(waiter.timer);
      waiter.reject(new Error(`MCP server exited code=${code} signal=${signal}${detail ? `\n${detail}` : ""}`));
    }
    pending.clear();
  });

  return {
    call(toolName, args) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`MCP call timed out: ${toolName}\n${stderr}`.trim()));
        }, timeoutMs);
        pending.set(id, { resolve, reject, timer });
        child.stdin.write(`${JSON.stringify({
          jsonrpc: "2.0",
          id,
          method: "tools/call",
          params: { name: toolName, arguments: args }
        })}\n`);
      });
    },
    async close() {
      if (child.exitCode !== null || child.signalCode !== null) return;
      child.stdin.end();
      child.kill("SIGTERM");
      await Promise.race([
        once(child, "exit").catch(() => undefined),
        new Promise((resolve) => setTimeout(resolve, 250))
      ]);
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    }
  };
}

function resultBody(response) {
  assert.equal(response.error, undefined, response.error?.message);
  const text = response.result?.content?.[0]?.text;
  assert.equal(typeof text, "string", "MCP tool should return JSON text content");
  return JSON.parse(text);
}

function assertToolError(response, pattern) {
  assert.ok(response.error, "MCP call should fail");
  assert.match(response.error.message, pattern);
}

const listed = spawnSync(process.execPath, [serverPath, "--list-tools"], { cwd: root, encoding: "utf8" });
assert.equal(listed.status, 0, listed.stderr);
const listedServer = JSON.parse(listed.stdout);
assert.equal(listedServer.version, "2.3.0");
const toolCatalog = listedServer.tools;
assert.equal(JSON.parse(fs.readFileSync(path.join(root, "generators", "templates.json"), "utf8")).version, "2.3.0");
for (const toolName of ["nero_design_visual_qa", "nero_design_score", "nero_design_production_check"]) {
  const tool = toolCatalog.find((entry) => entry.name === toolName);
  assert.equal(tool?.inputSchema?.properties?.execute?.default, false, `${toolName} must default execute to false`);
}
const compilerSchema = toolCatalog.find((entry) => entry.name === "nero_design_compile_report_figure")?.inputSchema;
assert.equal(compilerSchema?.properties?.execute?.type, "boolean");
assert.equal(compilerSchema?.properties?.execute?.default, false);
assert.equal(compilerSchema?.oneOf?.length, 3, "compiler schema should declare three action-specific branches");
assert.ok(compilerSchema.oneOf.find((branch) => branch.properties?.action?.const === "validate")?.required.includes("project_root"));
assert.ok(compilerSchema.oneOf.find((branch) => branch.properties?.action?.const === "compile")?.required.includes("output_path"));
const validateBranch = compilerSchema.oneOf.find((branch) => branch.properties?.action?.const === "validate");
for (const compileOnlyField of ["profile", "renderer"]) {
  assert.ok(
    validateBranch.not.anyOf.some((rule) => rule.required?.includes(compileOnlyField)),
    `validate schema must reject compile-only ${compileOnlyField}`
  );
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ndt-figure-mcp-"));
const projectRoot = path.join(tempRoot, "project");
const specRelative = path.join("specs", "figure.json");
const specPath = path.join(projectRoot, specRelative);
const outputRelative = path.join("exports", "sample.svg");
const receiptRelative = path.join("exports", "sample.receipt.json");
const outputPath = path.join(projectRoot, outputRelative);
const receiptPath = path.join(projectRoot, receiptRelative);
fs.mkdirSync(path.dirname(specPath), { recursive: true });
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.copyFileSync(sourceSampleSpec, specPath);

const client = startNdjsonClient();
try {
  const naturalLanguageCases = [
    ["NDT，把产业链传导逻辑做成尽调 Word 报告图", "flow", "report-a4", "raster-canvas-png"],
    ["NDT，用分类层级说明产品边界", "hierarchy", "report-a4", "raster-canvas-png"],
    ["NDT，做一张公众号产能爬坡时间轴", "timeline", "wechat-inline", "raster-canvas-png"],
    ["NDT，把阶段门做成转化漏斗", "funnel", "report-a4", "raster-canvas-png"],
    ["NDT，用柱图比较市场规模", "bar", "report-a4", "raster-canvas-png"],
    ["NDT，把收入趋势做成 PPT 折线图", "line", "ppt-16x9", "vector-svg"],
    ["NDT，做微信公众号参与者地图和竞争格局", "participant_map", "wechat-inline", "raster-canvas-png"],
    ["NDT，用同业画像指标矩阵对比公司", "matrix", "report-a4", "raster-canvas-png"],
    ["NDT，画价值链与利润分布", "value_chain", "report-a4", "raster-canvas-png"]
  ];
  for (const [task, figureType, profile, renderer] of naturalLanguageCases) {
    const routed = resultBody(await client.call("nero_design_route", { task }));
    assert.equal(routed.figure_compiler.recommended, true, task);
    assert.equal(routed.figure_compiler.figure_type, figureType, task);
    assert.equal(routed.figure_compiler.profile, profile, task);
    assert.equal(routed.figure_compiler.renderer, renderer, task);
    assert.equal(routed.figure_compiler.tool, "nero_design_compile_report_figure", task);
    assert.ok(routed.figure_compiler.missing_inputs.includes("source"), task);
    assert.equal(routed.figure_compiler.missing_inputs_scope, "business_payload", task);
    assert.deepEqual(routed.figure_compiler.auto_derived_fields, ["schema_version", "figure_id", "title", "profile", "renderer"], task);
    assert.deepEqual(routed.figure_compiler.ambiguous_candidates, [], task);
    assert.ok(routed.recommended_tools.includes("nero_design_compile_report_figure"), task);
    assert.ok(routed.rules.includes("references/report-figure-rendering.md"), task);
    if (figureType === "matrix") {
      assert.deepEqual(routed.figure_compiler.conditional_inputs, [
        { when: "value_kind=quantitative", required: ["period", "unit", "denominator"] }
      ]);
    } else if (figureType === "funnel") {
      assert.deepEqual(routed.figure_compiler.conditional_inputs, [
        { when: "mode=quantitative", required: ["period", "unit", "denominator", "stages[].value"] },
        { when: "mode=stage_gate", required: ["stages[].gate"] }
      ]);
    } else {
      assert.deepEqual(routed.figure_compiler.conditional_inputs, [], task);
    }
  }

  for (const [task, figureType, businessFamily] of [
    ["NDT，把产能爬坡做成折线图", "line", "timeline-capacity-ramp"],
    ["NDT，把竞争格局做成指标矩阵", "matrix", "participant-competition-landscape"],
    ["NDT，把价值链利润分布做成柱图", "bar", "value-chain-profit-distribution"]
  ]) {
    const routed = resultBody(await client.call("nero_design_route", { task }));
    assert.equal(routed.figure_compiler.recommended, true, task);
    assert.equal(routed.figure_compiler.figure_type, figureType, task);
    assert.equal(routed.figure_compiler.business_family, businessFamily, task);
  }

  const ambiguousType = resultBody(await client.call("nero_design_route", {
    task: "NDT，把产能爬坡做成折线图和柱图"
  }));
  assert.equal(ambiguousType.figure_compiler.recommended, false);
  assert.equal(ambiguousType.figure_compiler.figure_type, null);
  assert.deepEqual(ambiguousType.figure_compiler.missing_inputs, ["figure_type"]);
  assert.deepEqual(ambiguousType.figure_compiler.ambiguous_candidates, ["bar", "line"]);
  assert.equal(ambiguousType.recommended_tools.includes("nero_design_compile_report_figure"), false);
  assert.equal(ambiguousType.rules.includes("references/report-figure-rendering.md"), false);

  const nativeHandoff = resultBody(await client.call("nero_design_route", {
    task: "NDT，把同业画像指标矩阵放进 PPT，要求可编辑原生对象"
  }));
  assert.equal(nativeHandoff.figure_compiler.recommended, false);
  assert.equal(nativeHandoff.figure_compiler.figure_type, "matrix");
  assert.equal(nativeHandoff.figure_compiler.profile, "ppt-16x9");
  assert.equal(nativeHandoff.figure_compiler.renderer, "office-native");
  assert.equal(nativeHandoff.figure_compiler.alternative_route, "ppt/formal-pptx");
  assert.equal(nativeHandoff.recommended_tools.includes("nero_design_compile_report_figure"), false);
  assert.equal(nativeHandoff.rules.includes("references/report-figure-rendering.md"), true);
  assert.equal(nativeHandoff.figure_compiler.missing_inputs_scope, "business_payload");
  assert.deepEqual(nativeHandoff.figure_compiler.auto_derived_fields, ["schema_version", "figure_id", "title", "profile", "renderer"]);

  for (const task of [
    "NDT，用摄影和插画做一张微信公众号封面",
    "NDT，生成一张抽象概念视觉背景图",
    "NDT，做一张文章头图",
    "NDT，做品牌主视觉",
    "NDT，设计文章题图",
    "NDT，做一张活动海报"
  ]) {
    const routed = resultBody(await client.call("nero_design_route", { task }));
    assert.equal(routed.figure_compiler.recommended, false, task);
    assert.equal(routed.figure_compiler.alternative_route, "ai-image-generation", task);
    assert.equal(routed.figure_compiler.tool, null, task);
    assert.equal(routed.recommended_tools.includes("nero_design_compile_report_figure"), false, task);
    assert.equal(routed.rules.includes("references/report-figure-rendering.md"), false, task);
  }

  for (const [task, figureType] of [
    ["NDT，不是封面，做一张产业链报告图", "flow"],
    ["NDT，不要做海报，做一张竞争格局参与者地图", "participant_map"],
    ["NDT，非封面，价值链利润分布做成柱图", "bar"]
  ]) {
    const routed = resultBody(await client.call("nero_design_route", { task }));
    assert.equal(routed.figure_compiler.recommended, true, task);
    assert.equal(routed.figure_compiler.figure_type, figureType, task);
    assert.notEqual(routed.route, "ai-image-generation", task);
    assert.equal(routed.rules.includes("references/report-figure-rendering.md"), true, task);
  }

  for (const verb of ["审查", "看看", "复核", "审阅", "诊断", "评价", "评估"]) {
    const task = `NDT，${verb}这张产业链图的信息层级和可读性`;
    const routed = resultBody(await client.call("nero_design_route", { task }));
    assert.equal(routed.figure_compiler.recommended, false, task);
    assert.equal(routed.figure_compiler.figure_type, "flow", task);
    assert.equal(routed.figure_compiler.alternative_route, "visual-audit", task);
    assert.equal(routed.recommended_tools.includes("nero_design_compile_report_figure"), false, task);
    assert.equal(routed.rules.includes("references/report-figure-rendering.md"), false, task);
  }

  const regenerateAfterCheck = resultBody(await client.call("nero_design_route", {
    task: "NDT，检查后重新生成产业链报告图"
  }));
  assert.equal(regenerateAfterCheck.figure_compiler.recommended, true);
  assert.equal(regenerateAfterCheck.figure_compiler.figure_type, "flow");
  assert.equal(regenerateAfterCheck.route, "visual-audit");
  assert.equal(regenerateAfterCheck.recommended_tools.includes("nero_design_compile_report_figure"), true);
  assert.equal(regenerateAfterCheck.rules.includes("references/report-figure-rendering.md"), true);

  for (const preferredRoute of ["case-library", "project-integration", "production-check", "visual-score", "visual-audit"]) {
    const routed = resultBody(await client.call("nero_design_route", {
      task: "NDT，重新生成产业链报告图",
      preferred_route: preferredRoute
    }));
    assert.equal(routed.figure_compiler.recommended, true, preferredRoute);
    assert.equal(routed.recommended_tools.includes("nero_design_compile_report_figure"), true, preferredRoute);
    assert.equal(routed.rules.includes("references/report-figure-rendering.md"), true, preferredRoute);
  }

  for (const task of [
    "NDT，做一套完整 PPT，包含产业链和竞争格局",
    "NDT，写一篇完整文章，其中包含产业链分析",
    "NDT，制作整份 Word 报告，包含价值链利润分布",
    "NDT，做完整的投行 PPT，包含产业链",
    "NDT，做全套文章，包含竞争格局",
    "NDT，做整套投行PPT，包含指标矩阵",
    "NDT，做整份报告，包含产能爬坡"
  ]) {
    const routed = resultBody(await client.call("nero_design_route", { task }));
    assert.equal(routed.figure_compiler.recommended, false, task);
    assert.equal(routed.figure_compiler.missing_inputs.includes("single_figure_scope"), true, task);
    assert.equal(routed.recommended_tools.includes("nero_design_compile_report_figure"), false, task);
    assert.equal(routed.rules.includes("references/report-figure-rendering.md"), false, task);
  }

  const scopedFigure = resultBody(await client.call("nero_design_route", {
    task: "NDT，做一套完整 PPT，其中一张报告图展示产业链传导逻辑"
  }));
  assert.equal(scopedFigure.figure_compiler.recommended, true);
  assert.equal(scopedFigure.figure_compiler.figure_type, "flow");
  assert.equal(scopedFigure.figure_compiler.profile, "ppt-16x9");
  assert.equal(scopedFigure.figure_compiler.renderer, "vector-svg");
  assert.equal(scopedFigure.rules.includes("references/report-figure-rendering.md"), true);

  for (const task of [
    "NDT，做整套投行 PPT，其中的一张竞争格局图做成指标矩阵",
    "NDT，做完整的 Word 报告，其中的单页用产业链图"
  ]) {
    const routed = resultBody(await client.call("nero_design_route", { task }));
    assert.equal(routed.figure_compiler.recommended, true, task);
    assert.equal(routed.rules.includes("references/report-figure-rendering.md"), true, task);
  }

  const listPreview = resultBody(await client.call("nero_design_compile_report_figure", {
    action: "list",
    execute: false
  }));
  assert.deepEqual(listPreview.command.slice(-1), ["list"]);

  assertToolError(
    await client.call("nero_design_compile_report_figure", { action: "list", project_root: projectRoot, execute: false }),
    /list does not accept project_root/
  );
  assertToolError(
    await client.call("nero_design_compile_report_figure", { action: "list", profile: "report-a4", execute: false }),
    /list does not accept profile/
  );
  assertToolError(
    await client.call("nero_design_compile_report_figure", {
      action: "validate",
      project_root: projectRoot,
      spec_path: specRelative,
      profile: "ppt-16x9",
      execute: false
    }),
    /validate does not accept compile-only profile or renderer overrides/
  );
  assertToolError(
    await client.call("nero_design_compile_report_figure", {
      action: "validate",
      project_root: projectRoot,
      spec_path: specRelative,
      renderer: "vector-svg",
      execute: false
    }),
    /validate does not accept compile-only profile or renderer overrides/
  );
  assertToolError(
    await client.call("nero_design_compile_report_figure", {
      action: "validate",
      project_root: projectRoot,
      spec_path: specRelative,
      execute: "true"
    }),
    /execute must be a boolean/
  );

  const validatePreview = resultBody(await client.call("nero_design_compile_report_figure", {
    action: "validate",
    project_root: projectRoot,
    spec_path: specRelative,
    execute: false
  }));
  assert.equal(validatePreview.project_root, projectRoot);
  assert.deepEqual(validatePreview.command.slice(-3), ["validate", "--spec", specPath]);

  const compilePreview = resultBody(await client.call("nero_design_compile_report_figure", {
    action: "compile",
    project_root: projectRoot,
    spec_path: specRelative,
    output_path: outputRelative,
    receipt_path: receiptRelative,
    profile: "report-a4",
    renderer: "vector-svg",
    execute: false
  }));
  assert.equal(compilePreview.project_root, projectRoot);
  assert.ok(compilePreview.command.includes(specPath));
  assert.ok(compilePreview.command.includes(outputPath));
  assert.ok(compilePreview.command.includes(receiptPath));
  assert.equal(fs.existsSync(outputPath), false, "execute=false must not write output");
  assert.equal(fs.existsSync(receiptPath), false, "execute=false must not write receipt");

  assertToolError(
    await client.call("nero_design_compile_report_figure", {
      action: "compile",
      project_root: projectRoot,
      spec_path: path.join("..", "outside-spec.json"),
      output_path: outputRelative,
      execute: false
    }),
    /spec_path must be contained in project_root/
  );
  assertToolError(
    await client.call("nero_design_compile_report_figure", {
      action: "compile",
      project_root: projectRoot,
      spec_path: specRelative,
      output_path: path.join("..", "escape.svg"),
      execute: false
    }),
    /output_path must be contained in project_root/
  );
  assertToolError(
    await client.call("nero_design_compile_report_figure", {
      action: "compile",
      project_root: projectRoot,
      spec_path: specRelative,
      output_path: outputRelative,
      receipt_path: path.join("..", "escape.receipt.json"),
      execute: false
    }),
    /receipt_path must be contained in project_root/
  );
  const outsideDirectory = path.join(tempRoot, "outside");
  const outsideLink = path.join(projectRoot, "outside-link");
  fs.mkdirSync(outsideDirectory, { recursive: true });
  fs.symlinkSync(outsideDirectory, outsideLink, "dir");
  assertToolError(
    await client.call("nero_design_compile_report_figure", {
      action: "compile",
      project_root: projectRoot,
      spec_path: specRelative,
      output_path: path.join("outside-link", "symlink-escape.svg"),
      execute: false
    }),
    /output_path resolves outside project_root/
  );
  assertToolError(
    await client.call("nero_design_compile_report_figure", {
      action: "compile",
      project_root: root,
      spec_path: path.relative(root, sourceSampleSpec),
      output_path: "forbidden.svg",
      execute: false
    }),
    /project_root must be outside the NDT canonical root/
  );

  const dryRunOutput = path.join(projectRoot, "exports", "dry-run-forbidden.svg");
  const safeDryRun = spawnSync(
    process.execPath,
    [serverPath, "--dry-run", "nero_design_compile_report_figure", JSON.stringify({
      action: "compile",
      project_root: projectRoot,
      spec_path: specRelative,
      output_path: path.relative(projectRoot, dryRunOutput)
    })],
    { cwd: root, encoding: "utf8" }
  );
  assert.equal(safeDryRun.status, 0, safeDryRun.stderr);
  assert.equal(JSON.parse(safeDryRun.stdout).execute, false);
  assert.equal(fs.existsSync(dryRunOutput), false, "--dry-run must force preview behavior");

  const dryRun = spawnSync(
    process.execPath,
    [serverPath, "--dry-run", "nero_design_compile_report_figure", JSON.stringify({
      action: "compile",
      project_root: projectRoot,
      spec_path: specRelative,
      output_path: path.relative(projectRoot, dryRunOutput),
      execute: true
    })],
    { cwd: root, encoding: "utf8" }
  );
  assert.notEqual(dryRun.status, 0, "--dry-run must reject execute=true");
  assert.match(dryRun.stderr, /--dry-run refuses execute=true/);
  assert.equal(fs.existsSync(dryRunOutput), false, "--dry-run must never write output");

  const executed = resultBody(await client.call("nero_design_compile_report_figure", {
    action: "compile",
    project_root: projectRoot,
    spec_path: specRelative,
    output_path: outputRelative,
    receipt_path: receiptRelative,
    profile: "report-a4",
    renderer: "vector-svg",
    execute: true
  }));
  assert.equal(executed.ok, true, executed.stderr || executed.stdout);
  assert.equal(fs.existsSync(outputPath), true, "MCP execute=true should write the SVG");
  assert.match(fs.readFileSync(outputPath, "utf8"), /<svg\b/);
  assert.equal(fs.existsSync(receiptPath), true, "MCP execute=true should write the receipt");
  assert.equal(JSON.parse(fs.readFileSync(receiptPath, "utf8")).figure_id, "sample-demand-to-delivery-flow");

  const generatedParent = path.join(tempRoot, "generated");
  const generatedName = "mcp-figure-project";
  const generatedProject = path.join(generatedParent, generatedName);
  fs.mkdirSync(generatedParent, { recursive: true });
  const generatorPreview = resultBody(await client.call("nero_design_generate_project", {
    mode: "new",
    route: "image-report",
    preset: "Figure Compiler",
    name: generatedName,
    out: generatedParent,
    execute: false
  }));
  assert.ok(generatorPreview.command.includes("--preset"));
  assert.ok(generatorPreview.command.includes("Figure Compiler"));
  assert.equal(fs.existsSync(generatedProject), false, "generator preview must not create a project");

  assertToolError(
    await client.call("nero_design_generate_project", {
      mode: "init",
      route: "image-report",
      project_root: projectRoot,
      preset: "Figure Compiler",
      execute: false
    }),
    /mode=init does not accept preset/
  );

  const generated = resultBody(await client.call("nero_design_generate_project", {
    mode: "new",
    route: "image-report",
    preset: "Figure Compiler",
    name: generatedName,
    out: generatedParent,
    execute: true
  }));
  assert.equal(generated.ok, true, generated.stderr || generated.stdout);
  const manifest = JSON.parse(fs.readFileSync(path.join(generatedProject, ".nero-design", "manifest.json"), "utf8"));
  assert.equal(manifest.preset, "report-figure-compiler");
  assert.equal(fs.existsSync(path.join(generatedProject, "compile-report-figure.mjs")), true);

  registryPaths.forEach((filePath, index) => {
    assert.deepEqual(fs.readFileSync(filePath), registryBefore[index], `MCP actions must not modify ${filePath}`);
  });
} finally {
  await client.close();
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log("report figure MCP protocol, path boundary, dry-run, and generator preset tests ok");
