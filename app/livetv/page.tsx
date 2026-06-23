import { prisma } from "@/lib/prisma";
import { MediaCarousel } from "@/components/MediaCarousel";
import Link from "next/link";
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
      <header
        className="mb-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-4"
        style={{
          paddingLeft: "max(8px, (100vw - 1223px) / 2)",
          paddingRight: "max(8px, (100vw - 1223px) / 2)",
        }}
      >
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Canais de TV</h2>
          <p className="text-zinc-600 dark:text-zinc-400">Assista aos melhores canais brasileiros ao vivo.</p>
        </div>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          Voltar para Home
        </Link>
      </header>

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
                subtitle="Assista ao vivo"
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
