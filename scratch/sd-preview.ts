import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const all = await prisma.animeRating.findMany({ select: { animeId: true, score: true } });
  const byAnime = new Map<string, number[]>();
  for (const r of all) {
    const arr = byAnime.get(r.animeId) ?? [];
    arr.push(r.score);
    byAnime.set(r.animeId, arr);
  }
  const sds: number[] = [];
  for (const [, scores] of byAnime) {
    const n = scores.length;
    const mean = scores.reduce((s, v) => s + v, 0) / n;
    const sd = Math.sqrt(scores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n);
    sds.push(sd);
  }
  sds.sort((a, b) => a - b);
  console.log("n animes:", sds.length, "min:", sds[0].toFixed(2), "median:", sds[Math.floor(sds.length/2)].toFixed(2), "max:", sds[sds.length-1].toFixed(2));
  console.log(sds.map((s) => s.toFixed(2)).join(" "));
  await prisma.$disconnect();
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
