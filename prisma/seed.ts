import { prisma } from "../lib/prisma";

async function main() {
  const anime = await prisma.anime.upsert({
    where: { title: "Solo Leveling" },
    update: {},
    create: {
      title: "Solo Leveling",
      slug: "solo-leveling",
      description: "Test anime for scraper",
    },
  });

  console.log("Upserted anime:", anime);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
