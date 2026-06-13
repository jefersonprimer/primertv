import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MediaCard } from "@/components/MediaCard";
import { connection } from "next/server";

export default async function Home() {
  await connection();

  const animes = await prisma.anime.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const series = await prisma.series.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const movies = await prisma.movie.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const mangas = await prisma.manga.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const novelas = await prisma.novela.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const channels = await prisma.channel.findMany({
    orderBy: { title: "asc" },
  });

  return (
    <div className="p-8">
      <header className="mb-12 text-center md:text-left">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Bem-vindo ao Primerflix</h2>
        <p className="text-zinc-600 dark:text-zinc-400">Explore nossa coleção de conteúdos.</p>
      </header>

      <main className="space-y-16">
        {/* Channels Section */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Canais TV</h2>
            <Link href="/channels" className="text-sm font-medium text-blue-500 hover:underline">
              Ver tudo
            </Link>
          </div>
          {channels.length === 0 ? (
            <p className="text-zinc-500">Nenhum canal encontrado.</p>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {channels.map((item) => (
                <MediaCard key={item.id} item={item} type="channel" />
              ))}
            </div>
          )}
        </section>

        {/* Novelas Section */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Novelas</h2>
            <Link href="/novelas" className="text-sm font-medium text-blue-500 hover:underline">
              Ver tudo
            </Link>
          </div>
          {novelas.length === 0 ? (
            <p className="text-zinc-500">Nenhuma novela encontrada.</p>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {novelas.map((item) => (
                <MediaCard key={item.id} item={item} type="novela" />
              ))}
            </div>
          )}
        </section>

        {/* Movies Section */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Filmes Recentes</h2>
            <Link href="/movie" className="text-sm font-medium text-blue-500 hover:underline">
              Ver tudo
            </Link>
          </div>
          {movies.length === 0 ? (
            <p className="text-zinc-500">Nenhum filme encontrado.</p>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {movies.map((item) => (
                <MediaCard key={item.id} item={item} type="movie" />
              ))}
            </div>
          )}
        </section>

        {/* Animes Section */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Animes</h2>
            <Link href="/anime" className="text-sm font-medium text-blue-500 hover:underline">
              Ver tudo
            </Link>
          </div>
          {animes.length === 0 ? (
            <p className="text-zinc-500">Nenhum anime encontrado.</p>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {animes.map((anime) => (
                <MediaCard key={anime.id} item={anime} type="anime" />
              ))}
            </div>
          )}
        </section>

        {/* Series Section */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Séries Populares</h2>
            <Link href="/series" className="text-sm font-medium text-blue-500 hover:underline">
              Ver tudo
            </Link>
          </div>
          {series.length === 0 ? (
            <p className="text-zinc-500">Nenhuma série encontrada.</p>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {series.map((item) => (
                <MediaCard key={item.id} item={item} type="series" />
              ))}
            </div>
          )}
        </section>

        {/* Manga Section */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Mangás Recentes</h2>
            <Link href="/manga" className="text-sm font-medium text-blue-500 hover:underline">
              Ver tudo
            </Link>
          </div>
          {mangas.length === 0 ? (
            <p className="text-zinc-500">Nenhum mangá encontrado.</p>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {mangas.map((item) => (
                <MediaCard key={item.id} item={item} type="manga" />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
