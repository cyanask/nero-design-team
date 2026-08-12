import type { CapabilityAssetVM, CapabilityLibraryVM, ReadEnvelope } from "./contracts";

export type CapabilityFilter = {
  search: string;
  categoryId: string | null;
  recipeId: string | null;
  previewOnly?: boolean;
};

function searchableText(asset: CapabilityAssetVM): string {
  return [
    asset.id,
    asset.key,
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
  const query = filter.search.trim().toLocaleLowerCase();
  const recipe = filter.recipeId
    ? library.recipes.find((item) => item.id === filter.recipeId)
    : null;
  const recipeIds = recipe ? new Set(recipe.assetIds) : null;

  return library.assets.filter((asset) => {
    if (filter.previewOnly && asset.preview.state !== "resolved") return false;
    if (filter.categoryId && asset.categoryId !== filter.categoryId) return false;
    if (recipeIds && !recipeIds.has(asset.id)) return false;
    return !query || searchableText(asset).includes(query);
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
