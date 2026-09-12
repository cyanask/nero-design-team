import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const pptOperations = ["new_formal_pptx", "existing_pptx_edit", "strict_template_following", "google_slides", "inspection_or_repair"];

export async function resolvePptEngine(args, subroute) {
  const text = String(args.task || "").toLowerCase();
  // Editability describes the requested output, not an operation on an existing deck.
  const actionText = text.replace(/可编辑|editability|editable/g, "");
  const operation = args.ppt_operation || (
    /google slides/.test(text) ? "google_slides" :
    /template|模板|same layout|同样版式|follow this/.test(text) ? "strict_template_following" :
    /新建|新做|重新制作|\b(create|generate|build)\b/.test(actionText) ? "new_formal_pptx" :
    /existing|现有|已有|修改|编辑|\bedit\b/.test(actionText) ? "existing_pptx_edit" :
    subroute === "template-following" ? "strict_template_following" : "new_formal_pptx"
  );
  const pending = (reason, missing = []) => ({ status: "pending", operation, engine_id: null, reason, missing_inputs: missing, controller: "caller", execution: "none" });
  if (!pptOperations.includes(operation)) return pending("Unknown PPTX operation", ["ppt_operation"]);
  const supplied = args.engine_resolution;
  if (supplied && (!supplied.source_path || !supplied.source_sha256 || !supplied.engine_id || supplied.operation !== operation)) {
    return pending("Caller resolution requires matching operation, engine and registry source digest", ["engine_resolution"]);
  }
  const projectRoot = args.project_root ? path.resolve(args.project_root) : null;
  const declared = args.engine_registry_path || supplied?.source_path;
  if (!projectRoot && (!declared || !path.isAbsolute(declared))) {
    return pending("Project registry is not located", ["project_root or absolute engine_registry_path"]);
  }
  const candidates = declared ? [path.resolve(projectRoot || ".", declared)] : [
    "00_workbench/pptx-engine-registry.json", "pptx-engine-registry.json", ".nero-design/pptx-engine-registry.json"
  ].map((name) => path.join(projectRoot, name));
  try {
    const present = [];
    for (const file of candidates) {
      try { if ((await fs.stat(file)).isFile()) present.push(file); } catch { /* Report missing registry below. */ }
    }
    if (present.length !== 1) return pending("Registry is missing or ambiguous", ["engine_registry_path"]);
    const sourcePath = await fs.realpath(present[0]);
    const bytes = await fs.readFile(sourcePath);
    const digest = crypto.createHash("sha256").update(bytes).digest("hex");
    const registry = JSON.parse(bytes);
    const route = registry.operation_routes?.[operation];
    if (registry.schema_version !== 1 || registry.authority !== "machine_source" || !registry.registry_version ||
        typeof route?.engine_id !== "string" || !route.engine_id.trim() || !["default", "specialized", "explicit_only"].includes(route.mode)) {
      return pending("Invalid or missing operation route in project registry", ["operation_routes." + operation]);
    }
    if (registry.engines?.some((engine) => engine.engine_id === route.engine_id && engine.status === "disabled")) {
      return pending("Selected engine is disabled in the project registry", ["active project engine"]);
    }
    if (supplied && (await fs.realpath(path.resolve(projectRoot || ".", supplied.source_path)) !== sourcePath || supplied.source_sha256 !== digest || supplied.engine_id !== route.engine_id)) {
      return pending("Caller resolution is stale or mismatched", ["fresh engine_resolution"]);
    }
    return { status: "resolved", operation, engine_id: route.engine_id, mode: route.mode, source_path: sourcePath,
      source_sha256: digest, registry_version: registry.registry_version, reused_caller_resolution: Boolean(supplied),
      missing_inputs: [], controller: "caller", execution: "none" };
  } catch (error) {
    return pending(`Cannot read project registry: ${error.message}`, ["valid engine_registry_path"]);
  }
}
