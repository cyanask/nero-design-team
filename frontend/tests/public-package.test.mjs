import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("public frontend package", () => {
  it("ships synthetic demo media and explicitly public library previews only", async () => {
    const publicFiles = await fs.readdir(path.resolve("public"));
    expect(publicFiles.sort()).toEqual(["app-icon.svg", "brand-symbol.svg", "demo", "library-previews"]);
    const previews = await fs.readdir(path.resolve("public/library-previews"));
    expect(previews).toHaveLength(12);
    expect(previews.every((file) => /^ndt-(tok|tpl)-\d{3}\.png$/.test(file))).toBe(true);

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
    expect(baseCss).not.toContain("min-width: 900px");
    expect(shellCss).toMatch(/@media \(max-width: 720px\)[\s\S]*grid-template-rows: auto minmax\(0, 1fr\)/);
  });
});
