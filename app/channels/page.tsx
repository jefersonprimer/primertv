import { prisma } from "@/lib/prisma";
import { MediaCard } from "@/components/MediaCard";
import Link from "next/link";
import { connection } from "next/server";

export default async function ChannelsPage() {
  await connection();

  const channels = await prisma.channel.findMany({
    orderBy: { title: "asc" },
  });

  return (
    <div className="p-8">
      <header className="mb-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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

      <main>
        {channels.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500">Nenhum canal encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {channels.map((item) => (
              <MediaCard key={item.id} item={item} type="channel" />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
