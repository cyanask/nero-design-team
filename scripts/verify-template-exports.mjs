import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validationDir = path.join(root, "validation");
const reportPath = path.join(validationDir, "real-export-validation.json");

const templates = [
  {
    route: "frontend-ui",
    dir: "templates/frontend-dashboard",
    install: ["npm", "install"],
    command: ["npm", "run", "build"],
    expected: "dist"
  },
  {
    route: "image-report",
    dir: "templates/report-card-image",
    install: ["npm", "install"],
    command: ["npm", "run", "render"],
    expected: "out/report-card.png"
  },
  {
    route: "ppt",
    dir: "templates/pptx-deck",
    install: ["npm", "install"],
    command: ["npm", "run", "build"],
    expected: "out/nero-research-template.pptx"
  },
  {
    route: "short-video",
    dir: "templates/remotion-short-video",
    install: ["npm", "install"],
    command: ["npm", "run", "still"],
    expected: "out/nero-signal-frame.png"
  }
];

function commandExists(command) {
  const result = spawnSync("zsh", ["-lc", `command -v ${command}`], {
    cwd: root,
    encoding: "utf8"
  });
  return result.status === 0;
}

function run(command, cwd) {
  const result = spawnSync(command[0], command.slice(1), {
    cwd,
    encoding: "utf8"
  });
  return {
    status: result.status,
    stdout: result.stdout?.trim() || "",
    stderr: result.stderr?.trim() || ""
  };
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await fs.mkdir(validationDir, { recursive: true });
  const hasNpm = commandExists("npm");
  const results = [];

  for (const template of templates) {
    const templateDir = path.join(root, template.dir);
    const result = {
      route: template.route,
      template_dir: templateDir,
      attempted_install: false,
      attempted_export: false,
      status: "blocked",
      reason: "",
      expected_output: path.join(templateDir, template.expected)
    };

    if (!hasNpm) {
      result.reason = "npm is not available in the current environment; local dependencies cannot be installed.";
      results.push(result);
      continue;
    }

    result.attempted_install = true;
    const install = run(template.install, templateDir);
    if (install.status !== 0) {
      result.status = "failed";
      result.reason = install.stderr || install.stdout || "npm install failed";
      results.push(result);
      continue;
    }

    result.attempted_export = true;
    const command = run(template.command, templateDir);
    if (command.status !== 0) {
      result.status = "failed";
      result.reason = command.stderr || command.stdout || `${template.command.join(" ")} failed`;
      results.push(result);
      continue;
    }

    const outputExists = await exists(result.expected_output);
    result.status = outputExists ? "pass" : "failed";
    result.reason = outputExists ? "Expected output exists." : "Command completed but expected output was not found.";
    results.push(result);
  }

  const report = {
    version: "1.0.0",
    generated_at: new Date().toISOString(),
    package_manager: hasNpm ? "npm" : null,
    summary: {
      pass: results.filter((item) => item.status === "pass").length,
      failed: results.filter((item) => item.status === "failed").length,
      blocked: results.filter((item) => item.status === "blocked").length
    },
    results
  };

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Wrote export validation report to ${reportPath}`);
  console.log(`pass=${report.summary.pass} failed=${report.summary.failed} blocked=${report.summary.blocked}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
