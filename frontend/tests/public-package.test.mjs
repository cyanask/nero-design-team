import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("public frontend package", () => {
  it("ships system icons and synthetic fixtures without library previews", async () => {
    const publicFiles = await fs.readdir(path.resolve("public"));
    expect(publicFiles.sort()).toEqual(["app-icon.svg", "brand-symbol.svg", "demo"]);
    await expect(fs.stat(path.resolve("public/library-previews"))).rejects.toThrow();

    for (const privateOnly of ["native", "qa", "design-qa.md", ".nero-design"] ) {
      await expect(fs.stat(path.resolve(privateOnly))).rejects.toThrow();
    }

    const demo = JSON.parse(await fs.readFile("public/demo/snapshot.json", "utf8"));
    expect(demo.catalog.state.projection).toBe("demo_fixture");
    expect(demo.catalog.source.id).toBe("synthetic-demo");
    expect(demo.catalog.data.assets).toHaveLength(1);
    expect(demo.catalog.data.recipes).toHaveLength(1);

    const [baseCss, shellCss] = await Promise.all([
      fs.readFile("src/packs/ndt/styles/base.css", "utf8"),
      fs.readFile("src/packs/ndt/styles/shell.css", "utf8")
    ]);
    expect(baseCss).toContain("min-width: 900px");
    expect(shellCss).not.toMatch(/@media \(max-width: (?:[0-8]\d\d|\d{1,2})px\)/);
    const styleRoot = path.resolve("src/packs/ndt/styles");
    for (const file of await fs.readdir(styleRoot)) {
      if (!file.endsWith(".css")) continue;
      const css = await fs.readFile(path.join(styleRoot, file), "utf8");
      for (const match of css.matchAll(/@media\s*\(max-width:\s*(\d+)px\)/g)) {
        expect(Number(match[1]), `${file} contains a mobile breakpoint`).toBeGreaterThanOrEqual(900);
      }
    }
  });
});
