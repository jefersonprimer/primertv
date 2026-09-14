import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnimeDetailsBySlug } from "@/lib/media-details";
import { getAnimeBanner, getAnimeLogo } from "@/lib/banners";
import { buildMergedSeasons } from "@/lib/seasons";
import { getSession } from "@/lib/auth";
import { isInWatchlist } from "@/lib/watchlist";

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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    try {
      require("fs").appendFileSync("/tmp/anime_debug.log", `API GET called with slug=${slug}\n`);
    } catch {}
    if (!slug) {
      return NextResponse.json(
        { error: "Slug é obrigatório" },
        { status: 400, headers: corsHeaders }
      );
    }

    const anime = await getAnimeDetailsBySlug(slug);
    try {
      require("fs").appendFileSync("/tmp/anime_debug.log", `API anime found: ${anime ? anime.id : "null"}\n`);
    } catch {}

    const isStubAnime =
      anime &&
      (anime.slug.startsWith("anime-") || anime.title.startsWith("Anime ")) &&
      !anime.imageUrl &&
      !anime.description &&
      (!anime.seasons || anime.seasons.length === 0);

    if (!anime || isStubAnime) {
      return NextResponse.json(
        { error: "Anime não encontrado" },
        { status: 404, headers: corsHeaders }
      );
    }

    let bannerUrl = anime.bannerUrl;
    if (!bannerUrl) {
      try {
        bannerUrl = await getAnimeBanner(anime.id, anime.title);
      } catch (err) {
        console.warn("Erro ao buscar banner dinâmico:", err);
      }
    }
    const finalBannerUrl = bannerUrl === "none" ? null : bannerUrl;

    let logoUrl = anime.logoUrl;
    if (!logoUrl) {
      try {
        logoUrl = await getAnimeLogo(anime.id, anime.title);
      } catch (err) {
        console.warn("Erro ao buscar logo dinâmico:", err);
      }
    }
    const finalLogoUrl = logoUrl === "none" ? null : logoUrl;

    // Constrói temporadas unificadas (locais + provedor externo)
    let mergedSeasons = [];
    try {
      mergedSeasons = await buildMergedSeasons({
        animeSlug: anime.slug,
        animeTitle: anime.title,
        animeAnilistId: anime.anilistId,
        animeMalId: anime.malId,
        animeTitleEnglish: anime.titleEnglish,
        localSeasons: anime.seasons || [],
        translateEpisode: (num: number) => `Episódio ${num}`,
      });
    } catch (err) {
      console.warn("Erro ao compor temporadas mescladas:", err);
      mergedSeasons = (anime.seasons || []).map((s) => ({
        id: s.id,
        number: s.number,
        title: s.title,
        episodes: (s.episodes || []).map((e) => ({
          id: e.id,
          number: e.number,
          title: e.title,
          href: `/watch/${e.publicId || e.id}/${e.slug || "episode-" + e.number}`,
          videoUrl: e.videoUrl,
          imageUrl: e.imageUrl,
          publicId: e.publicId,
          slug: e.slug,
          createdAt: e.createdAt,
        })),
      }));
    }

    // Identificar primeiro episódio
    const firstSeason = mergedSeasons[0];
    const firstEpisode = firstSeason?.episodes?.[0] || null;

    // Buscar animes semelhantes baseados nos gêneros
    let similarAnimes: any[] = [];
    try {
      if (anime.genres && anime.genres.length > 0) {
        similarAnimes = await prisma.anime.findMany({
          where: {
            genres: {
              hasSome: anime.genres,
            },
            id: {
              not: anime.id,
            },
          },
          select: {
            id: true,
            slug: true,
            title: true,
            imageUrl: true,
            bannerUrl: true,
            isDubbed: true,
            isSubtitled: true,
            score: true,
            rating: true,
            year: true,
            genres: true,
          },
          take: 12,
        });
      }
    } catch (err) {
      console.warn("Erro ao buscar similarAnimes:", err);
    }

    let inWatchlist = false;
    try {
      const session = await getSession();
      if (session?.user?.id) {
        inWatchlist = await isInWatchlist("ANIME", anime.id);
      }
    } catch {
      // Ignora se não conseguir autenticar
    }

    let ratingStats = null;
    try {
      const ratings = await prisma.animeRating.findMany({
        where: { animeId: anime.id },
        select: { score: true },
      });
      if (ratings.length > 0) {
        const sum = ratings.reduce((acc, r) => acc + r.score, 0);
        ratingStats = {
          averageScore: sum / ratings.length,
          totalVotes: ratings.length,
          userScore: null,
        };
      }
    } catch {
      // Ignora falha de ratings
    }

    return NextResponse.json(
      {
        id: anime.id,
        slug: anime.slug,
        title: anime.title,
        titleEnglish: anime.titleEnglish,
        description: anime.description,
        imageUrl: anime.imageUrl,
        bannerUrl: finalBannerUrl,
        logoUrl: finalLogoUrl,
        compactImageUrl: anime.compactImageUrl,
        genres: anime.genres || [],
        awards: anime.awards || [],
        audio: anime.audio || [],
        subtitles: anime.subtitles || [],
        aired: anime.aired,
        rating: anime.rating,
        isDubbed: Boolean(anime.isDubbed),
        isSubtitled: Boolean(anime.isSubtitled),
        score: anime.score,
        status: anime.status,
        duration: anime.duration,
        season: anime.season,
        year: anime.year,
        rank: anime.rank,
        members: anime.members,
        inWatchlist,
        ratingStats,
        firstEpisode,
        seasons: mergedSeasons,
        similarAnimes,
      },
      {
        headers: {
          ...corsHeaders,
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: any) {
    console.error("Erro na rota /api/v1/animes/[slug]:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor ao carregar anime",
        details: error?.message || String(error),
        stack: error?.stack,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
