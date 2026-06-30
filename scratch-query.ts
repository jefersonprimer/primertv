import "dotenv/config";
import { prisma } from "./lib/prisma";
import { parseSeasonAndYear } from "./lib/seasons";

async function main() {
  try {
    const animes = await prisma.anime.findMany({
      select: {
        id: true,
        title: true,
        aired: true,
      }
    });

    console.log(`Migrating ${animes.length} animes...`);

    let migratedCount = 0;
    for (const anime of animes) {
      const info = parseSeasonAndYear(null, null, anime.aired);
      if (info) {
        await prisma.anime.update({
          where: { id: anime.id },
          data: {
            season: info.season,
            year: info.year,
          }
        });
        migratedCount++;
      }
    }

    console.log(`Migrated ${migratedCount} animes successfully!`);
  } catch (err) {
    console.error("Error migrating db:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();





