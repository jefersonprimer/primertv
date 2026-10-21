import "dotenv/config";
import { prisma } from "@/lib/prisma";
async function main() {
  const rows = await prisma.$queryRaw<{ slug: string; title: string; votes: number }[]>`
    SELECT a."slug" AS "slug", a."title" AS "title", COUNT(r.id)::int AS "votes"
    FROM "Anime" a JOIN "AnimeRating" r ON r."animeId" = a.id
    GROUP BY a."slug", a."title"
    ORDER BY COUNT(r.id) DESC LIMIT 5
  `;
  console.log(rows);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
