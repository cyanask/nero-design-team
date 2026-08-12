import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("public frontend package", () => {
  it("ships only synthetic public media and excludes private-only surfaces", async () => {
    const publicFiles = await fs.readdir(path.resolve("public"));
    expect(publicFiles.sort()).toEqual(["app-icon.svg", "demo"]);

    for (const privateOnly of ["native", "qa", "design-qa.md", ".nero-design"] ) {
      await expect(fs.stat(path.resolve(privateOnly))).rejects.toThrow();
    }

    const demo = JSON.parse(await fs.readFile("public/demo/snapshot.json", "utf8"));
    expect(demo.catalog.state.projection).toBe("demo_fixture");
    expect(demo.catalog.source.id).toBe("synthetic-demo");
    expect(demo.catalog.data.assets).toHaveLength(1);
    expect(demo.catalog.data.recipes).toHaveLength(1);
  });
});
