import { prisma } from "@/lib/prisma";
import { MediaCarousel } from "@/components/MediaCarousel";
import { MediaCarouselSkeleton } from "@/components/MediaCarouselSkeleton";
import { Suspense } from "react";
import { HeroCarousel, HeroCarouselSkeleton } from "@/components/HeroCarousel";
import { Metadata } from "next";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";

export const revalidate = 3600; // revalida a cada hora

interface SeriesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: SeriesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SeriesPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

async function RecentSeriesCarousel({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "SeriesPage" });
  const items = await prisma.series.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      imageUrl: true,
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  return (
    <MediaCarousel
      title={t("recentTitle")}
      subtitle={t("recentSubtitle")}
      items={items}
      type="series"
    />
  );
}

async function TopRatedSeriesCarousel({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "SeriesPage" });
  const items = await prisma.series.findMany({
    where: {
      score: { not: null },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      imageUrl: true,
    },
    orderBy: { score: "desc" },
    take: 15,
  });
  return (
    <MediaCarousel
      title={t("topRatedTitle")}
      subtitle={t("topRatedSubtitle")}
      items={items}
      type="series"
    />
  );
}

async function DramaSeriesCarousel({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "SeriesPage" });
  const items = await prisma.series.findMany({
    where: {
      genres: { has: "Drama" },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      imageUrl: true,
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  return (
    <MediaCarousel
      title={t("dramaTitle")}
      subtitle={t("dramaSubtitle")}
      items={items}
      type="series"
    />
  );
}

async function ActionSeriesCarousel({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "SeriesPage" });
  const items = await prisma.series.findMany({
    where: {
      genres: {
        hasSome: ["Action", "Adventure"],
      },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      imageUrl: true,
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  return (
    <MediaCarousel
      title={t("actionTitle")}
      subtitle={t("actionSubtitle")}
      items={items}
      type="series"
    />
  );
}

async function SciFiSeriesCarousel({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "SeriesPage" });
  const items = await prisma.series.findMany({
    where: {
      genres: {
        hasSome: ["Science-Fiction", "Thriller"],
      },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      imageUrl: true,
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  return (
    <MediaCarousel
      title={t("sciFiTitle")}
      subtitle={t("sciFiSubtitle")}
      items={items}
      type="series"
    />
  );
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  await connection();
  const { locale } = await params;

  return (
    <>
      <Suspense fallback={<HeroCarouselSkeleton />}>
        <HeroCarousel type="series" />
      </Suspense>
      <div className="pl-3 md:pl-8 lg:pl-12 xl:pl-0  md:-translate-y-48 lg:-translate-y-22 xl:-translate-y-38">
        <main className="space-y-8 lg:space-y-16">
          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <RecentSeriesCarousel locale={locale} />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <TopRatedSeriesCarousel locale={locale} />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <DramaSeriesCarousel locale={locale} />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <ActionSeriesCarousel locale={locale} />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <SciFiSeriesCarousel locale={locale} />
          </Suspense>
        </main>
      </div>
    </>
  );
}
