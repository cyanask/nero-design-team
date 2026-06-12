import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scorecardPath = path.join(root, "scorecards", "visual-scorecard.json");

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function usage() {
  return "Usage: node scripts/score-visual.mjs <score-manifest.json>";
}

function rate(total, scorecard) {
  if (total >= scorecard.pass_threshold) return "pass";
  if (total >= scorecard.review_threshold) return "review";
  return "fail";
}

async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) {
    throw new Error(usage());
  }

  const scorecard = await readJson(scorecardPath);
  const manifest = await readJson(path.resolve(manifestPath));
  const scores = manifest.scores || {};
  const rows = [];
  let total = 0;

  for (const criterion of scorecard.criteria) {
    const raw = scores[criterion.id];
    if (!Number.isFinite(raw)) {
      throw new Error(`Missing numeric score for ${criterion.id}`);
    }
    if (raw < 0 || raw > criterion.weight) {
      throw new Error(`Score for ${criterion.id} must be between 0 and ${criterion.weight}`);
    }
    total += raw;
    rows.push({
      id: criterion.id,
      label: criterion.label,
      score: raw,
      weight: criterion.weight
    });
  }

  const rating = rate(total, scorecard);
  console.log(`Artifact: ${manifest.artifact || "unnamed"}`);
  console.log(`Route: ${manifest.route || "unknown"}`);
  console.log(`Score: ${total}/${scorecard.total_points}`);
  console.log(`Rating: ${rating} - ${scorecard.ratings[rating]}`);
  for (const row of rows) {
    console.log(`${row.id}: ${row.score}/${row.weight} ${row.label}`);
  }
  for (const note of manifest.notes || []) {
    console.log(`Note: ${note}`);
  }

  if (rating === "fail") {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
