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
import {
  getAnimeDetailsBySlug,
  getSeriesDetailsBySlug,
} from "@/lib/media-details";
import RatingBadge from "@/components/RatingBadge";
import { VoteButtons } from "@/components/VoteButtons";
import { PlayerDropdown } from "@/components/PlayerDropdown";
import { parseCustomPlayerLine } from "@/lib/player-utils";
import { CommentsSection } from "@/components/CommentsSection";
import { getSession } from "@/lib/auth";
import { buildMergedSeasons } from "@/lib/seasons";
import { getSeriesTmdbSeasons } from "@/lib/tmdb";

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

  const { locale, publicId, slug } = await params;
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
      const extSeries = await getSeriesDetailsBySlug(publicId);
      if (extSeries && (extSeries.tmdbId || extSeries.imdbId)) {
        const match = slug ? slug.match(/\d+/) : null;
        const epNum = Number(episode || (match ? match[0] : 1));
        title = t("seriesMetaTitle", {
          title: extSeries.title,
          number: epNum,
        });
        description = t("seriesMetaDescription", {
          number: epNum,
          title: extSeries.title,
        });
        imageUrl = extSeries.imageUrl;
      } else {
        // Try Movie
        const decoded = decodeURIComponent(publicId);
        const slugified = decoded.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\-]+/g, "").replace(/-+/g, "-");
        const movie =
          (await prisma.movie.findUnique({
            where: { publicId },
          })) ||
          (await prisma.movie.findUnique({
            where: { id: publicId },
          })) ||
          (await prisma.movie.findFirst({
            where: {
              OR: [
                { slug: decoded },
                { slug: slugified },
                { slug: publicId },
              ],
            },
          }));

        if (movie) {
          title = t("movieMetaTitle", { title: movie.title });
          description = t("movieMetaDescription", { title: movie.title });
          imageUrl = movie.imageUrl;
        }
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
  const tLabels = await getTranslations("Labels");
  const { locale, publicId, slug } = await params;
  const { player, source, episode, season } = (await searchParams) || {};
  const session = await getSession();
  const currentUser = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }
    : null;

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
      animeEpisode.customPlayers.forEach((line, idx) => {
        const parsed = parseCustomPlayerLine(line, playersList.length + 1);
        if (parsed && parsed.url) {
          playersList.push({
            id: `custom-${idx}`,
            label: parsed.label,
            url: parsed.url,
          });
        }
      });
    }

    const megaPlayPlayers = await getMegaPlayAnimePlayers(
      JSON.stringify({
        anilistId: animeEpisode.season.anime.anilistId,
        malId: animeEpisode.season.anime.malId,
        seasonAnilistId: animeEpisode.season.anilistId,
        seasonMalId: animeEpisode.season.malId,
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
            <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1 sm:px-0">
              {/* Player Container */}
              <div className="group relative aspect-video rounded-xl w-full overflow-hidden bg-black shadow-2xl">
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
                      size={20}
                    />
                    <ShareButton size={20} />
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
                          ? `E${animeEpisode.number} - ${animeEpisode.title}`
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
            <div className="lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:row-span-2 px-4 sm:px-0">
              <div className="sticky top-20">
                <AnimeEpisodeSidebar
                  seasons={await buildMergedSeasons({
                    animeSlug: animeEpisode.season.anime.slug,
                    animeTitle: animeEpisode.season.anime.title,
                    animeAnilistId: animeEpisode.season.anime.anilistId,
                    animeMalId: animeEpisode.season.anime.malId,
                    animeTitleEnglish: animeEpisode.season.anime.titleEnglish,
                    localSeasons: animeEpisode.season.anime.seasons,
                  })}
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

            {/* Comments Section */}
            <div className="lg:col-span-2 lg:col-start-1 lg:row-start-2 px-4 lg:px-0">
              <CommentsSection
                targetId={animeEpisode.id}
                currentUser={currentUser}
              />
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
    const targetSeasonObj = anime.seasons?.find(
      (s) => s.number === parsedSeason,
    );
    const sourceKey = JSON.stringify({
      anilistId: anime.anilistId,
      malId: anime.malId,
      seasonAnilistId: targetSeasonObj?.anilistId,
      seasonMalId: targetSeasonObj?.malId,
      title: targetSeasonObj?.title
        ? `${anime.title} ${targetSeasonObj.title}`
        : anime.title,
      titleEnglish: anime.titleEnglish,
      slug: anime.slug,
      seasonNumber: parsedSeason,
    });

    const mergedSeasons = await buildMergedSeasons({
      animeSlug: anime.slug,
      animeTitle: anime.title,
      animeAnilistId: anime.anilistId,
      animeMalId: anime.malId,
      animeTitleEnglish: anime.titleEnglish,
      localSeasons: anime.seasons,
    });

    const currentSeasonObj = mergedSeasons.find(
      (s) => s.number === parsedSeason,
    );
    const episodeItems = currentSeasonObj?.episodes || [];
    const currentEpObj = currentSeasonObj?.episodes.find(
      (e) => e.number === episodeNumber,
    );
    const currentEpisodeId =
      currentEpObj?.id || `megaplay-s${parsedSeason}-${episodeNumber}`;

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
            <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1 px-4 sm:px-0">
              {/* Player Container */}
              <div className="group relative aspect-video rounded-xl w-full overflow-hidden bg-black shadow-2xl">
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
            <div className="lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:row-span-2 px-4 sm:px-0">
              <div className="sticky top-20">
                {mergedSeasons.length > 0 ? (
                  <AnimeEpisodeSidebar
                    seasons={mergedSeasons}
                    currentEpisodeId={currentEpisodeId}
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

            {/* Comments Section */}
            <div className="lg:col-span-2 lg:col-start-1 lg:row-start-2 px-4 sm:px-0">
              <CommentsSection
                targetId={`megaplay-${anime.slug}-${episodeNumber}`}
                currentUser={currentUser}
              />
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
    const imdbId = seriesEpisode.season.series.imdbId;
    const externalId = tmdbId || imdbId;
    const seriesFallbackUrl =
      allEpisodes.find((ep) => ep.videoUrl)?.videoUrl || null;
    const scrapedUrl = seriesEpisode.videoUrl || seriesFallbackUrl;
    const hasScrapedUrl = !!scrapedUrl;

    let defaultPlayer = 1;
    if (hasScrapedUrl) {
      defaultPlayer = 1;
    } else if (externalId) {
      defaultPlayer = 2;
    }

    let activePlayer = defaultPlayer;
    let currentVideoUrl = scrapedUrl;

    const selectedPlayerStr = player;
    if (selectedPlayerStr === "2" && externalId) {
      activePlayer = 2;
      currentVideoUrl = `https://superflixapi.lifestyle/serie/${externalId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
    } else if (selectedPlayerStr === "3" && externalId) {
      activePlayer = 3;
      currentVideoUrl = `https://myembed.biz/serie/${externalId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
    } else if (selectedPlayerStr === "4" && externalId) {
      activePlayer = 4;
      currentVideoUrl = `https://mgeb.top/embed/${externalId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
    } else if (selectedPlayerStr === "5" && externalId) {
      activePlayer = 5;
      currentVideoUrl = `https://embedplayapi.top/embed/${externalId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
    } else if (selectedPlayerStr === "6" && externalId) {
      activePlayer = 6;
      currentVideoUrl = `https://vidnest.fun/tv/${externalId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
    } else if (selectedPlayerStr === "1" && hasScrapedUrl) {
      activePlayer = 1;
      currentVideoUrl = scrapedUrl;
    } else {
      activePlayer = defaultPlayer;
      if (activePlayer === 2 && externalId) {
        currentVideoUrl = `https://superflixapi.lifestyle/serie/${externalId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
      } else if (activePlayer === 3 && externalId) {
        currentVideoUrl = `https://myembed.biz/serie/${externalId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
      } else if (activePlayer === 4 && externalId) {
        currentVideoUrl = `https://mgeb.top/embed/${externalId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
      } else if (activePlayer === 5 && externalId) {
        currentVideoUrl = `https://embedplayapi.top/embed/${externalId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
      } else if (activePlayer === 6 && externalId) {
        currentVideoUrl = `https://vidnest.fun/tv/${externalId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
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
    if (externalId) {
      [2, 3, 4, 5, 6].forEach((num) => {
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
            <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1 px-4 sm:px-0">
              {/* Player Container */}
              <div className="group relative aspect-video rounded-xl w-full overflow-hidden bg-black shadow-2xl">
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
            <div className="lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:row-span-2 px-4 sm:px-0">
              <div className="sticky top-20">
                <SeriesEpisodeSidebar
                  seasons={seriesEpisode.season.series.seasons}
                  currentEpisodeId={seriesEpisode.id}
                  seriesSlug={seriesEpisode.season.series.slug}
                  seriesRating={seriesEpisode.season.series.rating}
                  seriesImageUrl={seriesEpisode.season.series.imageUrl}
                />
              </div>
            </div>

            {/* Comments Section */}
            <div className="lg:col-span-2 lg:col-start-1 lg:row-start-2 px-4 sm:px-0">
              <CommentsSection
                targetId={seriesEpisode.id}
                currentUser={currentUser}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!seriesEpisode) {
    const extSeries = await getSeriesDetailsBySlug(publicId);
    if (extSeries && (extSeries.tmdbId || extSeries.imdbId)) {
      const externalId = extSeries.tmdbId || extSeries.imdbId;
      const seasonNum = Number(season || 1);
      const epNum = Number(episode || (slug.match(/\d+/) ? slug.match(/\d+/)?.[0] : 1));

      let activePlayer = 1;
      if (player === "2") activePlayer = 2;
      else if (player === "3") activePlayer = 3;
      else if (player === "4") activePlayer = 4;
      else if (player === "5") activePlayer = 5;

      let currentVideoUrl = `https://vidnest.fun/tv/${externalId}/${seasonNum}/${epNum}`;
      if (activePlayer === 2) {
        currentVideoUrl = `https://superflixapi.lifestyle/serie/${externalId}/${seasonNum}/${epNum}`;
      } else if (activePlayer === 3) {
        currentVideoUrl = `https://myembed.biz/serie/${externalId}/${seasonNum}/${epNum}`;
      } else if (activePlayer === 4) {
        currentVideoUrl = `https://mgeb.top/embed/${externalId}/${seasonNum}/${epNum}`;
      } else if (activePlayer === 5) {
        currentVideoUrl = `https://embedplayapi.top/embed/${externalId}/${seasonNum}/${epNum}`;
      }

      const seriesPlayerOptions = [
        { id: "1", label: t("playerLabel", { number: 1 }), href: "?player=1" },
        { id: "2", label: t("playerLabel", { number: 2 }), href: "?player=2" },
        { id: "3", label: t("playerLabel", { number: 3 }), href: "?player=3" },
        { id: "4", label: t("playerLabel", { number: 4 }), href: "?player=4" },
        { id: "5", label: t("playerLabel", { number: 5 }), href: "?player=5" },
      ];

      const tmdbSeasons = await getSeriesTmdbSeasons(externalId!);
      const seasonsForSidebar =
        tmdbSeasons && tmdbSeasons.length > 0
          ? tmdbSeasons.map((s) => ({
              id: s.id,
              number: s.number,
              episodes: s.episodes.map((ep) => ({
                id: ep.id,
                number: ep.number,
                title: ep.title,
                videoUrl: null,
                publicId: null,
                slug: `episode-${ep.number}`,
                href: `/watch/${extSeries.slug}/episode-${ep.number}?season=${s.number}&episode=${ep.number}&source=vidnest`,
              })),
            }))
          : [
              {
                id: "default-season-1",
                number: 1,
                episodes: Array.from({ length: 8 }, (_, i) => ({
                  id: `default-s1-e${i + 1}`,
                  number: i + 1,
                  title: `Episódio ${i + 1}`,
                  videoUrl: null,
                  publicId: null,
                  slug: `episode-${i + 1}`,
                  href: `/watch/${extSeries.slug}/episode-${i + 1}?season=1&episode=${i + 1}&source=vidnest`,
                })),
              },
            ];

      const currentEpId =
        seasonsForSidebar
          .find((s) => s.number === seasonNum)
          ?.episodes.find((e) => e.number === epNum)?.id ||
        seasonsForSidebar[0]?.episodes[0]?.id ||
        `tmdb-s${seasonNum}-e${epNum}`;

      return (
        <div className="min-h-screen bg-[#0E0E0E] text-zinc-50">
          <main className="w-full px-4 pb-6 md:pb-10 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-3 pt-4 sm:pt-6">
              {/* Main Content: Player & Info */}
              <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1 px-4 sm:px-0">
                <div className="group relative aspect-video rounded-xl w-full overflow-hidden bg-black shadow-2xl">
                  <iframe
                    src={currentVideoUrl}
                    className="w-full aspect-video"
                    allowFullScreen
                    title={`${extSeries.title} - S${seasonNum}E${epNum}`}
                  />
                </div>

                <div className="flex flex-col gap-6 mt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                    <PlayerDropdown
                      players={seriesPlayerOptions}
                      activePlayerId={String(activePlayer)}
                    />
                    <div className="flex items-center gap-2">
                      <WatchlistButton
                        mediaType="SERIES"
                        mediaId={extSeries.id}
                        slug={extSeries.slug}
                        initialInWatchlist={false}
                        isLoggedIn={!!session?.user}
                      />
                      <ShareButton />
                    </div>
                  </div>

                  <div>
                    <h1 className="text-xl font-bold md:text-2xl text-white">
                      <Link
                        href={`/series/${extSeries.slug}`}
                        className="text-blue-400 hover:text-[#f2f2f2] transition-colors hover:underline"
                      >
                        {extSeries.title}
                      </Link>{" "}
                      - {tLabels("episode")} {epNum} (T{seasonNum})
                    </h1>
                  </div>
                  <div className="mt-4">
                    <ExpandableDescription
                      description={extSeries.description || t("noDescription")}
                    />
                  </div>
                </div>
              </div>

              {/* Sidebar: Episode List */}
              <div className="lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:row-span-2 px-4 sm:px-0">
                <div className="sticky top-20">
                  <SeriesEpisodeSidebar
                    seasons={seasonsForSidebar}
                    currentEpisodeId={currentEpId}
                    seriesSlug={extSeries.slug}
                    seriesRating={extSeries.rating}
                    seriesImageUrl={extSeries.imageUrl}
                  />
                </div>
              </div>

              {/* Comments Section */}
              <div className="lg:col-span-2 lg:col-start-1 lg:row-start-2 px-4 sm:px-0">
                <CommentsSection
                  targetId={`extseries-${extSeries.slug}-s${seasonNum}-e${epNum}`}
                  currentUser={currentUser}
                />
              </div>
            </div>
          </main>
        </div>
      );
    }
  }

  // 3. Try fetching Movie
  const decodedPublicId = decodeURIComponent(publicId);
  const slugifiedPublicId = decodedPublicId.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\-]+/g, "").replace(/-+/g, "-");
  const movie =
    (await prisma.movie.findUnique({
      where: { publicId },
    })) ||
    (await prisma.movie.findUnique({
      where: { id: publicId },
    })) ||
    (await prisma.movie.findFirst({
      where: {
        OR: [
          { slug: decodedPublicId },
          { slug: slugifiedPublicId },
          { slug: publicId },
        ],
      },
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
    const isVidnestUrl = movie.videoUrl?.includes("vidnest.fun");
    const hasScrapedUrl =
      movie.videoUrl &&
      !isMgebUrl &&
      !isSuperflixUrl &&
      !isMyembedUrl &&
      !is2embedUrl &&
      !isEmbedplayUrl &&
      !isVidnestUrl;

    let currentVideoUrl = movie.videoUrl;
    let activePlayer = 1;

    const movieExternalId = movie.tmdbId || movie.imdbId;

    // Decide default player if none is explicitly selected
    let defaultPlayer = 1;
    if (hasScrapedUrl) {
      defaultPlayer = 1;
    } else if (movieExternalId) {
      defaultPlayer = 2; // Default to MGEB if no scraped URL exists
    }

    // Set active player and current URL
    const selectedPlayerStr = player;
    if (selectedPlayerStr === "2" && movieExternalId) {
      activePlayer = 2;
      currentVideoUrl = `https://mgeb.top/embed/${movieExternalId}`;
    } else if (selectedPlayerStr === "3" && movieExternalId) {
      activePlayer = 3;
      currentVideoUrl = `https://superflixapi.lifestyle/filme/${movieExternalId}`;
    } else if (selectedPlayerStr === "4" && movieExternalId) {
      activePlayer = 4;
      currentVideoUrl = `https://myembed.biz/filme/${movieExternalId}`;
    } else if (selectedPlayerStr === "5" && movieExternalId) {
      activePlayer = 5;
      currentVideoUrl = `https://www.2embed.cc/embed/${movieExternalId}`;
    } else if (selectedPlayerStr === "6" && movieExternalId) {
      activePlayer = 6;
      currentVideoUrl = `https://embedplayapi.top/embed/${movieExternalId}`;
    } else if (selectedPlayerStr === "7" && movieExternalId) {
      activePlayer = 7;
      currentVideoUrl = `https://vidnest.fun/movie/${movieExternalId}`;
    } else if (selectedPlayerStr === "1" && hasScrapedUrl) {
      activePlayer = 1;
      currentVideoUrl = movie.videoUrl;
    } else {
      // If no option or invalid option selected, use the default player
      activePlayer = defaultPlayer;
      if (activePlayer === 2 && movieExternalId) {
        currentVideoUrl = `https://mgeb.top/embed/${movieExternalId}`;
      } else if (activePlayer === 3 && movieExternalId) {
        currentVideoUrl = `https://superflixapi.lifestyle/filme/${movieExternalId}`;
      } else if (activePlayer === 4 && movieExternalId) {
        currentVideoUrl = `https://myembed.biz/filme/${movieExternalId}`;
      } else if (activePlayer === 5 && movieExternalId) {
        currentVideoUrl = `https://www.2embed.cc/embed/${movieExternalId}`;
      } else if (activePlayer === 6 && movieExternalId) {
        currentVideoUrl = `https://embedplayapi.top/embed/${movieExternalId}`;
      } else if (activePlayer === 7 && movieExternalId) {
        currentVideoUrl = `https://vidnest.fun/movie/${movieExternalId}`;
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
    if (movieExternalId) {
      [2, 3, 4, 5, 6, 7].forEach((num) => {
        moviePlayerOptions.push({
          id: String(num),
          label: `Player ${num}`,
          href: `?player=${num}`,
        });
      });
    }

    return (
      <div className="min-h-screen bg-[#0E0E0E] text-zinc-50">
        <main className="w-full px-4 pb-6 md:pb-10 lg:px-8 max-w-5xl mx-auto pt-4 sm:pt-6">
          {/* Player Container */}
          <div className="group relative aspect-video rounded-xl w-full overflow-hidden bg-black shadow-2xl">
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
              <CommentsSection targetId={movie.id} currentUser={currentUser} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 3. Neither found
  notFound();
}
