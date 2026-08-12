import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import demo from "../public/demo/snapshot.json";
import type { WorkbenchSnapshot } from "../src/core/contracts";
import { CapabilityLibrary } from "../src/adapters/react/CapabilityLibrary";

const snapshot = demo as unknown as WorkbenchSnapshot;

describe("capability source passport", () => {
  it("renders the public source passport through the capability library seam", () => {
    const html = renderToStaticMarkup(
      <CapabilityLibrary envelope={snapshot.catalog} requestedAssetId={null} />
    );

    expect(html).toContain("来源与版本");
    expect(html).toContain('aria-label="来源护照"');
    expect(html).toContain("参考数据");
    expect(html).toContain("合成演示数据");
    expect(html).toContain("新鲜度未知");
  });
});
