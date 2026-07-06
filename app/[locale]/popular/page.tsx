import { connection } from "next/server";
import { Metadata } from "next";
import { getPopularAnimes } from "@/app/actions/popular";
import { PopularAnimesList } from "@/components/PopularAnimesList";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PopularPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function PopularAnimesPage({ params }: Props) {
  await connection();
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PopularPage" });

  const { items: animes, hasMore } = await getPopularAnimes({
    page: 1,
    limit: 24,
  });

  return (
    <div className="mx-auto max-w-[1130px] px-4 xl:px-0 py-6">
      {/* Page Header */}
      <div className=" flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-2 sm:pb-4 border-zinc-800">
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-[28px]">
          {t("title")}
        </h1>
      </div>

      {/* Popularity Grid */}
      <main className="min-h-[400px] mt-6">
        <PopularAnimesList initialItems={animes} initialHasMore={hasMore} />
      </main>
    </div>
  );
}
