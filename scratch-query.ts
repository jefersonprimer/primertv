import "dotenv/config";
import { prisma } from "./lib/prisma";

async function main() {
  try {
    const movies = await prisma.movie.findMany({
      select: { genres: true }
    });
    const genresCount: Record<string, number> = {};
    for (const m of movies) {
      for (const g of m.genres) {
        genresCount[g] = (genresCount[g] || 0) + 1;
      }
    }
    console.log("MOVIE GENRES:", genresCount);
  } catch (err) {
    console.error("Error querying db:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
