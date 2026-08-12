import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const virtualId = "virtual:workbench-snapshot";
const resolvedVirtualId = "\0virtual:workbench-snapshot";

function snapshotModule(mode) {
  const isDemo = mode === "demo" || mode === "test";
  const target = isDemo
    ? path.resolve("public/demo/snapshot.json")
    : path.resolve(".local/generated/snapshot.json");

  return {
    name: "workbench-snapshot",
    resolveId(id) {
      return id === virtualId ? resolvedVirtualId : null;
    },
    load(id) {
      if (id !== resolvedVirtualId) return null;
      if (!fs.existsSync(target)) {
        throw new Error(
          "SOURCE_MISSING: " +
            path.relative(process.cwd(), target) +
            ". Run snapshot:sync or use explicit demo mode."
        );
      }
      const source = fs.readFileSync(target, "utf8");
      JSON.parse(source);
      return "export default " + source + ";";
    }
  };
}

export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [snapshotModule(mode), react()],
  build: {
    outDir: mode === "demo" ? "dist-demo" : "dist-public",
    emptyOutDir: true
  }
}));
