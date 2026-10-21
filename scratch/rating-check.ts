import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const total = await prisma.animeRating.count();
  const users = await prisma.user.count();
  const animes = await prisma.anime.count();
  const grouped = await prisma.animeRating.groupBy({
    by: ["animeId"],
    _count: { _all: true },
    _avg: { score: true },
    orderBy: { _count: { animeId: "desc" } },
    take: 8,
  });
  console.log({ total, users, animes });
  for (const g of grouped) {
    const a = await prisma.anime.findUnique({ where: { id: g.animeId }, select: { title: true, score: true } });
    console.log(a?.title, "votes:", g._count._all, "avg:", g._avg.score?.toFixed(2), "anime.score:", a?.score);
  }
  await prisma.$disconnect();
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
