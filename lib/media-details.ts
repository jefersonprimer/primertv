import { Prisma } from "@prisma/client";
import { cache } from "react";

import { prisma } from "@/lib/prisma";

const animeDetailsSelect = {
  id: true,
  slug: true,
  title: true,
  titleEnglish: true,
  description: true,
  imageUrl: true,
  bannerUrl: true,
  logoUrl: true,
  compactImageUrl: true,
  genres: true,
  awards: true,
  audio: true,
  subtitles: true,
  aired: true,
  rating: true,
  score: true,
  status: true,
  duration: true,
  season: true,
  year: true,
  rank: true,
  members: true,
  latestSeasonId: true,
  latestEpisodeId: true,
  latestEpisodeNumber: true,
  latestEpisodeAt: true,
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
          title: true,
          videoUrl: true,
          imageUrl: true,
          publicId: true,
          slug: true,
        },
      },
    },
  },
} satisfies Prisma.AnimeSelect;

const seriesDetailsSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  imageUrl: true,
  bannerUrl: true,
  logoUrl: true,
  genres: true,
  rating: true,
  score: true,
  year: true,
  tmdbId: true,
  latestSeasonId: true,
  latestEpisodeId: true,
  latestEpisodeNumber: true,
  latestEpisodeAt: true,
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
          title: true,
          videoUrl: true,
          publicId: true,
          slug: true,
        },
      },
    },
  },
} satisfies Prisma.SeriesSelect;

const novelaDetailsSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  imageUrl: true,
  genres: true,
  latestSeasonId: true,
  latestEpisodeId: true,
  latestEpisodeNumber: true,
  latestEpisodeAt: true,
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
          title: true,
          videoUrl: true,
        },
      },
    },
  },
} satisfies Prisma.NovelaSelect;

const mangaDetailsSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  imageUrl: true,
  bannerUrl: true,
  genres: true,
  aired: true,
  rating: true,
  status: true,
  latestChapterId: true,
  latestChapterNumber: true,
  latestChapterAt: true,
  chapters: {
    orderBy: { number: "asc" },
    select: {
      id: true,
      number: true,
      title: true,
      pages: true,
      publicId: true,
      slug: true,
    },
  },
} satisfies Prisma.MangaSelect;

export const getAnimeDetailsBySlug = cache(async (slug: string) => {
  const decoded = decodeURIComponent(slug);
  const normalizedNFC = decoded.normalize("NFC");
  const normalizedNFD = decoded.normalize("NFD");
  const slugified = decoded.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\-]+/g, "").replace(/-+/g, "-");
  return prisma.anime.findFirst({
    where: {
      OR: [
        { slug: normalizedNFC },
        { slug: normalizedNFD },
        { slug: decoded },
        { slug: slugified },
        { slug: slug },
      ],
    },
    select: animeDetailsSelect,
  });
});

export const getSeriesDetailsBySlug = cache(async (slug: string) => {
  const decoded = decodeURIComponent(slug);
  const normalizedNFC = decoded.normalize("NFC");
  const normalizedNFD = decoded.normalize("NFD");
  const slugified = decoded.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\-]+/g, "").replace(/-+/g, "-");
  return prisma.series.findFirst({
    where: {
      OR: [
        { slug: normalizedNFC },
        { slug: normalizedNFD },
        { slug: decoded },
        { slug: slugified },
        { slug: slug },
      ],
    },
    select: seriesDetailsSelect,
  });
});

export const getNovelaDetailsBySlug = cache(async (slug: string) => {
  const decoded = decodeURIComponent(slug);
  const normalizedNFC = decoded.normalize("NFC");
  const normalizedNFD = decoded.normalize("NFD");
  const slugified = decoded.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\-]+/g, "").replace(/-+/g, "-");
  return prisma.novela.findFirst({
    where: {
      OR: [
        { slug: normalizedNFC },
        { slug: normalizedNFD },
        { slug: decoded },
        { slug: slugified },
        { slug: slug },
      ],
    },
    select: novelaDetailsSelect,
  });
});

export const getMangaDetailsBySlug = cache(async (slug: string) => {
  const decoded = decodeURIComponent(slug);
  const normalizedNFC = decoded.normalize("NFC");
  const normalizedNFD = decoded.normalize("NFD");
  const slugified = decoded.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\-]+/g, "").replace(/-+/g, "-");
  return prisma.manga.findFirst({
    where: {
      OR: [
        { slug: normalizedNFC },
        { slug: normalizedNFD },
        { slug: decoded },
        { slug: slugified },
        { slug: slug },
      ],
    },
    select: mangaDetailsSelect,
  });
});
