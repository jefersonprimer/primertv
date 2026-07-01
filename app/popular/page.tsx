import { connection } from "next/server";
import { Metadata } from "next";
import { getPopularAnimes } from "@/app/actions/popular";
import { PopularAnimesList } from "@/components/PopularAnimesList";

export const metadata: Metadata = {
  title: "Mais Populares - PrimerTv",
  description:
    "Explore os animes mais populares e bem avaliados de acordo com o ranking global do MyAnimeList/Jikan.",
};

export const dynamic = "force-dynamic";

export default async function PopularAnimesPage() {
  await connection();

  const { items: animes, hasMore } = await getPopularAnimes({
    page: 1,
    limit: 24,
  });

  return (
    <div className="mx-auto max-w-[1130px] px-4 py-8 md:py-12">
      {/* Page Header */}
      <div className=" flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[28px]">
          Animes Mais Populares
        </h1>
      </div>

      {/* Popularity Grid */}
      <main className="min-h-[400px]">
        <PopularAnimesList initialItems={animes} initialHasMore={hasMore} />
      </main>
    </div>
  );
}
