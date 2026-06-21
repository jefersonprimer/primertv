import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SeasonDropdown } from "@/components/SeasonDropdown";
import { parseSeasonAndYear, getUniqueSeasons } from "@/lib/seasons";
import RatingBadge from "@/components/RatingBadge";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const revalidate = 3600; // Revalidate every hour

interface SeasonsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: SeasonsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const parts = slug.split("-");
  if (parts.length < 2) return { title: "Animes por Temporada - PrimerTv" };

  const seasonName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  const year = parts[1];

  return {
    title: `Animes da Temporada de ${seasonName} de ${year} - PrimerTv`,
    description: `Descubra e assista aos melhores animes lançados em ${seasonName} de ${year} online no PrimerTv.`,
  };
}

export default async function SeasonsPage({ params }: SeasonsPageProps) {
  const { slug } = await params;
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

  // Fetch all animes from the database
  const allAnimes = await prisma.anime.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      imageUrl: true,
      description: true,
      aired: true,
      rating: true,
      status: true,
      genres: true,
      premiered: true,
    },
    orderBy: {
      title: "asc",
    },
  });

  // Calculate unique seasons for the dropdown list
  const seasonsOptions = getUniqueSeasons(allAnimes);

  // Filter animes matching the selected season and year
  const filteredAnimes = allAnimes.filter((anime) => {
    const info = parseSeasonAndYear(anime.premiered, anime.aired);
    if (!info) return false;
    return info.season === selectedSeason && info.year === selectedYear;
  });

  const formattedSeasonTitle =
    selectedSeason.charAt(0).toUpperCase() + selectedSeason.slice(1);

  return (
    <div className="mx-auto max-w-[1130px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Header section with Title and Dropdown */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[28px]">
            Seasonal Anime
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <SeasonDropdown seasons={seasonsOptions} currentSlug={slug} />
        </div>
      </div>

      {/* Animes List Grid */}
      {filteredAnimes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10">
          <svg
            className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-600"
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
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Nenhum anime encontrado
          </h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
            Nenhum anime cadastrado corresponde a {formattedSeasonTitle}{" "}
            {selectedYear}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredAnimes.map((anime) => {
            // Determine status badge color
            const isNotYetAired =
              anime.status?.toLowerCase().includes("not yet") || false;
            const isAiring =
              anime.status?.toLowerCase().includes("currently") || false;

            let statusLabel = "Finalizado";
            let statusColor =
              "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800";

            if (isNotYetAired) {
              statusLabel = "Não Estreou";
              statusColor =
                "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
            } else if (isAiring) {
              statusLabel = "Em Exibição";
              statusColor =
                "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
            }

            // Capitalized premiered display or fallback formatting
            const premieredDisplay = anime.premiered
              ? anime.premiered
              : parseSeasonAndYear(null, anime.aired)
                ? (() => {
                    const info = parseSeasonAndYear(null, anime.aired);
                    return info
                      ? `${info.season.charAt(0).toUpperCase() + info.season.slice(1)} ${info.year}`
                      : null;
                  })()
                : null;

            return (
              <div
                key={anime.id}
                className="group flex flex-col bg-white dark:bg-zinc-950 rounded-xl overflow-hidden shadow-sm hover:shadow-xl border border-zinc-200 dark:border-zinc-900 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Poster Container */}
                <Link
                  href={`/animes/${anime.slug}`}
                  className="relative aspect-[2/3] w-full block overflow-hidden bg-zinc-900"
                >
                  {anime.imageUrl ? (
                    <Image
                      src={anime.imageUrl}
                      alt={anime.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority={false}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-400">
                      Sem imagem
                    </div>
                  )}
                  {/* Rating badge overlapping the image */}
                  {anime.rating && (
                    <div className="absolute top-3 left-3 z-10">
                      <RatingBadge
                        rating={anime.rating}
                        className="scale-90 origin-top-left"
                      />
                    </div>
                  )}
                </Link>

                {/* Info Container */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-4">
                  <div className="space-y-2">
                    <Link
                      href={`/animes/${anime.slug}`}
                      className="block text-base font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-500 transition-colors line-clamp-1"
                    >
                      {anime.title}
                    </Link>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-md ${statusColor}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    {/* Meta fields */}
                    <div className="text-xs space-y-1 text-zinc-500 dark:text-zinc-400 pt-1">
                      {premieredDisplay && (
                        <p>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            Estreia:
                          </span>{" "}
                          {premieredDisplay}
                        </p>
                      )}
                      {anime.aired && (
                        <p className="line-clamp-1">
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            Período:
                          </span>{" "}
                          {anime.aired}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Genres */}
                  {anime.genres && anime.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {anime.genres.slice(0, 3).map((genre) => (
                        <span
                          key={genre}
                          className="bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 text-[10px] font-semibold rounded-md border border-zinc-200/50 dark:border-zinc-800/50 hover:underline"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Season Navigation */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 mt-12 mb-6" />
      <div className="flex items-center justify-between pb-8">
        <Link
          href={`/seasons/${prevSlug}`}
          className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Temporada Anterior</span>
        </Link>
        <Link
          href={`/seasons/${nextSlug}`}
          className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
        >
          <span>Próxima Temporada</span>
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
