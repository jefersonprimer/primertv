import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Link, redirect } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { connection } from "next/server";
import { resolvePlayableUrl } from "@/lib/playable-url";
import {
  getMegaPlayAnimeCatalog,
  getMegaPlayAnimePlayers,
} from "@/lib/anikoto";
import { recordAnimeWatchHistory } from "@/lib/history";
import { WatchlistButton } from "@/components/WatchlistButton";
import { getAuthenticatedUserId, isInWatchlist } from "@/lib/watchlist";
import AnimeEpisodeSidebar from "./EpisodeSidebar";
import SeriesEpisodeSidebar from "./SeriesEpisodeSidebar";
import ExpandableDescription from "@/components/ExpandableDescription";
import ShareButton from "@/components/ShareButton";
import { getAnimeDetailsBySlug } from "@/lib/media-details";
import RatingBadge from "@/components/RatingBadge";
import { VoteButtons } from "@/components/VoteButtons";
import { PlayerDropdown } from "@/components/PlayerDropdown";

interface WatchPageProps {
  params: Promise<{ locale: string; publicId: string; slug: string }>;
  searchParams?: Promise<{
    player?: string;
    source?: string;
    episode?: string;
    season?: string;
  }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: WatchPageProps): Promise<Metadata> {
  await connection();

  const { locale, publicId } = await params;
  const { source, episode } = (await searchParams) || {};
  const t = await getTranslations({ locale, namespace: "Watch" });

  let title = t("notFound");
  let description = "";
  let imageUrl = null;

  // First try Anime
  let animeEpisode = await prisma.episode.findUnique({
    where: { publicId },
    include: {
      season: {
        include: {
          anime: true,
        },
      },
    },
  });

  if (!animeEpisode) {
    animeEpisode = await prisma.episode.findUnique({
      where: { id: publicId },
      include: {
        season: {
          include: {
            anime: true,
          },
        },
      },
    });
  }

  if (animeEpisode) {
    title = t("animeMetaTitle", {
      title: animeEpisode.season.anime.title,
      number: animeEpisode.number,
    });
    description = t("animeMetaDescription", {
      number: animeEpisode.number,
      title: animeEpisode.season.anime.title,
    });
    imageUrl = animeEpisode.season.anime.imageUrl;
  } else if (source === "megaplay") {
    const anime = await getAnimeDetailsBySlug(publicId);
    const episodeNumber = Number(episode || 0);
    if (anime && Number.isFinite(episodeNumber) && episodeNumber > 0) {
      title = t("megaPlayMetaTitle", {
        title: anime.title,
        number: episodeNumber,
      });
      description = t("megaPlayMetaDescription", {
        number: episodeNumber,
        title: anime.title,
      });
      imageUrl = anime.imageUrl;
    }
  } else {
    // Try Series
    let seriesEpisode = await prisma.seriesEpisode.findUnique({
      where: { publicId },
      include: {
        season: {
          include: {
            series: true,
          },
        },
      },
    });

    if (!seriesEpisode) {
      seriesEpisode = await prisma.seriesEpisode.findUnique({
        where: { id: publicId },
        include: {
          season: {
            include: {
              series: true,
            },
          },
        },
      });
    }

    if (seriesEpisode) {
      title = t("seriesMetaTitle", {
        title: seriesEpisode.season.series.title,
        number: seriesEpisode.number,
      });
      description = t("seriesMetaDescription", {
        number: seriesEpisode.number,
        title: seriesEpisode.season.series.title,
      });
      imageUrl = seriesEpisode.season.series.imageUrl;
    } else {
      // Try Movie
      const movie =
        (await prisma.movie.findUnique({
          where: { publicId },
        })) ||
        (await prisma.movie.findUnique({
          where: { id: publicId },
        }));

      if (movie) {
        title = t("movieMetaTitle", { title: movie.title });
        description = t("movieMetaDescription", { title: movie.title });
        imageUrl = movie.imageUrl;
      }
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
      type: "video.episode",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function WatchPage({
  params,
  searchParams,
}: WatchPageProps) {
  await connection();

  const t = await getTranslations("Watch");
  const tMedia = await getTranslations("MediaCard");
  const { locale, publicId, slug } = await params;
  const { player, source, episode, season } = (await searchParams) || {};

  // 1. Try fetching Anime Episode
  let animeEpisode = await prisma.episode.findUnique({
    where: { publicId },
    include: {
      season: {
        include: {
          anime: {
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
          },
        },
      },
    },
  });

  if (!animeEpisode) {
    animeEpisode = await prisma.episode.findUnique({
      where: { id: publicId },
      include: {
        season: {
          include: {
            anime: {
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
            },
          },
        },
      },
    });
  }

  if (animeEpisode) {
    // Enforce correct slug for SEO
    const expectedSlug = animeEpisode.slug || `episode-${animeEpisode.number}`;
    if (slug !== expectedSlug) {
      redirect({ href: `/watch/${publicId}/${expectedSlug}`, locale });
    }

    await recordAnimeWatchHistory(animeEpisode.id);

    const playersList: { id: string; label: string; url: string }[] = [];

    if (animeEpisode.videoUrl) {
      playersList.push({
        id: "principal",
        label: "Player 1",
        url: animeEpisode.videoUrl,
      });
    }

    if (animeEpisode.customPlayers && animeEpisode.customPlayers.length > 0) {
      animeEpisode.customPlayers.forEach((playerUrl, idx) => {
        const trimmedUrl = playerUrl.trim();
        if (trimmedUrl) {
          playersList.push({
            id: `custom-${idx}`,
            label: `Player ${playersList.length + 1}`,
            url: trimmedUrl,
          });
        }
      });
    }

    const megaPlayPlayers = await getMegaPlayAnimePlayers(
      JSON.stringify({
        anilistId: animeEpisode.season.anime.anilistId,
        malId: animeEpisode.season.anime.malId,
        title: animeEpisode.season.anime.title,
        titleEnglish: animeEpisode.season.anime.titleEnglish,
        slug: animeEpisode.season.anime.slug,
        seasonNumber: animeEpisode.season.number,
      }),
      animeEpisode.number,
    );

    megaPlayPlayers.forEach((playerObj) => {
      playersList.push(playerObj);
    });

    const selectedPlayerId =
      player || (playersList.length > 0 ? playersList[0].id : "");
    const activePlayerObj =
      playersList.find((p) => p.id === selectedPlayerId) || playersList[0];

    const playableUrl = activePlayerObj
      ? activePlayerObj.id === "principal"
        ? ((await resolvePlayableUrl(activePlayerObj.url)) ??
          activePlayerObj.url)
        : activePlayerObj.url
      : null;

    const userId = await getAuthenticatedUserId();
    const inWatchlist = await isInWatchlist(
      "ANIME",
      animeEpisode.season.anime.id,
    );

    const anime = animeEpisode.season.anime;
    const rating = anime.rating;
    const isDubbed = anime.isDubbed;
    const isSubtitled = anime.isSubtitled;

    let initialUserVote = null;
    if (userId) {
      const vote = await prisma.episodeVote.findUnique({
        where: {
          userId_episodeId: { userId, episodeId: animeEpisode.id },
        },
      });
      if (vote) {
        initialUserVote = vote.type;
      }
    }

    return (
      <div className="min-h-screen bg-[#0E0E0E] text-zinc-50">
        <main className="w-full lg:px-4 pb-6 md:pb-10">
          <div className="grid gap-4 lg:grid-cols-3 pt-1 lg:pt-4">
            {/* Main Content: Player & Info / Description */}
            <div className="lg:col-span-2 sm:px-0">
              {/* Player Container */}
              <div className="group relative aspect-video lg:rounded-xl w-full overflow-hidden bg-black shadow-2xl">
                {playableUrl ? (
                  playableUrl.endsWith(".mp4") ||
                  playableUrl.endsWith(".m3u8") ? (
                    <video
                      src={playableUrl}
                      controls
                      className="h-full w-full"
                      poster={
                        animeEpisode.imageUrl ||
                        animeEpisode.season.anime.imageUrl ||
                        undefined
                      }
                    />
                  ) : (
                    <iframe
                      src={playableUrl}
                      className="w-full aspect-video"
                      allowFullScreen
                      title={t("playerTitle", {
                        title: animeEpisode.season.anime.title,
                        number: animeEpisode.number,
                      })}
                    />
                  )
                ) : (
                  <div className="w-full aspect-video flex items-center justify-center bg-zinc-950 text-zinc-400">
                    <p>{t("videoNotAvailable")}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-6 mt-4 px-4 lg:px-0">
                {/* Unified Action Controls Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                  {playersList.length > 0 ? (
                    <PlayerDropdown
                      players={playersList.map((p) => ({
                        id: p.id,
                        label: p.label,
                        href: `?player=${p.id}`,
                      }))}
                      activePlayerId={activePlayerObj?.id || ""}
                    />
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2.5">
                    <VoteButtons
                      episodeId={animeEpisode.id}
                      userId={userId}
                      initialUpvotes={animeEpisode.upvotes}
                      initialDownvotes={animeEpisode.downvotes}
                      initialUserVote={initialUserVote as "UP" | "DOWN" | null}
                    />
                    <WatchlistButton
                      mediaType="ANIME"
                      mediaId={anime.id}
                      slug={anime.slug}
                      initialInWatchlist={inWatchlist}
                      isLoggedIn={Boolean(userId)}
                      size={24}
                    />
                    <ShareButton size={24} />
                  </div>
                </div>

                <div>
                  <div className="flex flex-col items-start">
                    <Link
                      href={`/animes/${anime.slug}`}
                      className="inline-block text-blue-400 hover:text-[#f2f2f2] transition-colors hover:underline"
                    >
                      <h4 className="text-base font-bold">{anime.title}</h4>
                    </Link>

                    {/* Season/Episode label and Metadata (rating, sub/dub) */}
                    <div className="flex flex-col flex-wrap gap-2 tracking-wider mt-1">
                      <h1 className="text-white text-[22px] font-bold line-clamp-2">
                        {animeEpisode.title
                          ? `EP${animeEpisode.number} - ${animeEpisode.title}`
                          : t("seasonEpisodeLabel", {
                              season: animeEpisode.season.number,
                              episode: animeEpisode.number,
                            })}
                      </h1>

                      <div className="flex items-center gap-1">
                        {rating && (
                          <RatingBadge rating={rating} className="h-4 w-4" />
                        )}
                        {(isDubbed || isSubtitled) && (
                          <>
                            <span
                              className="text-[#555] select-none"
                              aria-hidden="true"
                            >
                              •
                            </span>
                            <span className="normal-case text-sm text-[#8c8c8c] font-normal">
                              {isDubbed && isSubtitled
                                ? tMedia("subDub")
                                : isDubbed
                                  ? tMedia("dubbed")
                                  : tMedia("subtitled")}
                            </span>
                          </>
                        )}
                      </div>

                      {animeEpisode.createdAt && (
                        <span className="text-sm text-white font-normal">
                          {t("releasedOn", {
                            date: new Intl.DateTimeFormat(
                              locale === "pt-br" ? "pt-BR" : "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                timeZone: "America/Sao_Paulo",
                              },
                            ).format(new Date(animeEpisode.createdAt)),
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 p-2 bg-[#2B2B2B] rounded-xl">
                    <ExpandableDescription
                      description={
                        animeEpisode.season.anime.description ||
                        t("noDescription")
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar: Episode List */}
            <div className="lg:col-span-1 px-4 sm:px-0">
              <div className="sticky top-4 overflow-hidden">
                <AnimeEpisodeSidebar
                  seasons={animeEpisode.season.anime.seasons}
                  currentEpisodeId={animeEpisode.id}
                  animeSlug={animeEpisode.season.anime.slug}
                  animeRating={animeEpisode.season.anime.rating}
                  animeDuration={animeEpisode.season.anime.duration}
                  fallbackImageUrl={
                    animeEpisode.season.anime.bannerUrl ||
                    animeEpisode.season.anime.imageUrl
                  }
                  isDubbed={animeEpisode.season.anime.isDubbed}
                  isSubtitled={animeEpisode.season.anime.isSubtitled}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (source === "megaplay") {
    const anime = await getAnimeDetailsBySlug(publicId);
    if (!anime) {
      notFound();
    }

    const episodeNumber = Number(episode || slug.match(/\d+/)?.[0] || 0);
    if (!Number.isFinite(episodeNumber) || episodeNumber <= 0) {
      notFound();
    }

    const parsedSeason = season ? Number(season) : 1;
    const sourceKey = JSON.stringify({
      anilistId: anime.anilistId,
      malId: anime.malId,
      title: anime.title,
      titleEnglish: anime.titleEnglish,
      slug: anime.slug,
      seasonNumber: parsedSeason,
    });

    const catalog = await getMegaPlayAnimeCatalog(sourceKey);
    const episodeItems =
      catalog?.episodes.map((catalogEpisode) => ({
        id: `megaplay-${catalogEpisode.number}`,
        number: catalogEpisode.number,
        title: catalogEpisode.title,
        href: `/watch/${anime.slug}/episode-${catalogEpisode.number}?source=megaplay&episode=${catalogEpisode.number}&season=${parsedSeason}`,
        videoUrl: `/watch/${anime.slug}/episode-${catalogEpisode.number}?source=megaplay&episode=${catalogEpisode.number}&season=${parsedSeason}`,
      })) || [];

    const playersList = await getMegaPlayAnimePlayers(sourceKey, episodeNumber);
    const selectedPlayerId =
      player || (playersList.length > 0 ? playersList[0].id : "");
    const activePlayerObj =
      playersList.find((candidate) => candidate.id === selectedPlayerId) ||
      playersList[0];
    const playableUrl = activePlayerObj?.url || null;

    const currentIndex = episodeItems.findIndex(
      (item) => item.number === episodeNumber,
    );
    const prevEpisode =
      currentIndex > 0 ? episodeItems[currentIndex - 1] : null;
    const nextEpisode =
      currentIndex >= 0 && currentIndex < episodeItems.length - 1
        ? episodeItems[currentIndex + 1]
        : null;

    const userId = await getAuthenticatedUserId();
    const inWatchlist = await isInWatchlist("ANIME", anime.id);

    return (
      <div className="min-h-screen bg-[#0E0E0E] text-zinc-50">
        <main className="w-full px-4 pb-6 md:pb-10 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3 pt-4 sm:pt-6">
            {/* Main Content: Player & Info / Description */}
            <div className="lg:col-span-2 px-4 sm:px-0">
              {/* Player Container */}
              <div className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl">
                {playableUrl ? (
                  <iframe
                    src={playableUrl}
                    className="w-full aspect-video"
                    allowFullScreen
                    title={t("megaPlayPlayerTitle", {
                      title: anime.title,
                      number: episodeNumber,
                    })}
                  />
                ) : (
                  <div className="w-full aspect-video flex items-center justify-center bg-zinc-950 text-zinc-400">
                    <p>{t("megaPlayNotAvailable")}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-6 mt-4">
                {/* Unified Action Controls Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                  {playersList.length > 0 ? (
                    <PlayerDropdown
                      players={playersList.map((candidate) => ({
                        id: candidate.id,
                        label: candidate.label,
                        href: `?source=megaplay&episode=${episodeNumber}&player=${candidate.id}`,
                      }))}
                      activePlayerId={activePlayerObj?.id || ""}
                    />
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2.5">
                    <VoteButtons />
                    <WatchlistButton
                      mediaType="ANIME"
                      mediaId={anime.id}
                      slug={anime.slug}
                      initialInWatchlist={inWatchlist}
                      isLoggedIn={Boolean(userId)}
                    />
                    <ShareButton />
                  </div>
                </div>

                <div>
                  <div className="flex flex-col items-start gap-2">
                    <Link
                      href={`/animes/${anime.slug}`}
                      className="inline-block text-blue-400 hover:text-[#f2f2f2] transition-colors hover:underline"
                    >
                      <h4 className="text-base font-bold">{anime.title}</h4>
                    </Link>

                    {/* Episode label and Metadata (rating, sub/dub) */}
                    <div className="flex items-center flex-wrap gap-2 text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                      <span>
                        {t("megaPlayEpisodeLabel", { episode: episodeNumber })}
                      </span>

                      {anime.rating && (
                        <>
                          <span
                            className="text-[#555] select-none"
                            aria-hidden="true"
                          >
                            •
                          </span>
                          <RatingBadge
                            rating={anime.rating}
                            className="h-4 w-4"
                          />
                        </>
                      )}

                      {(anime.isDubbed || anime.isSubtitled) && (
                        <>
                          <span
                            className="text-[#555] select-none"
                            aria-hidden="true"
                          >
                            •
                          </span>
                          <span className="normal-case text-sm text-[#8c8c8c] font-normal">
                            {anime.isDubbed && anime.isSubtitled
                              ? tMedia("subDub")
                              : anime.isDubbed
                                ? tMedia("dubbed")
                                : tMedia("subtitled")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-6">
                    <ExpandableDescription
                      description={anime.description || t("noDescription")}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar: Episode List */}
            <div className="lg:col-span-1 px-4 sm:px-0">
              <div className="sticky top-4 overflow-hidden">
                {episodeItems.length > 0 ? (
                  <AnimeEpisodeSidebar
                    seasons={[
                      {
                        id: `megaplay-season-${parsedSeason}`,
                        number: parsedSeason,
                        episodes: episodeItems.map((item) => ({
                          id: item.id,
                          number: item.number,
                          title: item.title,
                          imageUrl: null,
                          videoUrl: item.videoUrl,
                          publicId: null,
                          slug: `episode-${item.number}`,
                        })),
                      },
                    ]}
                    currentEpisodeId={`megaplay-${episodeNumber}`}
                    animeSlug={anime.slug}
                    animeRating={anime.rating}
                    animeDuration={anime.duration}
                    fallbackImageUrl={anime.imageUrl}
                    isMegaplay={true}
                    isDubbed={anime.isDubbed}
                    isSubtitled={anime.isSubtitled}
                  />
                ) : (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
                    {t("megaPlayNoCatalog")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 2. Try fetching Series Episode
  let seriesEpisode = await prisma.seriesEpisode.findUnique({
    where: { publicId },
    include: {
      season: {
        include: {
          series: {
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
          },
        },
      },
    },
  });

  if (!seriesEpisode) {
    seriesEpisode = await prisma.seriesEpisode.findUnique({
      where: { id: publicId },
      include: {
        season: {
          include: {
            series: {
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
            },
          },
        },
      },
    });
  }

  if (seriesEpisode) {
    // Enforce correct slug for SEO
    const expectedSlug =
      seriesEpisode.slug || `episode-${seriesEpisode.number}`;
    if (slug !== expectedSlug) {
      redirect({ href: `/watch/${publicId}/${expectedSlug}`, locale });
    }

    const seasons = seriesEpisode.season.series.seasons;
    const allEpisodes = seasons.flatMap((s) =>
      s.episodes.map((ep) => ({
        ...ep,
        seasonNumber: s.number,
        seasonId: s.id,
      })),
    );

    const tmdbId = seriesEpisode.season.series.tmdbId;
    const seriesFallbackUrl =
      allEpisodes.find((ep) => ep.videoUrl)?.videoUrl || null;
    const scrapedUrl = seriesEpisode.videoUrl || seriesFallbackUrl;
    const hasScrapedUrl = !!scrapedUrl;

    let defaultPlayer = 1;
    if (hasScrapedUrl) {
      defaultPlayer = 1;
    } else if (tmdbId) {
      defaultPlayer = 2;
    }

    let activePlayer = defaultPlayer;
    let currentVideoUrl = scrapedUrl;

    const selectedPlayerStr = player;
    if (selectedPlayerStr === "2" && tmdbId) {
      activePlayer = 2;
      currentVideoUrl = `https://superflixapi.lifestyle/serie/${tmdbId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
    } else if (selectedPlayerStr === "3" && tmdbId) {
      activePlayer = 3;
      currentVideoUrl = `https://myembed.biz/serie/${tmdbId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
    } else if (selectedPlayerStr === "4" && tmdbId) {
      activePlayer = 4;
      currentVideoUrl = `https://mgeb.top/embed/${tmdbId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
    } else if (selectedPlayerStr === "5" && tmdbId) {
      activePlayer = 5;
      currentVideoUrl = `https://embedplayapi.top/embed/${tmdbId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
    } else if (selectedPlayerStr === "1" && hasScrapedUrl) {
      activePlayer = 1;
      currentVideoUrl = scrapedUrl;
    } else {
      activePlayer = defaultPlayer;
      if (activePlayer === 2 && tmdbId) {
        currentVideoUrl = `https://superflixapi.lifestyle/serie/${tmdbId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
      } else if (activePlayer === 3 && tmdbId) {
        currentVideoUrl = `https://myembed.biz/serie/${tmdbId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
      } else if (activePlayer === 4 && tmdbId) {
        currentVideoUrl = `https://mgeb.top/embed/${tmdbId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
      } else if (activePlayer === 5 && tmdbId) {
        currentVideoUrl = `https://embedplayapi.top/embed/${tmdbId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
      } else {
        currentVideoUrl = scrapedUrl;
      }
    }

    const playableUrl =
      activePlayer === 1 && currentVideoUrl
        ? ((await resolvePlayableUrl(currentVideoUrl)) ?? currentVideoUrl)
        : currentVideoUrl;

    const userId = await getAuthenticatedUserId();
    const inWatchlist = await isInWatchlist(
      "SERIES",
      seriesEpisode.season.series.id,
    );

    const seriesPlayerOptions = [];
    if (hasScrapedUrl) {
      seriesPlayerOptions.push({
        id: "1",
        label: t("playerLabel", { number: 1 }),
        href: "?player=1",
      });
    }
    if (tmdbId) {
      [2, 3, 4, 5].forEach((num) => {
        seriesPlayerOptions.push({
          id: String(num),
          label: t("playerLabel", { number: num }),
          href: `?player=${num}`,
        });
      });
    }

    return (
      <div className="min-h-screen bg-[#0E0E0E] text-zinc-50">
        <main className="w-full px-4 pb-6 md:pb-10 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3 pt-4 sm:pt-6">
            {/* Main Content: Player & Info / Description */}
            <div className="lg:col-span-2 px-4 sm:px-0">
              {/* Player Container */}
              <div className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl">
                {playableUrl ? (
                  playableUrl.endsWith(".mp4") ||
                  playableUrl.endsWith(".m3u8") ? (
                    <video
                      src={playableUrl}
                      controls
                      className="h-full w-full"
                      poster={seriesEpisode.season.series.imageUrl || undefined}
                    />
                  ) : (
                    <iframe
                      src={playableUrl}
                      className="w-full aspect-video"
                      allowFullScreen
                      title={t("playerTitle", {
                        title: seriesEpisode.season.series.title,
                        number: seriesEpisode.number,
                      })}
                    />
                  )
                ) : (
                  <div className="w-full aspect-video flex items-center justify-center bg-zinc-950 text-zinc-400">
                    <p>{t("videoNotAvailable")}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-6 mt-4">
                {/* Unified Action Controls Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                  {seriesPlayerOptions.length > 0 ? (
                    <PlayerDropdown
                      players={seriesPlayerOptions}
                      activePlayerId={String(activePlayer)}
                    />
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2.5">
                    <VoteButtons episodeId={seriesEpisode.id} userId={userId} />
                    <WatchlistButton
                      mediaType="SERIES"
                      mediaId={seriesEpisode.season.series.id}
                      slug={seriesEpisode.season.series.slug}
                      initialInWatchlist={inWatchlist}
                      isLoggedIn={Boolean(userId)}
                    />
                    <ShareButton />
                  </div>
                </div>

                <div>
                  <div className="flex flex-col items-start gap-2">
                    <Link
                      href={`/series/${seriesEpisode.season.series.slug}`}
                      className="inline-block text-blue-400 hover:text-[#f2f2f2] transition-colors hover:underline"
                    >
                      <h4 className="text-base font-bold">
                        {seriesEpisode.season.series.title}
                      </h4>
                    </Link>

                    {/* Season/Episode label and Metadata (rating) */}
                    <div className="flex items-center flex-wrap gap-2 text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                      <span>
                        {seriesEpisode.title
                          ? `EP${seriesEpisode.number} - ${seriesEpisode.title}`
                          : t("seasonEpisodeLabel", {
                              season: seriesEpisode.season.number,
                              episode: seriesEpisode.number,
                            })}
                      </span>

                      {seriesEpisode.season.series.rating && (
                        <>
                          <span
                            className="text-[#555] select-none"
                            aria-hidden="true"
                          >
                            •
                          </span>
                          <RatingBadge
                            rating={seriesEpisode.season.series.rating}
                            className="h-4 w-4"
                          />
                        </>
                      )}
                    </div>

                    {seriesEpisode.createdAt && (
                      <span className="text-xs text-zinc-400 font-normal">
                        {t("releasedOn", {
                          date: new Intl.DateTimeFormat(
                            locale === "pt-br" ? "pt-BR" : "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              timeZone: "America/Sao_Paulo",
                            },
                          ).format(new Date(seriesEpisode.createdAt)),
                        })}
                      </span>
                    )}
                  </div>
                  <div className="mt-6">
                    <ExpandableDescription
                      description={
                        seriesEpisode.season.series.description ||
                        t("noDescription")
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar: Episode List */}
            <div className="lg:col-span-1 px-4 sm:px-0">
              <div className="sticky top-4 overflow-hidden">
                <SeriesEpisodeSidebar
                  seasons={seriesEpisode.season.series.seasons}
                  currentEpisodeId={seriesEpisode.id}
                  seriesSlug={seriesEpisode.season.series.slug}
                  seriesRating={seriesEpisode.season.series.rating}
                  seriesImageUrl={seriesEpisode.season.series.imageUrl}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 3. Try fetching Movie
  const movie =
    (await prisma.movie.findUnique({
      where: { publicId },
    })) ||
    (await prisma.movie.findUnique({
      where: { id: publicId },
    }));

  if (movie) {
    // Enforce correct slug for SEO
    const expectedSlug = movie.slug;
    if (slug !== expectedSlug) {
      redirect({ href: `/watch/${publicId}/${expectedSlug}`, locale });
    }

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

    const playableUrl =
      activePlayer === 1 && currentVideoUrl
        ? ((await resolvePlayableUrl(currentVideoUrl)) ?? currentVideoUrl)
        : currentVideoUrl;

    const isDirectVideo =
      playableUrl?.endsWith(".mp4") || playableUrl?.endsWith(".m3u8");

    const userId = await getAuthenticatedUserId();
    const inWatchlist = await isInWatchlist("SERIES", movie.id);

    const moviePlayerOptions = [];
    if (hasScrapedUrl) {
      moviePlayerOptions.push({
        id: "1",
        label: "Player 1",
        href: "?player=1",
      });
    }
    if (movie.tmdbId) {
      [2, 3, 4, 5, 6].forEach((num) => {
        moviePlayerOptions.push({
          id: String(num),
          label: `Player ${num}`,
          href: `?player=${num}`,
        });
      });
    }

    return (
      <div className="min-h-screen bg-[#0E0E0E] text-zinc-50">
        <main className="w-full px-4 pb-6 md:pb-10 lg:px-8">
          {/* Player Container */}
          <div className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl">
            {playableUrl ? (
              isDirectVideo ? (
                <video
                  src={playableUrl}
                  controls
                  className="h-full w-full"
                  poster={movie.imageUrl || undefined}
                />
              ) : (
                <iframe
                  src={playableUrl}
                  className="absolute inset-0 h-full w-full overflow-y-auto border-0"
                  allowFullScreen
                  scrolling="auto"
                  allow="autoplay; fullscreen; picture-in-picture"
                  title={t("playerTitle", {
                    title: movie.title,
                    number: activePlayer,
                  })}
                />
              )
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-zinc-500">
                <p>{t("processingMovie")}</p>
              </div>
            )}
          </div>

          {/* Controls & Title Below Player */}
          <div className="mt-4 flex flex-col gap-6">
            {/* Unified Action Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              {moviePlayerOptions.length > 0 ? (
                <PlayerDropdown
                  players={moviePlayerOptions}
                  activePlayerId={String(activePlayer)}
                />
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2.5">
                <VoteButtons />
                <WatchlistButton
                  mediaType="SERIES"
                  mediaId={movie.id}
                  slug={movie.slug}
                  initialInWatchlist={inWatchlist}
                  isLoggedIn={Boolean(userId)}
                />
                <ShareButton />
              </div>
            </div>

            <div>
              <div className="flex flex-col items-start gap-2">
                <Link
                  href={`/movies/${movie.slug}`}
                  className="inline-block text-blue-400 hover:text-[#f2f2f2] transition-colors hover:underline"
                >
                  <h4 className="text-base font-bold">{movie.title}</h4>
                </Link>

                {/* Movie label and Metadata (rating) */}
                <div className="flex items-center flex-wrap gap-2 text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                  <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                    {t("movieLabel")}
                  </span>

                  {movie.rating && (
                    <>
                      <span
                        className="text-[#555] select-none"
                        aria-hidden="true"
                      >
                        •
                      </span>
                      <RatingBadge rating={movie.rating} className="h-4 w-4" />
                    </>
                  )}
                </div>

                {(movie.releaseDate || movie.createdAt) && (
                  <span className="text-xs text-zinc-400 font-normal">
                    {t("releasedOn", {
                      date: new Intl.DateTimeFormat(
                        locale === "pt-br" ? "pt-BR" : "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          timeZone: "America/Sao_Paulo",
                        },
                      ).format(new Date(movie.releaseDate || movie.createdAt)),
                    })}
                  </span>
                )}
              </div>
              <div className="mt-6">
                <ExpandableDescription
                  description={movie.description || t("noDescription")}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 3. Neither found
  notFound();
}
