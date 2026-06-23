import { Suspense } from "react";
import { getNovelas } from "@/app/actions/novelas";
import { NovelasList } from "@/components/NovelasList";
import { PosterGridSkeleton } from "@/components/PosterGridSkeleton";
import Link from "next/link";
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
          marginLeft: "max(8px, (100vw - 1223px) / 2)",
          marginRight: "max(8px, (100vw - 1223px) / 2)",
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
    <div className="py-8">
      <header
        className="mb-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-4"
        style={{
          paddingLeft: "max(8px, (100vw - 1223px) / 2)",
          paddingRight: "max(8px, (100vw - 1223px) / 2)",
        }}
      >
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Todas as Novelas</h2>
          <p className="text-zinc-600 dark:text-zinc-400">Explore nossa coleção de novelas completa.</p>
        </div>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          Voltar para Home
        </Link>
      </header>

      <main
        className="px-4"
        style={{
          paddingLeft: "max(8px, (100vw - 1223px) / 2)",
          paddingRight: "max(8px, (100vw - 1223px) / 2)",
        }}
      >
        <Suspense fallback={<PosterGridSkeleton count={24} />}>
          <NovelasGridContent />
        </Suspense>
      </main>
    </div>
  );
}
