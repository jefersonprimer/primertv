import { Suspense } from "react";
import { getMangas } from "@/app/actions/mangas";
import { MangasList } from "@/components/MangasList";
import { PosterGridSkeleton } from "@/components/PosterGridSkeleton";
import { connection } from "next/server";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mangás - PrimerTv",
  description: "Leia seus mangás favoritos online no PrimerTv.",
};

async function MangasGridContent() {
  await connection();
  const { items, hasMore } = await getMangas({ page: 1, limit: 24 });

  if (items.length === 0) {
    return (
      <div
        className="flex h-64 items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 mx-2"
        style={{
          marginLeft: "max(8px, (100vw - 1223px) / 2)",
          marginRight: "max(8px, (100vw - 1223px) / 2)",
        }}
      >
        <p className="text-zinc-500">Nenhum mangá encontrado.</p>
      </div>
    );
  }

  return <MangasList initialItems={items} initialHasMore={hasMore} />;
}

export default async function MangasPage() {
  return (
    <div className="py-8 px-2 sm:px-0">
      <header
        className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-4"
        style={{
          paddingLeft: "max(8px, (100vw - 1223px) / 2)",
          paddingRight: "max(8px, (100vw - 1223px) / 2)",
        }}
      >
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[28px]">
          Todos os Mangás
        </h1>
      </header>

      <main
        className="px-2 sm:px-4"
        style={{
          paddingLeft: "max(8px, (100vw - 1223px) / 2)",
          paddingRight: "max(8px, (100vw - 1223px) / 2)",
        }}
      >
        <Suspense fallback={<PosterGridSkeleton count={24} />}>
          <MangasGridContent />
        </Suspense>
      </main>
    </div>
  );
}
