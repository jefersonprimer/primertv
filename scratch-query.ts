import { prisma } from "./lib/prisma";

async function main() {
  try {
    const animeEps = await prisma.episode.count();
    const seriesEps = await prisma.seriesEpisode.count();
    const novelaEps = await prisma.novelaEpisode.count();
    const mangaChapters = await prisma.chapter.count();
    const moviesCount = await prisma.movie.count();

    console.log("DATABASE_COUNTS:", {
      animeEpisodes: animeEps,
      seriesEpisodes: seriesEps,
      novelaEpisodes: novelaEps,
      mangaChapters,
      movies: moviesCount,
    });
  } catch (err) {
    console.error("Error querying db:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
