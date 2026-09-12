// Shared applicability boundary for routing, production checks and scoring.
export const contentContracts = ["standard", "kat-presentation"];

export function usesKatPresentation(...contexts) {
  for (const context of contexts) {
    if (context?.content_contract !== undefined && !contentContracts.includes(context.content_contract)) {
      throw new Error(`Unknown content_contract: ${context.content_contract}`);
    }
  }
  return contexts.some(context => context && (
    context.content_contract === "kat-presentation" || context.presentation_chain_required === true ||
    [context.content_owner, context.source_text_owner].some(owner => String(owner || "").toLowerCase() === "kat") ||
    context.template === "presentation-production-chain" ||
    // Existing KAT handoff fields remain selection evidence; false never waives them.
    ["kat_handoff_brief", "quality_core_receipt", "presentation_production_packet",
      "presentation_handoff_contract", "slide_claim_map", "content_freeze_gate"].some(field => Boolean(context[field]))
  ));
}
