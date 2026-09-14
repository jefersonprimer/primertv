import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnimeDetailsBySlug } from "@/lib/media-details";
import { getMegaPlayAnimePlayers } from "@/lib/anikoto";
import { parseCustomPlayerLine } from "@/lib/player-utils";
import { resolvePlayableUrl } from "@/lib/playable-url";
import { buildMergedSeasons } from "@/lib/seasons";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const episodeId = searchParams.get("episodeId") || "";
    const slug = searchParams.get("slug") || "";
    const season = Number(searchParams.get("season") || 1);
    const episodeNum = Number(searchParams.get("episode") || 1);
    const source = searchParams.get("source") || "";
    const player = searchParams.get("player") || "";

    let animeEpisode: any = null;

    if (episodeId && !episodeId.startsWith("fallback-") && !episodeId.startsWith("megaplay-")) {
      animeEpisode = await prisma.episode.findUnique({
        where: { id: episodeId },
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
          where: { publicId: episodeId },
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
    }

    // Se encontramos o episódio no banco de dados local
    if (animeEpisode && source !== "megaplay") {
      const anime = animeEpisode.season.anime;
      const seasonNumber = animeEpisode.season.number;
      const currentNumber = animeEpisode.number;

      const playersList: { id: string; label: string; url: string }[] = [];

      if (animeEpisode.videoUrl) {
        playersList.push({
          id: "principal",
          label: "Player 1",
          url: animeEpisode.videoUrl,
        });
      }

      if (animeEpisode.customPlayers && animeEpisode.customPlayers.length > 0) {
        animeEpisode.customPlayers.forEach((line: string, idx: number) => {
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

      try {
        const megaPlayPlayers = await getMegaPlayAnimePlayers(
          JSON.stringify({
            anilistId: anime.anilistId,
            malId: anime.malId,
            seasonAnilistId: animeEpisode.season.anilistId,
            seasonMalId: animeEpisode.season.malId,
            title: anime.title,
            titleEnglish: anime.titleEnglish,
            slug: anime.slug,
            seasonNumber: animeEpisode.season.number,
          }),
          animeEpisode.number
        );
        megaPlayPlayers.forEach((p) => playersList.push(p));
      } catch (err) {
        console.warn("Falha ao buscar MegaPlay players para episódio local:", err);
      }

      const selectedPlayerId = player || (playersList.length > 0 ? playersList[0].id : "");
      const activePlayerObj =
        playersList.find((p) => p.id === selectedPlayerId) || playersList[0];

      let playableUrl: string | null = null;
      if (activePlayerObj) {
        playableUrl =
          activePlayerObj.id === "principal"
            ? ((await resolvePlayableUrl(activePlayerObj.url)) ?? activePlayerObj.url)
            : activePlayerObj.url;
      }

      const allEpisodesInSeason: any[] = animeEpisode.season.episodes || [];
      const currentIndex = allEpisodesInSeason.findIndex((ep) => ep.number === currentNumber);
      const prevEp = currentIndex > 0 ? allEpisodesInSeason[currentIndex - 1] : null;
      const nextEp =
        currentIndex >= 0 && currentIndex < allEpisodesInSeason.length - 1
          ? allEpisodesInSeason[currentIndex + 1]
          : null;

      return NextResponse.json(
        {
          anime: {
            id: anime.id,
            title: anime.title,
            slug: anime.slug,
            bannerUrl: anime.bannerUrl,
            imageUrl: anime.imageUrl,
            rating: anime.rating,
          },
          episode: {
            id: animeEpisode.id,
            number: currentNumber,
            seasonNumber,
            title: animeEpisode.title || `Episódio ${currentNumber}`,
          },
          players: playersList,
          activePlayerUrl: playableUrl,
          activePlayerId: activePlayerObj?.id || "",
          prevEpisode: prevEp
            ? {
                id: prevEp.id,
                number: prevEp.number,
                seasonNumber,
                title: prevEp.title || `Episódio ${prevEp.number}`,
              }
            : null,
          nextEpisode: nextEp
            ? {
                id: nextEp.id,
                number: nextEp.number,
                seasonNumber,
                title: nextEp.title || `Episódio ${nextEp.number}`,
              }
            : null,
        },
        { headers: corsHeaders }
      );
    }

    // Caso seja fallback ou externo (ex: MegaPlay ou busca por slug)
    const targetSlug = slug || (animeEpisode ? animeEpisode.season.anime.slug : "");
    if (!targetSlug) {
      return NextResponse.json(
        { error: "Identificador do anime ou episódio ausente" },
        { status: 400, headers: corsHeaders }
      );
    }

    const anime = await getAnimeDetailsBySlug(targetSlug);
    if (!anime) {
      return NextResponse.json(
        { error: "Anime não encontrado" },
        { status: 404, headers: corsHeaders }
      );
    }

    const parsedSeason = season > 0 ? season : 1;
    const parsedEpisode = episodeNum > 0 ? episodeNum : 1;

    const targetSeasonObj = anime.seasons?.find((s) => s.number === parsedSeason);
    const sourceKey = JSON.stringify({
      anilistId: anime.anilistId,
      malId: anime.malId,
      seasonAnilistId: targetSeasonObj?.anilistId,
      seasonMalId: targetSeasonObj?.malId,
      title: targetSeasonObj?.title ? `${anime.title} ${targetSeasonObj.title}` : anime.title,
      titleEnglish: anime.titleEnglish,
      slug: anime.slug,
      seasonNumber: parsedSeason,
    });

    const playersList = await getMegaPlayAnimePlayers(sourceKey, parsedEpisode);
    const selectedPlayerId = player || (playersList.length > 0 ? playersList[0].id : "");
    const activePlayerObj =
      playersList.find((candidate) => candidate.id === selectedPlayerId) || playersList[0];
    const playableUrl = activePlayerObj?.url || null;

    // Calcular próximo e anterior
    let mergedSeasons: any[] = [];
    try {
      mergedSeasons = await buildMergedSeasons({
        animeSlug: anime.slug,
        animeTitle: anime.title,
        animeAnilistId: anime.anilistId,
        animeMalId: anime.malId,
        animeTitleEnglish: anime.titleEnglish,
        localSeasons: anime.seasons || [],
      });
    } catch {
      mergedSeasons = [];
    }

    const currentSeasonObj = mergedSeasons.find((s) => s.number === parsedSeason);
    const episodeItems: any[] = currentSeasonObj?.episodes || [];
    const currentIndex = episodeItems.findIndex((e) => e.number === parsedEpisode);
    const prevEp = currentIndex > 0 ? episodeItems[currentIndex - 1] : null;
    const nextEp =
      currentIndex >= 0 && currentIndex < episodeItems.length - 1
        ? episodeItems[currentIndex + 1]
        : null;

    return NextResponse.json(
      {
        anime: {
          id: anime.id,
          title: anime.title,
          slug: anime.slug,
          bannerUrl: anime.bannerUrl,
          imageUrl: anime.imageUrl,
          rating: anime.rating,
        },
        episode: {
          id: `ep-${parsedSeason}-${parsedEpisode}`,
          number: parsedEpisode,
          seasonNumber: parsedSeason,
          title: `Episódio ${parsedEpisode}`,
        },
        players: playersList,
        activePlayerUrl: playableUrl,
        activePlayerId: activePlayerObj?.id || "",
        prevEpisode: prevEp
          ? {
              id: prevEp.id,
              number: prevEp.number,
              seasonNumber: parsedSeason,
              title: prevEp.title || `Episódio ${prevEp.number}`,
            }
          : null,
        nextEpisode: nextEp
          ? {
              id: nextEp.id,
              number: nextEp.number,
              seasonNumber: parsedSeason,
              title: nextEp.title || `Episódio ${nextEp.number}`,
            }
          : null,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Erro na rota /api/v1/watch:", error);
    return NextResponse.json(
      { error: "Erro ao carregar dados do player" },
      { status: 500, headers: corsHeaders }
    );
  }
}
