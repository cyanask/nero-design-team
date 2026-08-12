export type ApplicationScenarioId = string;
export type ApplicationRoleId = string;

export type ApplicationScenario = {
  id: ApplicationScenarioId;
  label: string;
  description: string;
  styleIntent: string;
  boundary: string;
  /** Optional catalog asset reference chosen by the provider for the scenario index. */
  representativeAssetId?: string;
};

/** Pack-authored guidance. Recipe assets remain owned by CapabilityLibraryVM. */
export type ApplicationSolution = {
  recipeId: string;
  label: string;
  summary: string;
  primaryScenarioId: ApplicationScenarioId;
  supportingScenarioIds: readonly ApplicationScenarioId[];
  avoidScenarioIds: readonly ApplicationScenarioId[];
  directDeliverables: readonly string[];
  downstreamTargets: readonly string[];
  boundary: string;
};

export type ApplicationRoleDefinition = {
  id: ApplicationRoleId;
  label: string;
  description: string;
  selectionGuidance: string;
};

export type CapabilityCategoryRoleMapping = {
  categoryId: string;
  categoryLabel: string;
  roleId: ApplicationRoleId;
};

export type ApplicationScenarioCatalog = {
  contractVersion: "workbench.application-scenarios.v1";
  scenarios: readonly ApplicationScenario[];
  solutions: readonly ApplicationSolution[];
  roles: readonly ApplicationRoleDefinition[];
  categoryRoles: readonly CapabilityCategoryRoleMapping[];
};

export type ApplicationScenarioCatalogReference = {
  recipeIds?: readonly string[];
  categoryIds?: readonly string[];
};

export type ApplicationScenarioValidationIssue = {
  code:
    | "invalid_contract_version"
    | "duplicate_scenario_id"
    | "duplicate_solution_id"
    | "duplicate_role_id"
    | "duplicate_category_id"
    | "missing_text"
    | "unknown_scenario_reference"
    | "duplicate_scenario_reference"
    | "overlapping_scenario_reference"
    | "missing_deliverable_guidance"
    | "unknown_category_role"
    | "missing_primary_solution"
    | "missing_recipe_solution"
    | "unknown_recipe_solution"
    | "missing_category_role_mapping"
    | "unknown_category_role_mapping";
  path: string;
  message: string;
};

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function checkRequiredText(
  issues: ApplicationScenarioValidationIssue[],
  path: string,
  values: ReadonlyArray<readonly [field: string, value: string]>
): void {
  for (const [field, value] of values) {
    if (isBlank(value)) {
      issues.push({
        code: "missing_text",
        path: `${path}.${field}`,
        message: `${field} must not be blank`
      });
    }
  }
}

function checkUniqueId(
  issues: ApplicationScenarioValidationIssue[],
  seen: Set<string>,
  value: string,
  path: string,
  code:
    | "duplicate_scenario_id"
    | "duplicate_solution_id"
    | "duplicate_role_id"
    | "duplicate_category_id"
): void {
  if (seen.has(value)) {
    issues.push({ code, path, message: `Duplicate ID: ${value}` });
  }
  seen.add(value);
}

function checkScenarioReferenceArray(
  issues: ApplicationScenarioValidationIssue[],
  scenarioIds: Set<string>,
  values: readonly string[],
  path: string
): void {
  const seen = new Set<string>();
  for (const [index, value] of values.entries()) {
    const valuePath = `${path}[${index}]`;
    if (isBlank(value)) {
      issues.push({ code: "missing_text", path: valuePath, message: "Scenario ID must not be blank" });
      continue;
    }
    if (seen.has(value)) {
      issues.push({
        code: "duplicate_scenario_reference",
        path: valuePath,
        message: `Duplicate scenario reference: ${value}`
      });
    }
    seen.add(value);
    if (!scenarioIds.has(value)) {
      issues.push({
        code: "unknown_scenario_reference",
        path: valuePath,
        message: `Unknown scenario reference: ${value}`
      });
    }
  }
}

function checkGuidanceArray(
  issues: ApplicationScenarioValidationIssue[],
  values: readonly string[],
  path: string
): void {
  for (const [index, value] of values.entries()) {
    if (isBlank(value)) {
      issues.push({
        code: "missing_text",
        path: `${path}[${index}]`,
        message: "Deliverable guidance must not be blank"
      });
    }
  }
}

export function validateApplicationScenarioCatalog(
  catalog: ApplicationScenarioCatalog,
  reference: ApplicationScenarioCatalogReference = {}
): ApplicationScenarioValidationIssue[] {
  const issues: ApplicationScenarioValidationIssue[] = [];
  if (catalog.contractVersion !== "workbench.application-scenarios.v1") {
    issues.push({
      code: "invalid_contract_version",
      path: "contractVersion",
      message: `Unsupported contract version: ${catalog.contractVersion}`
    });
  }

  const scenarioIds = new Set<string>();
  for (const [index, scenario] of catalog.scenarios.entries()) {
    const path = `scenarios[${index}]`;
    checkUniqueId(issues, scenarioIds, scenario.id, `${path}.id`, "duplicate_scenario_id");
    checkRequiredText(issues, path, [
      ["id", scenario.id],
      ["label", scenario.label],
      ["description", scenario.description],
      ["styleIntent", scenario.styleIntent],
      ["boundary", scenario.boundary]
    ]);
  }

  const solutionIds = new Set<string>();
  const primaryScenarioIds = new Set<string>();
  for (const [index, solution] of catalog.solutions.entries()) {
    const path = `solutions[${index}]`;
    checkUniqueId(issues, solutionIds, solution.recipeId, `${path}.recipeId`, "duplicate_solution_id");
    checkRequiredText(issues, path, [
      ["recipeId", solution.recipeId],
      ["label", solution.label],
      ["summary", solution.summary],
      ["primaryScenarioId", solution.primaryScenarioId],
      ["boundary", solution.boundary]
    ]);

    if (!isBlank(solution.primaryScenarioId)) {
      primaryScenarioIds.add(solution.primaryScenarioId);
      if (!scenarioIds.has(solution.primaryScenarioId)) {
        issues.push({
          code: "unknown_scenario_reference",
          path: `${path}.primaryScenarioId`,
          message: `Unknown scenario reference: ${solution.primaryScenarioId}`
        });
      }
    }

    checkScenarioReferenceArray(
      issues,
      scenarioIds,
      solution.supportingScenarioIds,
      `${path}.supportingScenarioIds`
    );
    checkScenarioReferenceArray(
      issues,
      scenarioIds,
      solution.avoidScenarioIds,
      `${path}.avoidScenarioIds`
    );

    const supporting = new Set(solution.supportingScenarioIds);
    const avoid = new Set(solution.avoidScenarioIds);
    if (
      supporting.has(solution.primaryScenarioId) ||
      avoid.has(solution.primaryScenarioId) ||
      [...supporting].some((scenarioId) => avoid.has(scenarioId))
    ) {
      issues.push({
        code: "overlapping_scenario_reference",
        path,
        message: `Scenario roles overlap for solution: ${solution.recipeId}`
      });
    }

    if (solution.directDeliverables.length === 0 && solution.downstreamTargets.length === 0) {
      issues.push({
        code: "missing_deliverable_guidance",
        path,
        message: `Solution ${solution.recipeId} needs direct deliverables or downstream targets`
      });
    }
    checkGuidanceArray(issues, solution.directDeliverables, `${path}.directDeliverables`);
    checkGuidanceArray(issues, solution.downstreamTargets, `${path}.downstreamTargets`);
  }

  if (reference.recipeIds) {
    const knownRecipeIds = new Set(reference.recipeIds);
    for (const recipeId of knownRecipeIds) {
      if (!solutionIds.has(recipeId)) {
        issues.push({
          code: "missing_recipe_solution",
          path: "solutions",
          message: `Recipe has no application solution: ${recipeId}`
        });
      }
    }
    for (const recipeId of solutionIds) {
      if (!knownRecipeIds.has(recipeId)) {
        issues.push({
          code: "unknown_recipe_solution",
          path: "solutions",
          message: `Application solution references an unknown recipe: ${recipeId}`
        });
      }
    }
  }

  const roleIds = new Set<string>();
  for (const [index, role] of catalog.roles.entries()) {
    const path = `roles[${index}]`;
    checkUniqueId(issues, roleIds, role.id, `${path}.id`, "duplicate_role_id");
    checkRequiredText(issues, path, [
      ["id", role.id],
      ["label", role.label],
      ["description", role.description],
      ["selectionGuidance", role.selectionGuidance]
    ]);
  }

  const categoryIds = new Set<string>();
  for (const [index, mapping] of catalog.categoryRoles.entries()) {
    const path = `categoryRoles[${index}]`;
    checkUniqueId(issues, categoryIds, mapping.categoryId, `${path}.categoryId`, "duplicate_category_id");
    checkRequiredText(issues, path, [
      ["categoryId", mapping.categoryId],
      ["categoryLabel", mapping.categoryLabel],
      ["roleId", mapping.roleId]
    ]);
    if (!isBlank(mapping.roleId) && !roleIds.has(mapping.roleId)) {
      issues.push({
        code: "unknown_category_role",
        path: `${path}.roleId`,
        message: `Unknown role ID: ${mapping.roleId}`
      });
    }
  }


  if (reference.categoryIds) {
    const knownCategoryIds = new Set(reference.categoryIds);
    for (const categoryId of knownCategoryIds) {
      if (!categoryIds.has(categoryId)) {
        issues.push({
          code: "missing_category_role_mapping",
          path: "categoryRoles",
          message: `Capability category has no role mapping: ${categoryId}`
        });
      }
    }
    for (const categoryId of categoryIds) {
      if (!knownCategoryIds.has(categoryId)) {
        issues.push({
          code: "unknown_category_role_mapping",
          path: "categoryRoles",
          message: `Role mapping references an unknown capability category: ${categoryId}`
        });
      }
    }
  }

  for (const [index, scenario] of catalog.scenarios.entries()) {
    if (!primaryScenarioIds.has(scenario.id)) {
      issues.push({
        code: "missing_primary_solution",
        path: `scenarios[${index}].id`,
        message: `Scenario ${scenario.id} has no primary solution`
      });
    }
  }

  return issues;
}
