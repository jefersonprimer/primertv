import Image from "next/image";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SeasonDropdown } from "@/components/SeasonDropdown";
import { getUniqueSeasons } from "@/lib/seasons";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

export const revalidate = 3600; // Revalidate every hour

interface SeasonsPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({
  params,
}: SeasonsPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const parts = slug.split("-");
  const t = await getTranslations({ locale, namespace: "SeasonsPage" });

  if (parts.length < 2) return { title: t("metaTitleDefault") };

  const seasonKey = parts[0].toLowerCase();
  const seasonName = t(`seasons.${seasonKey}`);
  const year = parts[1];

  return {
    title: t("metaTitle", { season: seasonName, year }),
    description: t("metaDescription", { season: seasonName, year }),
  };
}

export default async function SeasonsPage({ params }: SeasonsPageProps) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "SeasonsPage" });
  const parts = slug.split("-");
  if (parts.length < 2) {
    notFound();
  }

  const selectedSeason = parts[0].toLowerCase();
  const selectedYear = parseInt(parts[1], 10);
  if (
    isNaN(selectedYear) ||
    !["winter", "spring", "summer", "fall"].includes(selectedSeason)
  ) {
    notFound();
  }

  // Calculate previous and next season slugs
  const seasonsOrder = ["winter", "spring", "summer", "fall"];
  const currentIdx = seasonsOrder.indexOf(selectedSeason);

  let prevSeason = "fall";
  let prevYear = selectedYear - 1;
  if (currentIdx > 0) {
    prevSeason = seasonsOrder[currentIdx - 1];
    prevYear = selectedYear;
  }
  const prevSlug = `${prevSeason}-${prevYear}`;

  let nextSeason = "winter";
  let nextYear = selectedYear + 1;
  if (currentIdx < 3) {
    nextSeason = seasonsOrder[currentIdx + 1];
    nextYear = selectedYear;
  }
  const nextSlug = `${nextSeason}-${nextYear}`;

  // Fetch season metadata for the dropdown and filtered results for the grid
  const seasonsSource = await prisma.anime.findMany({
    select: {
      season: true,
      year: true,
      aired: true,
    },
  });

  const filteredAnimes = await prisma.anime.findMany({
    where: {
      season: selectedSeason,
      year: selectedYear,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      imageUrl: true,
      isDubbed: true,
      isSubtitled: true,
    },
    orderBy: {
      title: "asc",
    },
  });

  // Calculate unique seasons for the dropdown list
  const seasonsOptions = getUniqueSeasons(seasonsSource);
  const seasonKey = selectedSeason.toLowerCase();
  const seasonName = t(`seasons.${seasonKey}`);

  return (
    <div className="mx-auto max-w-[1130px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Header section with Title and Dropdown */}
      <div className="flex gap-4 items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-50 sm:text-[28px]">
            {t("title")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <SeasonDropdown seasons={seasonsOptions} currentSlug={slug} />
        </div>
      </div>

      {/* Animes List Grid */}
      {filteredAnimes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-800 bg-zinc-900/10">
          <svg
            className="mx-auto h-12 w-12 text-zinc-650"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-zinc-100">
            {t("noAnimesFound")}
          </h3>
          <p className="mt-2 text-sm text-zinc-400 max-w-xs">
            {t("noAnimesCorresponding", {
              season: seasonName,
              year: selectedYear,
            })}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredAnimes.map((anime) => (
            <Link
              key={anime.id}
              href={`/animes/${anime.slug}`}
              className="group flex flex-col gap-3"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-900 shadow-md ring-1 ring-white/10 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-xl group-hover:shadow-blue-500/15">
                {anime.imageUrl ? (
                  <Image
                    src={anime.imageUrl}
                    alt={anime.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    priority={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-sm text-zinc-500">
                    {t("noImage")}
                  </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="flex h-12 w-12 scale-90 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform duration-300 group-hover:scale-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <h3 className="line-clamp-2 text-sm font-semibold text-zinc-100 transition-colors group-hover:text-blue-500">
                {anime.title}
              </h3>
            </Link>
          ))}
        </div>
      )}

      {/* Season Navigation */}
      <div className="border-b border-zinc-800 mt-12 mb-6" />
      <div className="flex items-center justify-between pb-8">
        <Link
          href={`/seasons/${prevSlug}`}
          className="flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-blue-400 transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>{t("prevSeason")}</span>
        </Link>
        <Link
          href={`/seasons/${nextSlug}`}
          className="flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-blue-400 transition-colors cursor-pointer"
        >
          <span>{t("nextSeason")}</span>
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
