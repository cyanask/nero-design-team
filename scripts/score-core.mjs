import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { usesKatPresentation } from "./presentation-contract.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function evaluateScore(manifest, context = manifest) {
  const scorecardName = manifest.scorecard || "visual-scorecard.json";
  if (typeof scorecardName !== "string" || path.basename(scorecardName) !== scorecardName || !scorecardName.endsWith(".json")) {
    throw new Error("scorecard must be a JSON file name from the NDT scorecards directory");
  }
  let scorecard;
  try {
    scorecard = JSON.parse(await fs.readFile(path.join(root, "scorecards", scorecardName), "utf8"));
  } catch (error) {
    throw new Error(`Unknown or invalid scorecard: ${scorecardName}`, { cause: error });
  }
  const katPresentation = usesKatPresentation(context);
  const notApplicable = [];
  const rows = scorecard.criteria.flatMap((criterion) => {
    let applicable = true;
    switch (criterion.applies_when) {
      case undefined: break;
      case "kat_presentation": applicable = katPresentation; break;
      case "charts_present": applicable = context.has_charts !== false; break;
      case "ai_image_used": applicable = context.gpt_image_2_used !== false; break;
      default: throw new Error(`Unknown score applicability: ${criterion.applies_when}`);
    }
    if (!applicable) {
      notApplicable.push({ id: criterion.id, weight: criterion.weight, reason: criterion.applies_when });
      return [];
    }
    const score = manifest.scores?.[criterion.id];
    if (!Number.isFinite(score)) throw new Error(`Missing numeric score for ${criterion.id}`);
    if (score < 0 || score > criterion.weight) {
      throw new Error(`Score for ${criterion.id} must be between 0 and ${criterion.weight}`);
    }
    return [{ id: criterion.id, label: criterion.label, score, weight: criterion.weight }];
  });
  const applicablePoints = rows.reduce((sum, row) => sum + row.weight, 0);
  if (!(applicablePoints > 0)) throw new Error("Scorecard has no applicable criteria");
  const rawTotal = rows.reduce((sum, row) => sum + row.score, 0);
  const normalized = rawTotal / applicablePoints * scorecard.total_points;
  const total = Number(normalized.toFixed(2));
  const rating = normalized >= scorecard.pass_threshold ? "pass" : normalized >= scorecard.review_threshold ? "review" : "fail";
  return { scorecardName, scorecard, rows, total, rating, raw_total: rawTotal,
    applicable_points: applicablePoints, not_applicable: notApplicable };
}
