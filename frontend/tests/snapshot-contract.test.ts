import { describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";
import demoSnapshot from "../public/demo/snapshot.json";
import schema from "../schemas/workbench-snapshot-v1.schema.json";
import {
  isWorkbenchSnapshot,
  validateWorkbenchSnapshot
} from "../src/core/guards";

describe("snapshot contract", () => {
  it("accepts the same valid fixture named by the JSON Schema", () => {
    const validateSchema = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
    expect(schema.$id).toBe("workbench.snapshot.v1");
    expect(schema.required).toEqual([
      "schemaVersion",
      "snapshotId",
      "snapshotFingerprint",
      "catalog",
      "projects"
    ]);
    expect(isWorkbenchSnapshot(demoSnapshot)).toBe(true);
    expect(validateWorkbenchSnapshot(demoSnapshot)).toEqual([]);
    expect(validateSchema(demoSnapshot), JSON.stringify(validateSchema.errors)).toBe(true);
  });

  it("rejects a fixture missing a schema-required root field", () => {
    const validateSchema = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
    const invalid = structuredClone(demoSnapshot) as Record<string, unknown>;
    delete invalid.snapshotFingerprint;
    expect(schema.required).toContain("snapshotFingerprint");
    expect(isWorkbenchSnapshot(invalid)).toBe(false);
    expect(validateSchema(invalid)).toBe(false);
  });

  it("rejects unknown fixed-contract root fields", () => {
    const invalid = {
      ...structuredClone(demoSnapshot),
      raw: { unsafe: true }
    };
    expect(schema.additionalProperties).toBe(false);
    expect(validateWorkbenchSnapshot(invalid).some((issue) => issue.message.includes("unknown field"))).toBe(true);
  });
});
