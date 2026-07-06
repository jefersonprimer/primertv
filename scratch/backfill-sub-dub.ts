import "dotenv/config";
import { prisma } from "../lib/prisma";
import { getMediaFormat } from "../lib/media-format";

async function main() {
  console.log("Iniciando backfill para isDubbed e isSubtitled...");
  
  // Buscar todos os animes
  const animes = await prisma.anime.findMany({
    select: {
      id: true,
      audio: true,
      subtitles: true,
      title: true,
    },
  });

  console.log(`Encontrados ${animes.length} animes para processar.`);

  let updatedCount = 0;

  for (const anime of animes) {
    const format = getMediaFormat(anime.audio, anime.subtitles);
    const isDubbed = format === "DUB" || format === "SUB_DUB";
    const isSubtitled = format === "SUB" || format === "SUB_DUB";

    await prisma.anime.update({
      where: { id: anime.id },
      data: {
        isDubbed,
        isSubtitled,
      },
    });
    
    updatedCount++;
    if (updatedCount % 50 === 0) {
      console.log(`Processados ${updatedCount}/${animes.length} animes...`);
    }
  }

  console.log(`Backfill concluído! ${updatedCount} animes atualizados.`);
}

main()
  .catch((err) => {
    console.error("Erro no script de backfill:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
