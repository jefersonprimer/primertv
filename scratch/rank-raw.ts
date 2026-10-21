import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  const t0 = Date.now();
  const rows = await prisma.$queryRaw<{ animeId: string; average: number | null; votes: number }[]>`
    SELECT
      "animeId" AS "animeId",
      (SUM("score" * "weight") / NULLIF(SUM("weight"), 0))::float8 AS "average",
      COUNT(*)::int AS "votes"
    FROM "AnimeRating"
    GROUP BY "animeId"
  `;
  console.log("rows:", rows.length, "ms:", Date.now() - t0);
  const sorted = rows.filter(r => r.average !== null).sort((a,b) => (b.average ?? 0) - (a.average ?? 0));
  console.log("top:", sorted.slice(0,3).map(r => `${r.average?.toFixed(2)} (${r.votes})`));
  console.log("bottom:", sorted.slice(-3).map(r => `${r.average?.toFixed(2)} (${r.votes})`));
  console.log("types:", typeof rows[0].average, typeof rows[0].votes);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
