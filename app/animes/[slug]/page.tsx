import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { Play } from "lucide-react";

import SeasonSelector from "@/components/SeasonSelector";
import MediaDescricao from "@/components/MediaDescricao";
import RatingBadge from "@/components/RatingBadge";
import { WatchlistButton } from "@/components/WatchlistButton";
import { getAuthenticatedUserId, isInWatchlist } from "@/lib/watchlist";

export const revalidate = 3600;

interface AnimeDetailsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: AnimeDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;

  const anime = await prisma.anime.findUnique({
    where: { slug },
    select: { title: true },
  });

  if (!anime) {
    return {
      title: "Anime não encontrado - PrimerTv",
    };
  }

  return {
    title: `${anime.title} - PrimerTv`,
  };
}

export default async function AnimeDetailsPage({
  params,
}: AnimeDetailsPageProps) {
  const { slug } = await params;

  const anime = await prisma.anime.findUnique({
    where: { slug },
    include: {
      seasons: {
        orderBy: { number: "asc" },
        include: {
          episodes: {
            orderBy: { number: "asc" },
          },
        },
      },
    },
  });

  if (!anime) {
    notFound();
  }

  const firstEpisodeId = anime.seasons[0]?.episodes[0]?.id;
  const userId = await getAuthenticatedUserId();
  const inWatchlist = await isInWatchlist("ANIME", anime.id);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Hero Section */}
      <div className="relative">
        {/* Banner for Desktop */}
        <div className="relative hidden h-[70vh] w-full overflow-hidden bg-zinc-900 md:block">
          {anime.imageUrl && (
            <Image
              src={anime.imageUrl}
              alt={anime.title}
              fill
              sizes="100vw"
              className="object-cover opacity-30 blur-sm"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 to-transparent dark:from-black" />
        </div>

        {/* Content Container */}
        <div className="mx-auto max-w-[1223px] py-8 md:absolute md:bottom-0 md:left-0 md:right-0 md:py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end">
            {/* Poster Image */}
            <div className="relative aspect-[2/3] w-full self-center overflow-hidden shadow-2xl md:w-48 lg:w-60 flex-shrink-0">
              {anime.imageUrl ? (
                <Image
                  src={anime.imageUrl}
                  alt={anime.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 240px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-zinc-800 text-zinc-400">
                  Sem imagem
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 md:text-4xl">
                  {anime.title}
                </h1>

                {(anime.rating ||
                  (anime.genres && anime.genres.length > 0)) && (
                  <div className="mt-2 flex items-center flex-wrap gap-2">
                    {anime.rating && (
                      <RatingBadge rating={anime.rating} className="h-5 w-5" />
                    )}
                    {anime.rating &&
                      anime.genres &&
                      anime.genres.length > 0 && (
                        <span
                          className="text-zinc-400 dark:text-zinc-600 flex items-center justify-center"
                          aria-hidden="true"
                        >
                          <svg
                            className="h-2 w-2 fill-current"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2L22 12L12 22L2 12Z" />
                          </svg>
                        </span>
                      )}
                    {anime.genres?.map((genre) => (
                      <span
                        key={genre}
                        className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {firstEpisodeId && (
                  <Link
                    href={`/animes/${anime.slug}/episode/${firstEpisodeId}`}
                    className="flex w-full items-center justify-center gap-2 bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700 md:w-fit"
                  >
                    <Play className="h-5 w-5 fill-current" />
                    Começar a assistir EP1
                  </Link>
                )}
                <WatchlistButton
                  mediaType="ANIME"
                  mediaId={anime.id}
                  slug={anime.slug}
                  initialInWatchlist={inWatchlist}
                  isLoggedIn={Boolean(userId)}
                />
              </div>

              <div className="max-w-2xl">
                {anime.description && (
                  <MediaDescricao description={anime.description} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Episodes Section */}
      <main className="mx-auto max-w-[1223px] pb-12">
        {anime.seasons.length === 0 ? (
          <p className="text-zinc-500">Nenhum episódio encontrado.</p>
        ) : (
          <SeasonSelector seasons={anime.seasons} animeSlug={anime.slug} />
        )}
      </main>
    </div>
  );
}
