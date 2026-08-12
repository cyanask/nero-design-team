export type WorkbenchRoute =
  | { space: "invalid"; path: string }
  | {
      space: "capabilities";
      page: "scenarios";
      scenarioId: string | null;
    }
  | {
      space: "capabilities";
      page: "solution";
      recipeId: string | null;
    }
  | {
      space: "capabilities";
      page: "assets";
      assetId: string | null;
    }
  | {
      space: "projects";
      projectId: string | null;
      tab: "overview" | "artifacts" | "review";
    };

const projectTabs = new Set(["overview", "artifacts", "review"]);

function safeDecode(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function parseWorkbenchHash(hash: string): WorkbenchRoute {
  const normalized = hash.replace(/^#/, "") || "/capabilities";
  const [pathname, query = ""] = normalized.split("?", 2);
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] === "projects") {
    if (parts.length > 2) return { space: "invalid", path: pathname };
    const requestedTab = new URLSearchParams(query).get("tab") ?? "overview";
    const tab = projectTabs.has(requestedTab)
      ? (requestedTab as "overview" | "artifacts" | "review")
      : "overview";
    return { space: "projects", projectId: safeDecode(parts[1]), tab };
  }

  if (parts[0] !== "capabilities") {
    return { space: "invalid", path: pathname };
  }

  if (!parts[1]) {
    return {
      space: "capabilities",
      page: "scenarios",
      scenarioId: null
    };
  }

  if (parts[1] === "scenarios") {
    if (parts.length > 3) return { space: "invalid", path: pathname };
    return { space: "capabilities", page: "scenarios", scenarioId: safeDecode(parts[2]) };
  }

  if (parts[1] === "solutions") {
    if (parts.length !== 3) return { space: "invalid", path: pathname };
    return { space: "capabilities", page: "solution", recipeId: safeDecode(parts[2]) };
  }

  if (parts[1] === "assets") {
    if (parts.length > 3) return { space: "invalid", path: pathname };
    return { space: "capabilities", page: "assets", assetId: safeDecode(parts[2]) };
  }

  // Backward compatibility for previously shared #/capabilities/:assetId links.
  if (parts.length !== 2) return { space: "invalid", path: pathname };
  return { space: "capabilities", page: "assets", assetId: safeDecode(parts[1]) };
}

export function scenarioHash(scenarioId?: string | null): string {
  return scenarioId
    ? "#/capabilities/scenarios/" + encodeURIComponent(scenarioId)
    : "#/capabilities";
}

export function solutionHash(recipeId: string): string {
  return "#/capabilities/solutions/" + encodeURIComponent(recipeId);
}

export function capabilityDirectoryHash(): string {
  return "#/capabilities/assets";
}

export function capabilityHash(assetId?: string | null): string {
  return assetId
    ? "#/capabilities/assets/" + encodeURIComponent(assetId)
    : capabilityDirectoryHash();
}

export function projectHash(
  projectId?: string | null,
  tab: "overview" | "artifacts" | "review" = "overview"
): string {
  if (!projectId) return "#/projects";
  return "#/projects/" + encodeURIComponent(projectId) + "?tab=" + tab;
}
