// Stable MCP interface: business classification values are validated by each fresh NDT worker.
export const version = "2.5.0";

export const tools = [
  {
    name: "nero_design_route",
    description: "Classify a NERO design task and return the route, rules, template, and recommended tool calls.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        task: { type: "string", description: "User request or task summary." },
        task_mode: { type: "string", description: "Caller-selected operation; audit never recommends generation." },
        content_contract: { type: "string", description: "Select KAT only when the user or existing project contract requires it." },
        project_root: { type: "string", description: "Current project root; only declared registry locations are read." },
        engine_registry_path: { type: "string", description: "Explicit project PPTX engine registry path." },
        ppt_operation: { type: "string" },
        engine_resolution: {
          type: "object", additionalProperties: false,
          properties: { operation: { type: "string" }, engine_id: { type: "string" }, source_path: { type: "string" }, source_sha256: { type: "string" } },
          required: ["operation", "engine_id", "source_path", "source_sha256"]
        },
        preferred_route: { type: "string", description: "Optional explicit route override." },
        frontend_profile: {
          type: "string",
          description: "Optional frontend-ui profile. ai-app-ui adds NDT control, state, evidence, recovery and traceability rules without adding a new route."
        }
      },
      required: ["task"]
    }
  },
  {
    name: "nero_design_get_registry",
    description: "Read the live NERO Design Team Registry: assets, styles, cases, exact-version prompts, library counts and MCP server version.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        include_library: { type: "boolean", default: false, description: "Read assets, cases, multidimensional tags and style manifests with prompts from the same live Registry as the App." },
        style_id: { type: "string", description: "Resolve an exact style, including withdrawn historical records." },
        style_version: { type: "integer", minimum: 1 },
        recommended_only: { type: "boolean", default: false },
        search: { type: "string", description: "Search asset names, IDs, purposes and tags." },
        tags: { type: "object", additionalProperties: { type: "array", items: { type: "string" } }, description: "Visual facet filters; geometry/image-treatment are canonical, graphics/imageTreatment remain accepted query aliases." },
        use_case_tags: { type: "array", items: { type: "string" } },
        offset: { type: "integer", minimum: 0, default: 0 },
        limit: { type: "integer", minimum: 1, maximum: 1000, description: "Optional asset page size. Unfiltered legacy calls retain their existing summary response." },
        include_integrity_issues: {
          type: "boolean",
          default: true,
          description: "Include tracked open asset-integrity issues."
        }
      }
    }
  },
  {
    name: "nero_design_get_tokens",
    description: "Read NERO design tokens and token build-output status.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        token_sets: {
          type: "array",
          items: { type: "string" },
          description: "Token groups to read. Omit for all groups."
        },
        include_build_outputs: { type: "boolean", default: true }
      }
    }
  },
  {
    name: "nero_design_list_templates",
    description: "List local NERO templates, routes, package files, and QA checklists.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        route: { type: "string", description: "Optional route filter." }
      }
    }
  },
  {
    name: "nero_design_get_case_snapshot",
    description: "Read a lightweight GitHub case snapshot by repo, route, or candidate id.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        repo: { type: "string", description: "Repository in owner/repo form." },
        route: { type: "string" },
        candidate_id: { type: "string" },
        include_summary: { type: "boolean", default: true },
        include_file_index: { type: "boolean", default: false }
      }
    }
  },
  {
    name: "nero_design_import_github_case",
    description: "Import a lightweight GitHub case snapshot. Defaults to dry-run; execute=true runs the local importer.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        repo: { type: "string", description: "Repository URL or owner/repo." },
        route: { type: "string" },
        candidate_id: { type: "string" },
        execute: { type: "boolean", default: false }
      },
      required: ["repo", "route"]
    }
  },
  {
    name: "nero_design_build_tokens",
    description: "Build NERO design token outputs. Defaults to dry-run; execute=true runs build-tokens.mjs.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        execute: { type: "boolean", default: false }
      }
    }
  },
  {
    name: "nero_design_generate_project",
    description: "Generate a NERO design project from a local template, optionally with a registered preset, or initialize an existing project with .nero-design/manifest.json. Presets apply only to mode=new. Defaults to dry-run; execute=true creates files.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        mode: { type: "string", default: "new" },
        route: { type: "string" },
        name: { type: "string" },
        out: { type: "string" },
        project_root: { type: "string" },
        preset: { type: "string" },
        frontend_profile: { type: "string" },
        execute: { type: "boolean", default: false }
      },
      required: ["route"]
    }
  },
  {
    name: "nero_design_compile_report_figure",
    description: "List, validate, or compile a structured report Figure Spec through the central NDT CLI. Defaults to command preview; execute=true runs the local compiler.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        action: { type: "string" },
        project_root: { type: "string" },
        spec_path: { type: "string" },
        output_path: { type: "string" },
        receipt_path: { type: "string" },
        profile: { type: "string" },
        renderer: { type: "string" },
        execute: { type: "boolean", default: false }
      },
      required: ["action"],
      oneOf: [
        {
          "title": "List compiler capabilities",
          "properties": { "action": { "const": "list" } },
          "not": {
            "anyOf": [
              { "required": ["project_root"] },
              { "required": ["spec_path"] },
              { "required": ["output_path"] },
              { "required": ["receipt_path"] },
              { "required": ["profile"] },
              { "required": ["renderer"] }
            ]
          }
        },
        {
          "title": "Validate a project-local Figure Spec",
          "properties": { "action": { "const": "validate" } },
          "required": ["project_root", "spec_path"],
          "not": {
            "anyOf": [
              { "required": ["output_path"] },
              { "required": ["receipt_path"] },
              { "required": ["profile"] },
              { "required": ["renderer"] }
            ]
          }
        },
        {
          "title": "Compile a project-local Figure Spec",
          "properties": { "action": { "const": "compile" } },
          "required": ["project_root", "spec_path", "output_path"]
        }
      ]
    }
  },
  {
    name: "nero_design_visual_qa",
    description: "Run or preview the local visual QA script for a visual manifest.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        manifest_path: { type: "string" },
        execute: { type: "boolean", default: false }
      },
      required: ["manifest_path"]
    }
  },
  {
    name: "nero_design_score",
    description: "Run or preview the local visual scoring script for a score manifest.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        manifest_path: { type: "string" },
        execute: { type: "boolean", default: false }
      },
      required: ["manifest_path"]
    }
  },
  {
    name: "nero_design_production_check",
    description: "Run or preview the local production-check script for a production manifest.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        manifest_path: { type: "string" },
        execute: { type: "boolean", default: false }
      },
      required: ["manifest_path"]
    }
  }
];

export function validateValue(value, schema, label = "arguments") {
  const valid = schema.type === "object" ? value !== null && typeof value === "object" && !Array.isArray(value)
    : schema.type === "array" ? Array.isArray(value)
    : schema.type === "integer" ? Number.isInteger(value)
    : !schema.type || typeof value === schema.type;
  if (!valid) throw new Error(`${label} must be ${schema.type === "boolean" ? "a boolean" : schema.type}`);
  if (schema.enum && !schema.enum.includes(value)) throw new Error(`Unsupported ${label}: ${value}`);
  if (schema.minimum !== undefined && value < schema.minimum) throw new Error(`${label} below minimum`);
  if (schema.maximum !== undefined && value > schema.maximum) throw new Error(`${label} above maximum`);
  if (schema.type === "array") value.forEach((item, i) => validateValue(item, schema.items, `${label}[${i}]`));
  if (schema.type === "object") {
    for (const key of schema.required || []) if (!Object.hasOwn(value, key)) throw new Error(`Missing ${label}.${key}`);
    for (const [key, item] of Object.entries(value)) {
      const child = Object.hasOwn(schema.properties || {}, key) ? schema.properties[key] : undefined;
      if (child) validateValue(item, child, `${label}.${key}`);
      else if (schema.additionalProperties === false) throw new Error(`Unknown ${label}.${key}`);
      else if (typeof schema.additionalProperties === "object") validateValue(item, schema.additionalProperties, `${label}.${key}`);
    }
  }
}

export function validateTool(name, args) {
  const tool = tools.find(tool => tool.name === name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  validateValue(args, tool.inputSchema);
}
