import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function sourceFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(target)));
    else if (/\.(ts|tsx|mjs)$/.test(entry.name)) files.push(target);
  }
  return files;
}

describe("Core boundary", () => {
  it("does not import product, renderer, filesystem, browser, or local paths", async () => {
    const directory = path.resolve("src/core");
    const files = await sourceFiles(directory);
    const violations = [];
    const forbidden = [
      { label: "React", pattern: /from\s+["']react(?:\/[^"']*)?["']/i },
      { label: "Node API", pattern: /from\s+["']node:/i },
      { label: "product Pack", pattern: /packs\/|adapters\//i },
      { label: "browser API", pattern: /\b(window|document|navigator)\b/ },
      { label: "absolute path", pattern: new RegExp(["/", "Users", "/"].join("")) },
      { label: "product identity", pattern: /\b(NDT|NERO)\b/ }
    ];

    for (const file of files) {
      const source = await fs.readFile(file, "utf8");
      for (const rule of forbidden) {
        if (rule.pattern.test(source)) {
          violations.push(path.relative(process.cwd(), file) + ": " + rule.label);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
