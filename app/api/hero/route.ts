import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAnimeLogo,
  getSeriesLogo,
  getAnimeBanner,
  getSeriesBanner,
  getMovieBanner,
} from "@/lib/banners";
import { getMovieLogo } from "@/lib/tmdb";
import {
  getFirstAnimeEpisodes,
  getFirstSeriesEpisodes,
} from "@/lib/media-performance";

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

export async function fetchHeroItems(
  type: "anime" | "series" | "movie" = "anime",
  limit: number = 6
) {
  const isSeries = type === "series";
  const isMovie = type === "movie";

  const mediaList = isSeries
    ? await prisma.series.findMany({
        where: { bannerUrl: { not: "none" } },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          bannerUrl: true,
          imageUrl: true,
          logoUrl: true,
          genres: true,
          rating: true,
          tmdbId: true,
          imdbId: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
    : isMovie
      ? await prisma.movie.findMany({
          where: { bannerUrl: { not: "none" } },
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            bannerUrl: true,
            imageUrl: true,
            logoUrl: true,
            genres: true,
            rating: true,
            videoUrl: true,
            tmdbId: true,
            publicId: true,
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        })
      : await prisma.anime.findMany({
          where: { bannerUrl: { not: "none" } },
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            bannerUrl: true,
            imageUrl: true,
            logoUrl: true,
            genres: true,
            rating: true,
            score: true,
            year: true,
            isDubbed: true,
            isSubtitled: true,
            anilistId: true,
            malId: true,
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        });

  const mediaIds = mediaList.map((media) => media.id);

  const firstEpisodeByMediaId = isMovie || mediaIds.length === 0
    ? new Map()
    : isSeries
      ? await getFirstSeriesEpisodes(mediaIds)
      : await getFirstAnimeEpisodes(mediaIds);

  const firstEpisodeIds = Array.from(firstEpisodeByMediaId.values())
    .map((row: any) => row.firstEpisodeId)
    .filter(Boolean) as string[];

  const episodeDetails = !isMovie && firstEpisodeIds.length > 0
    ? isSeries
      ? await prisma.seriesEpisode.findMany({
          where: { id: { in: firstEpisodeIds } },
          select: { id: true, publicId: true, slug: true, number: true },
        })
      : await prisma.episode.findMany({
          where: { id: { in: firstEpisodeIds } },
          select: { id: true, publicId: true, slug: true, number: true },
        })
    : [];

  const episodeDetailsMap = new Map(episodeDetails.map((ep) => [ep.id, ep]));

  const items = await Promise.all(
    mediaList.map(async (media) => {
      let bannerUrl = media.bannerUrl;
      if (!bannerUrl) {
        try {
          bannerUrl = isSeries
            ? await getSeriesBanner(media.id, media.title)
            : isMovie
              ? await getMovieBanner(media.id, media.title)
              : await getAnimeBanner(media.id, media.title);
        } catch (e) {
          console.error(`Erro ao obter banner para ${media.title}:`, e);
        }
      }
      const finalBannerUrl = bannerUrl === "none" ? null : bannerUrl;

      let logoUrl = media.logoUrl;
      if (!logoUrl) {
        try {
          logoUrl = isSeries
            ? await getSeriesLogo(media.id, media.title)
            : isMovie
              ? await getMovieLogo(media.id, media.title)
              : await getAnimeLogo(media.id, media.title);
        } catch (e) {
          console.error(`Erro ao obter logo para ${media.title}:`, e);
        }
      }
      const finalLogoUrl = logoUrl === "none" ? null : logoUrl;

      const firstEpisodeId =
        firstEpisodeByMediaId.get(media.id)?.firstEpisodeId ?? null;
      const epDetails = firstEpisodeId
        ? episodeDetailsMap.get(firstEpisodeId)
        : null;
      const firstEpisodePublicId = epDetails?.publicId ?? null;
      const firstEpisodeSlug = epDetails
        ? epDetails.slug || `episode-${epDetails.number}`
        : null;

      return {
        id: media.id,
        slug: media.slug,
        title: media.title,
        description: media.description,
        bannerUrl: finalBannerUrl,
        imageUrl: media.imageUrl,
        logoUrl: finalLogoUrl,
        genres: media.genres || [],
        rating: media.rating || null,
        score: (media as any).score ?? null,
        year: (media as any).year ?? null,
        firstEpisodeId,
        firstEpisodePublicId,
        firstEpisodeSlug,
        type,
        isDubbed: (media as any).isDubbed ?? false,
        isSubtitled: (media as any).isSubtitled ?? false,
        videoUrl: (media as any).videoUrl ?? null,
        tmdbId: (media as any).tmdbId ?? null,
        imdbId: (media as any).imdbId ?? null,
        publicId: (media as any).publicId ?? null,
        anilistId: (media as any).anilistId ?? null,
        malId: (media as any).malId ?? null,
      };
    })
  );

  return items;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") || "anime") as "anime" | "series" | "movie";
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 6, 1), 20);

    const items = await fetchHeroItems(type, limit);

    return NextResponse.json(items, {
      headers: {
        ...corsHeaders,
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Erro na rota /api/hero:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao carregar itens de destaque" },
      { status: 500, headers: corsHeaders }
    );
  }
}
