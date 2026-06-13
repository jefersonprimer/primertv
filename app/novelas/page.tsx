import { prisma } from "@/lib/prisma";
import { MediaCard } from "@/components/MediaCard";
import Link from "next/link";
import { connection } from "next/server";

export default async function NovelasPage() {
  await connection();

  const novelas = await prisma.novela.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <header className="mb-12">
        <Link href="/" className="text-sm font-medium text-blue-500 hover:underline mb-4 inline-block">
          ← Voltar para Home
        </Link>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Todas as Novelas</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Explore nossa coleção de novelas completa.</p>
      </header>

      <main>
        {novelas.length === 0 ? (
          <p className="text-zinc-500">Nenhuma novela encontrada.</p>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {novelas.map((item) => (
              <MediaCard key={item.id} item={item} type="novela" />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
