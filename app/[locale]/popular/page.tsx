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
      <PopularAnimesList title={t("title")} initialItems={animes} initialHasMore={hasMore} />
    </div>
  );
}
