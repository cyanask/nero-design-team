import fs from "node:fs/promises";
import path from "node:path";
import { evaluateScore } from "./score-core.mjs";

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function usage() {
  return "Usage: node scripts/score-visual.mjs <score-manifest.json>";
}

async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) {
    throw new Error(usage());
  }

  const manifest = await readJson(path.resolve(manifestPath));
  const { scorecardName, scorecard, rows, total, rating, applicable_points, not_applicable } = await evaluateScore(manifest);
  console.log(`Artifact: ${manifest.artifact || "unnamed"}`);
  console.log(`Route: ${manifest.route || "unknown"}`);
  console.log(`Scorecard: ${scorecardName}`);
  console.log(`Score: ${total}/${scorecard.total_points}`);
  console.log(`Rating: ${rating} - ${scorecard.ratings[rating]}`);
  console.log(`Applicable points: ${applicable_points}/${scorecard.total_points}; score normalized to ${scorecard.total_points}`);
  for (const row of not_applicable) console.log(`NOT APPLICABLE ${row.id}: ${row.reason}`);
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
