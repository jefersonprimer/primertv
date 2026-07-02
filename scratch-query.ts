import "dotenv/config";
import { prisma } from "./lib/prisma";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function generatePublicId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 9; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function main() {
  console.log("Starting backfill for chapters...");
  const chapters = await prisma.chapter.findMany({
    where: {
      OR: [
        { publicId: null },
        { slug: null }
      ]
    }
  });

  console.log(`Found ${chapters.length} chapters to update.`);

  const usedIds = new Set<string>();

  for (const chapter of chapters) {
    let publicId = chapter.publicId;
    if (!publicId) {
      while (true) {
        const id = generatePublicId();
        if (usedIds.has(id)) continue;

        const [existsAnime, existsSeries, existsChapter] = await Promise.all([
          prisma.episode.findUnique({ where: { publicId: id } }),
          prisma.seriesEpisode.findUnique({ where: { publicId: id } }),
          prisma.chapter.findUnique({ where: { publicId: id } }),
        ]);

        if (!existsAnime && !existsSeries && !existsChapter) {
          publicId = id;
          usedIds.add(id);
          break;
        }
      }
    }

    const slug = slugify(chapter.title || "") || `chapter-${chapter.number}`;

    await prisma.chapter.update({
      where: { id: chapter.id },
      data: {
        publicId,
        slug,
      }
    });
  }

  console.log("Backfill finished successfully.");
}

main()
  .catch((err) => {
    console.error("Error during backfill:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
