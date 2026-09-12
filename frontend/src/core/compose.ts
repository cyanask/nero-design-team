import type { CapabilityAssetVM, CapabilityLibraryVM, ReadEnvelope } from "./contracts";

export type CapabilityFilter = {
  search: string;
  categoryId: string | null;
  recipeId: string | null;
  previewOnly?: boolean;
  reuseState?: CapabilityAssetVM["reuseState"] | null;
};

export function hasUnresolvedReuseIssue(asset: CapabilityAssetVM): boolean {
  return asset.issueCodes.length > 0 || /mismatch|error|fail/i.test(asset.rawStatus ?? "");
}

// Legacy negative states override optimistic or absent normalized metadata.
export function effectiveReuseState(asset: CapabilityAssetVM): NonNullable<CapabilityAssetVM["reuseState"]> {
  if (asset.reuseState === "quarantined" || /quarantin|blocked|retired|禁止|隔离/i.test(asset.rawStatus ?? "")) return "quarantined";
  if (hasUnresolvedReuseIssue(asset) && !["reference_only", "placeholder"].includes(asset.reuseState ?? "")) return "unknown";
  return asset.reuseState ?? "unknown";
}

// Reveal a routed asset by clearing only filters that exclude it. Invalid IDs
// preserve the user's filters and are handled as an empty selection.
export function revealCapabilityFilters(library: CapabilityLibraryVM, filter: CapabilityFilter, requestedId: string | null): CapabilityFilter {
  const asset = library.assets.find((item) => item.id === requestedId);
  if (!asset || filterCapabilities(library, filter).some((item) => item.id === requestedId)) return filter;
  const single = { ...library, assets: [asset] };
  const next = { ...filter };
  for (const key of ["search", "categoryId", "recipeId", "previewOnly", "reuseState"] as const) {
    const isolated: CapabilityFilter = { search: "", categoryId: null, recipeId: null, [key]: filter[key] };
    if (!filterCapabilities(single, isolated).length) {
      if (key === "search") next.search = "";
      else if (key === "previewOnly") next.previewOnly = false;
      else next[key] = null;
    }
  }
  return next;
}

function searchableText(asset: CapabilityAssetVM): string {
  return [
    asset.id,
    asset.key,
    ...(asset.aliases ?? []),
    asset.name,
    asset.purpose,
    asset.useFor.join(" "),
    asset.rights ?? "",
    asset.rawStatus ?? "",
    asset.routes.join(" "),
    asset.members.join(" ")
  ]
    .join(" ")
    .toLocaleLowerCase();
}

export function filterCapabilities(
  library: CapabilityLibraryVM,
  filter: CapabilityFilter
): CapabilityAssetVM[] {
  const terms = filter.search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const recipe = filter.recipeId
    ? library.recipes.find((item) => item.id === filter.recipeId)
    : null;
  const recipeIds = recipe ? new Set(recipe.assetIds) : null;

  return library.assets.filter((asset) => {
    if (filter.reuseState && effectiveReuseState(asset) !== filter.reuseState) return false;
    if (filter.previewOnly && asset.preview.state !== "resolved") return false;
    if (filter.categoryId && asset.categoryId !== filter.categoryId) return false;
    if (recipeIds && !recipeIds.has(asset.id)) return false;
    const haystack = searchableText(asset);
    return terms.every((term) => haystack.includes(term));
  });
}

export function selectCapability(
  assets: CapabilityAssetVM[],
  requestedId: string | null
): CapabilityAssetVM | null {
  if (!assets.length) return null;
  if (requestedId === null) return assets[0];
  return assets.find((asset) => asset.id === requestedId) ?? null;
}

export function sourcePassport<T>(envelope: ReadEnvelope<T>): {
  authority: string;
  projection: string;
  observation: string;
  version: string;
} {
  return {
    authority: envelope.state.upstreamAuthority,
    projection: envelope.state.projection,
    observation: envelope.state.freshnessAtObservation,
    version: envelope.source.sourceVersion ?? "unknown"
  };
}
