import { prisma } from "@/lib/prisma";
import { MediaCarousel } from "@/components/MediaCarousel";
import { connection } from "next/server";

export default async function ChannelsPage() {
  await connection();

  const [channels, novelas] = await Promise.all([
    prisma.channel.findMany({
      orderBy: { position: "asc" },
    }),
    prisma.novela.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        imageUrl: true,
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  return (
    <div className="py-8">
      <main className="space-y-16">
        {channels.length === 0 && novelas.length === 0 ? (
          <div
            className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 mx-2"
            style={{
              marginLeft: "max(8px, (100vw - 1223px) / 2)",
              marginRight: "max(8px, (100vw - 1223px) / 2)",
            }}
          >
            <p className="text-zinc-500">Nenhum conteúdo encontrado.</p>
          </div>
        ) : (
          <>
            {channels.length > 0 && (
              <MediaCarousel
                title="Canais TV"
                items={channels}
                type="channel"
                priority
              />
            )}

            {novelas.length > 0 && (
              <MediaCarousel
                title="Novelas"
                subtitle="As melhores tramas"
                items={novelas}
                type="novela"
                viewAllHref="/novelas"
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
