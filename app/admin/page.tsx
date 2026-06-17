import Link from "next/link";
import { adminCollections } from "@/lib/admin";
import { getAdminCounts, requireAdmin } from "./data";

export default async function AdminHomePage() {
  await requireAdmin();
  const counts = await getAdminCounts();

  const countMap = {
    movies: counts.movies,
    series: counts.series,
    animes: counts.animes,
    mangas: counts.mangas,
    novelas: counts.novelas,
    channels: counts.channels,
  };

  const cards = (Object.entries(adminCollections) as Array<
    [keyof typeof adminCollections, (typeof adminCollections)[keyof typeof adminCollections]]
  >).map(([collection, config]) => ({
    collection,
    config,
    count: countMap[collection],
  }));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 md:px-8">
      <section className="rounded-[32px] border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-zinc-50 p-8 shadow-sm dark:border-blue-950 dark:from-blue-950/30 dark:via-zinc-950 dark:to-zinc-950 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-400">
          Admin PrimerTV
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 md:text-5xl">
          Painel manual para criar e editar mídias
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Use este painel para cadastrar filmes, séries, animes, mangas, novelas
          e canais diretamente no banco, sem depender do scraper.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ collection, config, count }) => (
          <Link
            key={collection}
            href={`/admin/${collection}`}
            className="group rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500">
                  {config.label}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-zinc-950 dark:text-zinc-50">
                  {count} itens
                </h2>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Abrir
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Criar ou editar {config.itemLabel}s manualmente.
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
