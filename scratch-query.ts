import "dotenv/config";
import { prisma } from "./lib/prisma";

async function main() {
  try {
    // Update some anime to Summer 2026 (Current Season)
    await prisma.anime.updateMany({
      where: {
        title: {
          in: [
            "Re:Zero kara Hajimeru Isekai Seikatsu 4th Season",
            "Steel Ball Run: JoJo no Kimyou na Bouken",
            "Kingdom 3rd Season"
          ]
        }
      },
      data: {
        premiered: "Summer 2026",
        status: "Currently Airing"
      }
    });

    // Update some anime to Fall 2026 (Next Season)
    await prisma.anime.updateMany({
      where: {
        title: {
          in: [
            "Sousou no Frieren 2nd Season",
            "Monster",
            "Owarimonogatari 2nd Season"
          ]
        }
      },
      data: {
        premiered: "Fall 2026",
        status: "Not yet aired"
      }
    });

    console.log("Database updated successfully!");
  } catch (err) {
    console.error("Error updating db:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();

