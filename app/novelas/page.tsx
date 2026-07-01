import { Suspense } from "react";
import { getNovelas } from "@/app/actions/novelas";
import { NovelasList } from "@/components/NovelasList";
import { PosterGridSkeleton } from "@/components/PosterGridSkeleton";
import { connection } from "next/server";

export const dynamic = "force-dynamic";

async function NovelasGridContent() {
  await connection();
  const { items, hasMore } = await getNovelas({ page: 1, limit: 24 });

  if (items.length === 0) {
    return (
      <div
        className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 mx-2"
        style={{
          marginLeft: "max(8px, (100vw - 1130px) / 2)",
          marginRight: "max(8px, (100vw - 1130px) / 2)",
        }}
      >
        <p className="text-zinc-500">Nenhuma novela encontrada.</p>
      </div>
    );
  }

  return <NovelasList initialItems={items} initialHasMore={hasMore} />;
}

export default async function NovelasPage() {
  return (
    <div className="py-8 px-2 sm:px-0">
      <header
        className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-4"
        style={{
          paddingLeft: "max(8px, (100vw - 1130px) / 2)",
          paddingRight: "max(8px, (100vw - 1130px) / 2)",
        }}
      >
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[28px]">
          Todas as Novelas
        </h1>
      </header>

      <main
        className="px-4"
        style={{
          paddingLeft: "max(8px, (100vw - 1130px) / 2)",
          paddingRight: "max(8px, (100vw - 1130px) / 2)",
        }}
      >
        <Suspense fallback={<PosterGridSkeleton count={24} />}>
          <NovelasGridContent />
        </Suspense>
      </main>
    </div>
  );
}
