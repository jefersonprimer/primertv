import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const grouped = await prisma.animeRating.groupBy({
    by: ["animeId"],
    _avg: { score: true },
    _count: { _all: true },
  });
  const sorted = [...grouped].sort((a, b) => (b._avg.score ?? 0) - (a._avg.score ?? 0));

  const sample = ["Bleach", "Otome Game Sekai wa Mob ni Kibishii Sekai desu"];
  for (const title of sample) {
    const anime = await prisma.anime.findFirst({ where: { title: { contains: title } }, select: { id: true, title: true } });
    if (!anime) continue;
    const ratings = await prisma.animeRating.findMany({ where: { animeId: anime.id }, select: { score: true, weight: true } });
    const n = ratings.length;
    const mean = ratings.reduce((s, r) => s + r.score, 0) / n;
    const variance = ratings.reduce((s, r) => s + Math.pow(r.score - mean, 2), 0) / n;
    const sd = Math.sqrt(variance);
    const rank = sorted.findIndex((g) => g.animeId === anime.id) + 1;
    const counts: Record<number, number> = {};
    for (const r of ratings) counts[r.score] = (counts[r.score] || 0) + 1;
    console.log(anime.title, { votes: n, mean: mean.toFixed(2), sd: sd.toFixed(2), rank, of: sorted.length, counts });
    // weighted
    let ws = 0, wv = 0;
    for (const r of ratings) { ws += r.score * (r.weight ?? 1); wv += (r.weight ?? 1); }
    console.log("  weighted avg:", (ws / wv).toFixed(2), "weightedVotes:", wv.toFixed(1));
  }
  console.log("top 5:", sorted.slice(0, 5).map((g) => `${g.animeId.slice(0,6)} ${g._avg.score?.toFixed(2)} (${g._count._all})`));
  console.log("bottom 3:", sorted.slice(-3).map((g) => `${g._avg.score?.toFixed(2)} (${g._count._all})`));
  await prisma.$disconnect();
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
