import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WatchlistButton } from "@/components/WatchlistButton";
import { getAuthenticatedUserId, isInWatchlist } from "@/lib/watchlist";
import ShareButton from "@/components/ShareButton";

interface MovieWatchPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ player?: string }>;
}

export async function generateMetadata({
  params,
}: MovieWatchPageProps): Promise<Metadata> {
  const { slug } = await params;
  const movie = await prisma.movie.findUnique({ where: { slug } });

  if (!movie) return { title: "Filme não encontrado" };

  return {
    title: `Assistir ${movie.title} Online em HD - PrimerTv`,
    description: `Assista ao filme ${movie.title} online grátis em HD no PrimerTv.`,
  };
}

export default async function MovieWatchPage({
  params,
  searchParams,
}: MovieWatchPageProps) {
  const { slug } = await params;
  const { player } = await searchParams;

  const movie = await prisma.movie.findUnique({
    where: { slug },
  });

  if (!movie) {
    notFound();
  }

  // Resolve active player URL
  const isMgebUrl = movie.videoUrl?.includes("mgeb.top");
  const isSuperflixUrl = movie.videoUrl?.includes("superflixapi.lifestyle");
  const isMyembedUrl = movie.videoUrl?.includes("myembed.biz");
  const is2embedUrl = movie.videoUrl?.includes("2embed.cc");
  const isEmbedplayUrl = movie.videoUrl?.includes("embedplayapi.top");
  const hasScrapedUrl =
    movie.videoUrl &&
    !isMgebUrl &&
    !isSuperflixUrl &&
    !isMyembedUrl &&
    !is2embedUrl &&
    !isEmbedplayUrl;

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
  } else if (selectedPlayerStr === "6" && movie.tmdbId) {
    activePlayer = 6;
    currentVideoUrl = `https://embedplayapi.top/embed/${movie.tmdbId}`;
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
    } else if (activePlayer === 6 && movie.tmdbId) {
      currentVideoUrl = `https://embedplayapi.top/embed/${movie.tmdbId}`;
    } else {
      currentVideoUrl = movie.videoUrl;
    }
  }

  // Simple heuristic to check if it's a video file or an embed
  const isDirectVideo =
    currentVideoUrl?.endsWith(".mp4") || currentVideoUrl?.endsWith(".m3u8");

  const userId = await getAuthenticatedUserId();
  const inWatchlist = await isInWatchlist("SERIES", movie.id);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50">
      <main className="mx-auto max-w-5xl">
        {/* Player Container */}
        <div className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl">
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

        {/* Controls & Title Below Player */}
        <div className="mt-6 flex flex-col gap-6">
          {/* Player Selector Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Selecione o Player
              </h3>
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
                          : activePlayer === 6
                            ? "Servidor EmbedPlay (HD)"
                            : "Servidor Desconhecido"}
              </div>
            </div>

            {(hasScrapedUrl || movie.tmdbId) && (
              <div className="flex flex-wrap gap-2">
                {hasScrapedUrl && (
                  <Link
                    href="?player=1"
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      activePlayer === 1
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    Principal
                  </Link>
                )}
                {movie.tmdbId && (
                  <Link
                    href="?player=2"
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      activePlayer === 2
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    MGEB Player
                  </Link>
                )}
                {movie.tmdbId && (
                  <Link
                    href="?player=3"
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      activePlayer === 3
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    SuperFlix Player
                  </Link>
                )}
                {movie.tmdbId && (
                  <Link
                    href="?player=4"
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      activePlayer === 4
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    MyEmbed Player
                  </Link>
                )}
                {movie.tmdbId && (
                  <Link
                    href="?player=5"
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      activePlayer === 5
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    2Embed Player
                  </Link>
                )}
                {movie.tmdbId && (
                  <Link
                    href="?player=6"
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      activePlayer === 6
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    EmbedPlay Player
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Title & Description Below Player */}
          <div>
            <div className="flex items-center justify-between w-full pb-2">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {movie.title}
              </h1>
              <div className="flex items-center gap-3">
                <WatchlistButton
                  mediaType="SERIES"
                  mediaId={movie.id}
                  slug={movie.slug}
                  initialInWatchlist={inWatchlist}
                  isLoggedIn={Boolean(userId)}
                  hasBorder={false}
                />
                <ShareButton hasBorder={false} />
              </div>
            </div>
            {movie.description && (
              <p className="mt-4 text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed max-w-3xl">
                {movie.description}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
