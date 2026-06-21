import "dotenv/config";
import { prisma } from "./lib/prisma";

import { getNewReleases } from "./app/actions/newReleases";

async function main() {
  try {
    const animes = await prisma.anime.count();
    const series = await prisma.series.count();
    const novelas = await prisma.novela.count();
    const movies = await prisma.movie.count();
    const mangas = await prisma.manga.count();

    console.log("ENTITY COUNTS:", { animes, series, novelas, movies, mangas });

    const r1 = await getNewReleases({ type: "animes", page: 1, limit: 24 });
    console.log("ANIMES PAGE 1 RESULT:", {
      itemsCount: r1.items.length,
      hasMore: r1.hasMore,
    });
    const r2 = await getNewReleases({ type: "animes", page: 2, limit: 24 });
    console.log("ANIMES PAGE 2 RESULT:", {
      itemsCount: r2.items.length,
      hasMore: r2.hasMore,
    });
  } catch (err) {
    console.error("Error querying db:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
