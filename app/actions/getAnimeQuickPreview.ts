"use server";

import { prisma } from "@/lib/prisma";
import { getAnimeDetailsBySlug } from "@/lib/media-details";
import { getAuthenticatedUserId, isInWatchlist } from "@/lib/watchlist";
import { getAnimeWatchHistory } from "@/lib/history";

import { buildMergedSeasons } from "@/lib/seasons";
import { getAnimeLogo } from "@/lib/banners";

export type EpisodePreviewItem = {
  id: string;
  number: number;
  title: string | null;
  imageUrl: string | null;
  publicId: string;
  slug: string;
  href?: string | null;
  createdAt: Date | string;
};

export type SeasonPreviewItem = {
  id: string;
  number: number;
  episodes: EpisodePreviewItem[];
};

export type AnimeQuickPreviewData = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  bannerUrl: string | null;
  logoUrl?: string | null;
  genres: string[];
  year: number | null;
  score: number | null;
  rating: string | null;
  isDubbed: boolean;
  isSubtitled: boolean;
  audio?: string[];
  subtitles?: string[];
  awards?: string[];
  duration?: string | null;
  seasons: SeasonPreviewItem[];
  nextEpisode: {
    id: string;
    number: number;
    seasonNumber: number;
    title: string | null;
    publicId: string;
    slug: string;
    href?: string | null;
    imageUrl?: string | null;
  } | null;
  firstEpisode: {
    id: string;
    number: number;
    seasonNumber: number;
    title: string | null;
    publicId: string;
    slug: string;
    href?: string | null;
    imageUrl?: string | null;
  } | null;
  hasHistory: boolean;
  inWatchlist: boolean;
  isLoggedIn: boolean;
  rank: number | null;
  members: number | null;
};

export async function getAnimeQuickPreview(slug: string): Promise<AnimeQuickPreviewData | null> {
  try {
    if (!slug) return null;

    const anime = await getAnimeDetailsBySlug(slug);
    if (!anime) return null;

    const mergedSeasons = await buildMergedSeasons({
      animeSlug: anime.slug,
      animeTitle: anime.title,
      animeAnilistId: anime.anilistId,
      animeMalId: anime.malId,
      animeTitleEnglish: anime.titleEnglish,
      localSeasons: anime.seasons,
    });

    let firstEpisode = null;
    if (mergedSeasons.length > 0 && mergedSeasons[0].episodes.length > 0) {
      const s1 = mergedSeasons[0];
      const ep1 = s1.episodes[0];
      firstEpisode = {
        id: ep1.id,
        number: ep1.number,
        seasonNumber: s1.number,
        title: ep1.title,
        publicId: ep1.publicId || ep1.id,
        slug: ep1.slug || `episode-${ep1.number}`,
        href: ep1.href,
        imageUrl: ep1.imageUrl || null,
      };
    }

    let nextEpisode = firstEpisode;
    let hasHistory = false;
    let inWatchlist = false;

    const userId = await getAuthenticatedUserId();
    const isLoggedIn = Boolean(userId);

    if (userId && anime.id) {
      inWatchlist = await isInWatchlist("ANIME", anime.id);

      const history = await getAnimeWatchHistory(userId);
      const animeHistory = history.filter(
        (h) => h.episode.season.anime.id === anime.id
      );

      if (animeHistory.length > 0) {
        hasHistory = true;
        const lastWatched = animeHistory[0];
        const currentEpNumber = lastWatched.episode.number;
        const currentSeasonNumber = lastWatched.episode.season.number;

        let foundNext = null;

        const currentSeasonObj = mergedSeasons.find((s) => s.number === currentSeasonNumber);
        if (currentSeasonObj) {
          const nextInSeason = currentSeasonObj.episodes.find(
            (e) => e.number === currentEpNumber + 1
          );
          if (nextInSeason) {
            foundNext = {
              id: nextInSeason.id,
              number: nextInSeason.number,
              seasonNumber: currentSeasonNumber,
              title: nextInSeason.title,
              publicId: nextInSeason.publicId || nextInSeason.id,
              slug: nextInSeason.slug || `episode-${nextInSeason.number}`,
              href: nextInSeason.href,
              imageUrl: nextInSeason.imageUrl || null,
            };
          }
        }

        if (!foundNext) {
          const nextSeasonObj = mergedSeasons.find((s) => s.number === currentSeasonNumber + 1);
          if (nextSeasonObj && nextSeasonObj.episodes.length > 0) {
            const firstOfNextSeason = nextSeasonObj.episodes[0];
            foundNext = {
              id: firstOfNextSeason.id,
              number: firstOfNextSeason.number,
              seasonNumber: nextSeasonObj.number,
              title: firstOfNextSeason.title,
              publicId: firstOfNextSeason.publicId || firstOfNextSeason.id,
              slug: firstOfNextSeason.slug || `episode-${firstOfNextSeason.number}`,
              href: firstOfNextSeason.href,
              imageUrl: firstOfNextSeason.imageUrl || null,
            };
          }
        }

        if (foundNext) {
          nextEpisode = foundNext;
        } else {
          nextEpisode = {
            id: lastWatched.episode.id,
            number: lastWatched.episode.number,
            seasonNumber: lastWatched.episode.season.number,
            title: lastWatched.episode.title,
            publicId: lastWatched.episode.publicId || lastWatched.episode.id,
            slug: lastWatched.episode.slug || `episode-${lastWatched.episode.number}`,
            href: `/watch/${lastWatched.episode.publicId || lastWatched.episode.id}/${lastWatched.episode.slug || "episode-" + lastWatched.episode.number}`,
            imageUrl: lastWatched.episode.imageUrl || null,
          };
        }
      }
    }

    const seasonsFormatted: SeasonPreviewItem[] = mergedSeasons.map((s) => ({
      id: s.id,
      number: s.number,
      episodes: s.episodes.map((ep) => ({
        id: ep.id,
        number: ep.number,
        title: ep.title,
        imageUrl: ep.imageUrl || anime.imageUrl,
        publicId: ep.publicId || ep.id,
        slug: ep.slug || `episode-${ep.number}`,
        href: ep.href,
        createdAt: ep.createdAt || new Date(),
      })),
    }));

    let logoUrl = anime.logoUrl;
    if (!logoUrl) {
      logoUrl = await getAnimeLogo(anime.id, anime.title);
    }
    const finalLogoUrl = logoUrl === "none" ? null : logoUrl;

    return {
      id: anime.id,
      slug: anime.slug,
      title: anime.title,
      description: anime.description,
      imageUrl: anime.imageUrl,
      bannerUrl: anime.bannerUrl,
      logoUrl: finalLogoUrl,
      genres: anime.genres,
      year: anime.year,
      score: anime.score,
      rating: anime.rating,
      isDubbed: anime.isDubbed,
      isSubtitled: anime.isSubtitled,
      audio: anime.audio,
      subtitles: anime.subtitles,
      awards: anime.awards,
      duration: anime.duration,
      seasons: seasonsFormatted,
      nextEpisode,
      firstEpisode,
      hasHistory,
      inWatchlist,
      isLoggedIn,
      rank: anime.rank,
      members: anime.members,
    };
  } catch (error) {
    console.error("Erro em getAnimeQuickPreview Server Action:", error);
    return null;
  }
}
