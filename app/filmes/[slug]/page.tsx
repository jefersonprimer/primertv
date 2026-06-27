import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { getMovieBanner } from "@/lib/banners";
import { getMovieDetails, getMovieLogo } from "@/lib/tmdb";
import MediaDescricao from "@/components/MediaDescricao";
import { MediaCarousel } from "@/components/MediaCarousel";
import { WatchlistButton } from "@/components/WatchlistButton";
import AddToListButton from "@/components/AddToListButton";
import ShareButton from "@/components/ShareButton";

export const revalidate = 3600;

interface MovieDetailsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ player?: string }>;
}

export async function generateMetadata({
  params,
}: MovieDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const movie = await prisma.movie.findUnique({ where: { slug } });

  if (!movie) return { title: "Filme não encontrado" };

  let bannerUrl = movie.bannerUrl;
  if (!bannerUrl) {
    bannerUrl = await getMovieBanner(movie.id, movie.title);
  }
  const ogBannerUrl = bannerUrl === "none" ? null : bannerUrl;

  const ogImages = [];
  if (ogBannerUrl) ogImages.push(ogBannerUrl);
  if (movie.imageUrl) ogImages.push(movie.imageUrl);

  return {
    title: `Assistir ${movie.title} Online em HD - PrimerTv`,
    description: `Assista ao filme ${movie.title} online grátis em HD no PrimerTv.`,
    openGraph: {
      title: movie.title,
      images: ogImages,
    },
  };
}

export default async function MovieDetailsPage({
  params,
  searchParams,
}: MovieDetailsPageProps) {
  const { slug } = await params;
  const { player } = await searchParams;

  const movie = await prisma.movie.findUnique({
    where: { slug },
  });

  if (!movie) {
    notFound();
  }

  let bannerUrl = movie.bannerUrl;
  if (!bannerUrl) {
    bannerUrl = await getMovieBanner(movie.id, movie.title);
  }
  const finalBannerUrl = bannerUrl === "none" ? null : bannerUrl;

  const movieDetails = await getMovieDetails(movie.id, movie.title);
  const displayGenres =
    movieDetails.genres.length > 0 ? movieDetails.genres : movie.genres;

  const similarMovies =
    movie.genres && movie.genres.length > 0
      ? await prisma.movie.findMany({
          where: {
            genres: { hasSome: movie.genres },
            id: { not: movie.id },
          },
          select: { id: true, slug: true, title: true, imageUrl: true },
          take: 15,
        })
      : [];
  let logoUrl = movie.logoUrl;
  if (!logoUrl || logoUrl === "none") {
    logoUrl = await getMovieLogo(movie.id, movie.title);
  }
  const finalLogoUrl = logoUrl === "none" ? null : logoUrl;

  // Resolve active player URL
  const isMgebUrl = movie.videoUrl?.includes("mgeb.top");
  const isSuperflixUrl = movie.videoUrl?.includes("superflixapi.lifestyle");
  const isMyembedUrl = movie.videoUrl?.includes("myembed.biz");
  const is2embedUrl = movie.videoUrl?.includes("2embed.cc");
  const hasScrapedUrl = movie.videoUrl && !isMgebUrl && !isSuperflixUrl && !isMyembedUrl && !is2embedUrl;

  let currentVideoUrl = movie.videoUrl;
  let activePlayer = 1;

  // Decide default player if none is explicitly selected
  let defaultPlayer = 1;
  if (hasScrapedUrl) {
    defaultPlayer = 1;
  } else if (movie.tmdbId) {
    defaultPlayer = 2; // Default to MGEB if no scraped URL exists
  }

  // Set active player and current URL
  const selectedPlayerStr = player;
  if (selectedPlayerStr === "2" && movie.tmdbId) {
    activePlayer = 2;
    currentVideoUrl = `https://mgeb.top/embed/${movie.tmdbId}`;
  } else if (selectedPlayerStr === "3" && movie.tmdbId) {
    activePlayer = 3;
    currentVideoUrl = `https://superflixapi.lifestyle/filme/${movie.tmdbId}`;
  } else if (selectedPlayerStr === "4" && movie.tmdbId) {
    activePlayer = 4;
    currentVideoUrl = `https://myembed.biz/filme/${movie.tmdbId}`;
  } else if (selectedPlayerStr === "5" && movie.tmdbId) {
    activePlayer = 5;
    currentVideoUrl = `https://www.2embed.cc/embed/${movie.tmdbId}`;
  } else if (selectedPlayerStr === "1" && hasScrapedUrl) {
    activePlayer = 1;
    currentVideoUrl = movie.videoUrl;
  } else {
    // If no option or invalid option selected, use the default player
    activePlayer = defaultPlayer;
    if (activePlayer === 2 && movie.tmdbId) {
      currentVideoUrl = `https://mgeb.top/embed/${movie.tmdbId}`;
    } else if (activePlayer === 3 && movie.tmdbId) {
      currentVideoUrl = `https://superflixapi.lifestyle/filme/${movie.tmdbId}`;
    } else if (activePlayer === 4 && movie.tmdbId) {
      currentVideoUrl = `https://myembed.biz/filme/${movie.tmdbId}`;
    } else if (activePlayer === 5 && movie.tmdbId) {
      currentVideoUrl = `https://www.2embed.cc/embed/${movie.tmdbId}`;
    } else {
      currentVideoUrl = movie.videoUrl;
    }
  }

  // Simple heuristic to check if it's a video file or an embed
  const isDirectVideo =
    currentVideoUrl?.endsWith(".mp4") || currentVideoUrl?.endsWith(".m3u8");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header/Banner Section */}
      <div className="relative md:min-h-[90vh] w-full flex flex-col justify-end overflow-hidden bg-zinc-900">
        {finalBannerUrl ? (
          <Image
            src={finalBannerUrl}
            alt={movie.title}
            fill
            sizes="100vw"
            className="object-cover opacity-100 hidden md:block"
            priority
          />
        ) : (
          movie.imageUrl && (
            <Image
              src={movie.imageUrl}
              alt={movie.title}
              fill
              sizes="100vw"
              className="object-cover opacity-100 hidden md:block"
              priority
            />
          )
        )}
        {/* Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-zinc-50 to-transparent dark:from-black" />
        {/* Left Gradient */}
        <div className="absolute inset-y-0 left-0 w-[40%] bg-gradient-to-r from-zinc-50/80 to-transparent dark:from-black/80" />
        {/* Right Gradient */}
        <div className="absolute inset-y-0 right-0 w-[10%] bg-gradient-to-l from-zinc-50/50 to-transparent dark:from-black/50" />

        <div className="relative w-full z-10">
          <div className="mx-auto flex max-w-[1223px] flex-col gap-6 md:flex-row md:items-end">
            <div className="relative aspect-[2/3] w-full self-center overflow-hidden shadow-2xl md:hidden flex-shrink-0">
              {movie.imageUrl ? (
                <Image
                  src={movie.imageUrl}
                  alt={movie.title}
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
            <div className="relative z-10 flex flex-1 flex-col gap-4 md:gap-8 -mt-70 md:mt-0 py-6 px-4 md:p-0 w-full">
              {/* Mobile Background with Gradient Mask */}
              <div
                className="absolute inset-0 -z-10 bg-gradient-to-b from-zinc-50/20 via-zinc-50/85 to-zinc-50 dark:from-black/20 dark:via-black/85 dark:to-black backdrop-blur-[3px] rounded-t-2xl md:hidden"
                style={{
                  maskImage:
                    "linear-gradient(to bottom, transparent, black 120px)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent, black 120px)",
                }}
              />
              <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left w-full md:max-w-2xl">
                {finalLogoUrl ? (
                  <div className="relative w-full max-w-[280px] md:max-w-[400px] aspect-[3/1] mb-2 flex items-center justify-center md:justify-start">
                    <Image
                      src={finalLogoUrl}
                      alt={movie.title}
                      fill
                      priority
                      className="object-contain object-center md:object-left"
                    />
                    <h1 className="sr-only">{movie.title}</h1>
                  </div>
                ) : (
                  <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 md:text-4xl text-center md:text-left">
                    {movie.title}
                  </h1>
                )}
                {(movieDetails.score ||
                  movieDetails.runtime ||
                  movieDetails.year) && (
                  <div className="flex flex-row items-center gap-3 flex-wrap justify-center md:justify-start mt-2">
                    {movieDetails.score && (
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-[#f5c518] px-1.5 py-0.5 text-xs font-bold text-black leading-none">
                          IMDb
                        </span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {movieDetails.score.toFixed(1)}
                          <span className="text-zinc-400">/10</span>
                        </span>
                      </div>
                    )}
                    {movieDetails.runtime && (
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {Math.floor(movieDetails.runtime / 60)}h
                        {movieDetails.runtime % 60 > 0
                          ? `${movieDetails.runtime % 60}min`
                          : ""}
                      </span>
                    )}
                    {movieDetails.year && (
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {movieDetails.year}
                      </span>
                    )}
                  </div>
                )}
                {displayGenres.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                    {displayGenres.map((genre) => (
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
              <div className="flex flex-row items-center gap-3 w-full md:w-auto justify-center md:justify-start">
                <WatchlistButton
                  mediaType="SERIES"
                  mediaId={movie.id}
                  slug={movie.slug}
                  initialInWatchlist={false}
                  isLoggedIn={false}
                  hasBorder={true}
                  roundedFull={true}
                />
                <AddToListButton
                  seriesId={movie.id}
                  isLoggedIn={false}
                  hasBorder={true}
                  roundedFull={true}
                />
                <ShareButton hasBorder={true} roundedFull={true} />
              </div>
              {(movieDetails.description || movie.description) && (
                <div className="w-full">
                  <MediaDescricao
                    description={
                      movieDetails.description || movie.description || ""
                    }
                    rating={movieDetails.rating || movie.rating || undefined}
                    genres={
                      movieDetails.genres.length > 0
                        ? movieDetails.genres
                        : movie.genres
                    }
                    year={movieDetails.year || undefined}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Player Section */}
      <main id="player" className="mx-auto max-w-[1223px] py-6">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Player
            </h2>
            <div className="mt-1 flex items-center gap-2 text-sm font-medium text-zinc-500">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              {activePlayer === 1
                ? "Servidor Principal (HD)"
                : activePlayer === 2
                ? "Servidor MGEB (HD)"
                : activePlayer === 3
                ? "Servidor SuperFlix (HD)"
                : activePlayer === 4
                ? "Servidor MyEmbed (HD)"
                : activePlayer === 5
                ? "Servidor 2Embed (HD)"
                : "Servidor Desconhecido"}
            </div>
          </div>

          {(hasScrapedUrl || movie.tmdbId) && (
            <div className="flex flex-wrap gap-2">
              {hasScrapedUrl && (
                <a
                  href="?player=1#player"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activePlayer === 1
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                      : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  Principal
                </a>
              )}
              {movie.tmdbId && (
                <a
                  href="?player=2#player"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activePlayer === 2
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                      : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  MGEB Player
                </a>
              )}
              {movie.tmdbId && (
                <a
                  href="?player=3#player"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activePlayer === 3
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                      : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  SuperFlix Player
                </a>
              )}
              {movie.tmdbId && (
                <a
                  href="?player=4#player"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activePlayer === 4
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                      : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  MyEmbed Player
                </a>
              )}
              {movie.tmdbId && (
                <a
                  href="?player=5#player"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activePlayer === 5
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                      : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  2Embed Player
                </a>
              )}
            </div>
          )}
        </div>

        <div className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800">
          {currentVideoUrl ? (
            isDirectVideo ? (
              <video
                src={currentVideoUrl}
                controls
                className="h-full w-full"
                poster={movie.imageUrl || undefined}
              />
            ) : (
              <iframe
                src={currentVideoUrl}
                className="absolute inset-0 h-full w-full overflow-y-auto border-0"
                allowFullScreen
                scrolling="auto"
                allow="autoplay; fullscreen; picture-in-picture"
                title={`Player para ${movie.title}`}
              />
            )
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-zinc-500">
              <p>O vídeo deste filme ainda está sendo processado.</p>
            </div>
          )}
        </div>
      </main>

      {similarMovies.length > 0 && (
        <div className="pb-12">
          <MediaCarousel
            title="Recomendados"
            subtitle="Baseado nos gêneros deste filme"
            items={similarMovies}
            type="movie"
          />
        </div>
      )}
    </div>
  );
}
