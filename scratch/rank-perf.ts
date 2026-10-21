import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const t0 = Date.now();
  const grouped = await prisma.animeRating.groupBy({
    by: ["animeId"],
    _avg: { score: true },
    _count: { _all: true },
  });
  const t1 = Date.now();
  console.log("groups:", grouped.length, "ms:", t1 - t0);
  const t2 = Date.now();
  const users = await prisma.user.count();
  console.log("users ms:", Date.now() - t2);
  await prisma.$disconnect();
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
