"use server";

import { prisma } from "@/lib/prisma";
import { getSeriesDetailsBySlug } from "@/lib/media-details";
import { getAuthenticatedUserId, isInWatchlist } from "@/lib/watchlist";
import { getSeriesLogo } from "@/lib/banners";
import { getSeriesTmdbSeasons } from "@/lib/tmdb";
import type { AnimeQuickPreviewData, SeasonPreviewItem } from "./getAnimeQuickPreview";

export async function getSeriesQuickPreview(slug: string): Promise<AnimeQuickPreviewData | null> {
  try {
    if (!slug) return null;

    const series = await getSeriesDetailsBySlug(slug);
    if (!series) return null;

    let seasonsFormatted: SeasonPreviewItem[] = series.seasons.map((s) => ({
      id: s.id,
      number: s.number,
      episodes: s.episodes.map((ep) => ({
        id: ep.id,
        number: ep.number,
        title: ep.title,
        imageUrl: series.imageUrl,
        publicId: ep.publicId || ep.id,
        slug: ep.slug || `episode-${ep.number}`,
        href: ep.publicId
          ? `/watch/${ep.publicId}/${ep.slug || "episode-" + ep.number}`
          : `/watch/${ep.id}/${ep.slug || "episode-" + ep.number}`,
        createdAt: ep.createdAt || new Date(),
      })),
    }));

    if (seasonsFormatted.length === 0 && (series.tmdbId || (series as any).imdbId)) {
      const externalId = series.tmdbId || (series as any).imdbId;
      const tmdbSeasons = await getSeriesTmdbSeasons(externalId!);
      if (tmdbSeasons && tmdbSeasons.length > 0) {
        seasonsFormatted = tmdbSeasons.map((s) => ({
          id: s.id,
          number: s.number,
          episodes: s.episodes.map((ep) => ({
            id: ep.id,
            number: ep.number,
            title: ep.title,
            imageUrl: ep.stillPath || series.imageUrl,
            publicId: ep.id,
            slug: `episode-${ep.number}`,
            href: `/watch/${series.slug}/episode-${ep.number}?season=${s.number}&episode=${ep.number}&source=vidnest`,
            createdAt: new Date(),
          })),
        }));
      } else {
        seasonsFormatted = [
          {
            id: "default-season-1",
            number: 1,
            episodes: Array.from({ length: 8 }, (_, i) => ({
              id: `default-s1-e${i + 1}`,
              number: i + 1,
              title: `Episódio ${i + 1}`,
              imageUrl: series.imageUrl,
              publicId: `default-s1-e${i + 1}`,
              slug: `episode-${i + 1}`,
              href: `/watch/${series.slug}/episode-${i + 1}?season=1&episode=${i + 1}&source=vidnest`,
              createdAt: new Date(),
            })),
          },
        ];
      }
    }

    let firstEpisode = null;
    if (seasonsFormatted.length > 0 && seasonsFormatted[0].episodes.length > 0) {
      const s1 = seasonsFormatted[0];
      const ep1 = s1.episodes[0];
      firstEpisode = {
        id: ep1.id,
        number: ep1.number,
        seasonNumber: s1.number,
        title: ep1.title,
        publicId: ep1.publicId,
        slug: ep1.slug,
        href: ep1.href,
        imageUrl: ep1.imageUrl,
      };
    }

    let nextEpisode = firstEpisode;
    let inWatchlist = false;

    const userId = await getAuthenticatedUserId();
    const isLoggedIn = Boolean(userId);

    if (userId && series.id) {
      inWatchlist = await isInWatchlist("SERIES", series.id);
    }

    let logoUrl = series.logoUrl;
    if (!logoUrl || logoUrl === "none") {
      logoUrl = await getSeriesLogo(series.id, series.title);
    }
    const finalLogoUrl = logoUrl === "none" ? null : logoUrl;

    return {
      id: series.id,
      slug: series.slug,
      title: series.title,
      description: series.description,
      imageUrl: series.imageUrl,
      bannerUrl: series.bannerUrl,
      logoUrl: finalLogoUrl,
      genres: series.genres,
      year: series.year,
      score: series.score,
      rating: series.rating,
      isDubbed: false,
      isSubtitled: false,
      seasons: seasonsFormatted,
      nextEpisode,
      firstEpisode,
      hasHistory: false,
      inWatchlist,
      isLoggedIn,
      rank: null,
      members: null,
    };
  } catch (error) {
    console.error("Erro em getSeriesQuickPreview Server Action:", error);
    return null;
  }
}
