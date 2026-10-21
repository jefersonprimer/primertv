import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  for (let i = 0; i < 4; i++) {
    const t0 = Date.now();
    await prisma.animeRating.groupBy({
      by: ["animeId"],
      _avg: { score: true },
      _count: { _all: true },
    });
    console.log("run", i, "ms:", Date.now() - t0);
  }
  await prisma.$disconnect();
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
