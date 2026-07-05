"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId, isInWatchlist } from "@/lib/watchlist";

export type AnimePreviewData = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  rating: string | null;
  score: number | null;
  members: number | null;
  seasonCount: number;
  episodeCount: number;
  firstEpisode: {
    publicId: string | null;
    slug: string | null;
    number: number;
  } | null;
  inWatchlist: boolean;
  isLoggedIn: boolean;
};

export async function getAnimePreview(animeId: string): Promise<AnimePreviewData | null> {
  try {
    const userId = await getAuthenticatedUserId();
    const isLoggedIn = !!userId;

    const anime = await prisma.anime.findUnique({
      where: { id: animeId },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        rating: true,
        score: true,
        members: true,
        seasons: {
          orderBy: { number: "asc" },
          select: {
            id: true,
            number: true,
            episodes: {
              orderBy: { number: "asc" },
              select: {
                id: true,
                number: true,
                publicId: true,
                slug: true,
              }
            }
          }
        }
      }
    });

    if (!anime) return null;

    let inWatchlistVal = false;
    if (isLoggedIn) {
      inWatchlistVal = await isInWatchlist("ANIME", animeId);
    }

    const seasons = anime.seasons || [];
    const seasonCount = seasons.length;
    let episodeCount = 0;
    let firstEpisodeData: any = null;

    seasons.forEach((season) => {
      episodeCount += season.episodes.length;
      if (!firstEpisodeData && season.episodes.length > 0) {
        firstEpisodeData = season.episodes[0];
      }
    });

    return {
      id: anime.id,
      slug: anime.slug,
      title: anime.title,
      description: anime.description,
      rating: anime.rating,
      score: anime.score,
      members: anime.members,
      seasonCount,
      episodeCount,
      firstEpisode: firstEpisodeData ? {
        publicId: firstEpisodeData.publicId || firstEpisodeData.id,
        slug: firstEpisodeData.slug,
        number: firstEpisodeData.number,
      } : null,
      inWatchlist: inWatchlistVal,
      isLoggedIn,
    };
  } catch (error) {
    console.error("Error fetching anime preview details:", error);
    return null;
  }
}
