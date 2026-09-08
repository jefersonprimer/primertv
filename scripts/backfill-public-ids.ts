import { prisma } from "../lib/prisma";

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

async function generateUniquePublicId(existingIds: Set<string>): Promise<string> {
  while (true) {
    let result = "";
    for (let i = 0; i < 9; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (existingIds.has(result)) continue;

    const [existsAnime, existsSeries, existsChapter, existsMovie] =
      await Promise.all([
        prisma.episode.findUnique({ where: { publicId: result } }),
        prisma.seriesEpisode.findUnique({ where: { publicId: result } }),
        prisma.chapter.findUnique({ where: { publicId: result } }),
        prisma.movie.findUnique({ where: { publicId: result } }),
      ]);

    if (!existsAnime && !existsSeries && !existsChapter && !existsMovie) {
      existingIds.add(result);
      return result;
    }
  }
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

async function main() {
  console.log("Starting publicId and slug backfill...");

  const existingIds = new Set<string>();

  const [episodesWithId, seriesEpisodesWithId, moviesWithId, chaptersWithId] = await Promise.all([
    prisma.episode.findMany({ where: { publicId: { not: null } }, select: { publicId: true } }),
    prisma.seriesEpisode.findMany({ where: { publicId: { not: null } }, select: { publicId: true } }),
    prisma.movie.findMany({ where: { publicId: { not: null } }, select: { publicId: true } }),
    prisma.chapter.findMany({ where: { publicId: { not: null } }, select: { publicId: true } }),
  ]);

  for (const item of [...episodesWithId, ...seriesEpisodesWithId, ...moviesWithId, ...chaptersWithId]) {
    if (item.publicId) existingIds.add(item.publicId);
  }

  // 1. Anime Episodes
  const episodes = await prisma.episode.findMany({
    where: { OR: [{ publicId: null }, { slug: null }] },
  });
  console.log(`Found ${episodes.length} anime episodes needing update...`);
  for (const ep of episodes) {
    const publicId = ep.publicId || (await generateUniquePublicId(existingIds));
    const slug = ep.slug || slugify(ep.title || "") || `episode-${ep.number}`;
    await prisma.episode.update({
      where: { id: ep.id },
      data: { publicId, slug },
    });
  }

  // 2. Series Episodes
  const seriesEpisodes = await prisma.seriesEpisode.findMany({
    where: { OR: [{ publicId: null }, { slug: null }] },
  });
  console.log(`Found ${seriesEpisodes.length} series episodes needing update...`);
  for (const ep of seriesEpisodes) {
    const publicId = ep.publicId || (await generateUniquePublicId(existingIds));
    const slug = ep.slug || slugify(ep.title || "") || `episode-${ep.number}`;
    await prisma.seriesEpisode.update({
      where: { id: ep.id },
      data: { publicId, slug },
    });
  }

  // 3. Movies
  const movies = await prisma.movie.findMany({
    where: { publicId: null },
  });
  console.log(`Found ${movies.length} movies needing update...`);
  for (const movie of movies) {
    const publicId = movie.publicId || (await generateUniquePublicId(existingIds));
    await prisma.movie.update({
      where: { id: movie.id },
      data: { publicId },
    });
  }

  // 4. Manga Chapters
  const chapters = await prisma.chapter.findMany({
    where: { OR: [{ publicId: null }, { slug: null }] },
  });
  console.log(`Found ${chapters.length} chapters needing update...`);
  for (const ch of chapters) {
    const publicId = ch.publicId || (await generateUniquePublicId(existingIds));
    const slug = ch.slug || slugify(ch.title || "") || `chapter-${ch.number}`;
    await prisma.chapter.update({
      where: { id: ch.id },
      data: { publicId, slug },
    });
  }

  console.log("Backfill completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during backfill:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
