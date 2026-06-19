import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/auth";
import { AdminCollection, isAdminCollection } from "@/lib/admin";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export type AdminListItem = {
  id: string;
  title: string;
  slug: string;
  updatedAt: Date;
  createdAt: Date;
};

export type AdminSeasonItem = {
  id: string;
  number: number;
  episodes: AdminEpisodeItem[];
};

export type AdminEpisodeItem = {
  id: string;
  number: number;
  title: string | null;
  videoUrl: string | null;
  seasonId: string;
};

export type AdminChapterItem = {
  id: string;
  number: number;
  title: string | null;
  pages: string[];
  mangaId: string;
};

export type AdminMediaDetail = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  genres: string[];
  aired?: string | null;
  rating?: string | null;
  status?: string | null;
  videoUrl?: string | null;
  embedUrl?: string | null;
  position?: number;
  seasons?: AdminSeasonItem[];
  chapters?: AdminChapterItem[];
};

export async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    redirect("/login");
  }

  return session;
}

export async function getAdminCounts() {
  const [movies, series, animes, mangas, novelas, channels] = await Promise.all([
    prisma.movie.count(),
    prisma.series.count(),
    prisma.anime.count(),
    prisma.manga.count(),
    prisma.novela.count(),
    prisma.channel.count(),
  ]);

  return { movies, series, animes, mangas, novelas, channels };
}

export async function getCollectionItems(collection: AdminCollection) {
  switch (collection) {
    case "movies":
      return prisma.movie.findMany({
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    case "series":
      return prisma.series.findMany({
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    case "animes":
      return prisma.anime.findMany({
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    case "mangas":
      return prisma.manga.findMany({
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    case "novelas":
      return prisma.novela.findMany({
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    case "channels":
      return prisma.channel.findMany({
        orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
        select: {
          id: true,
          title: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
        },
      });
  }
}

export async function getCollectionItem(collection: AdminCollection, id: string) {
  switch (collection) {
    case "movies":
      return prisma.movie.findUnique({ where: { id } });
    case "series":
      return prisma.series.findUnique({ where: { id } });
    case "animes":
      return prisma.anime.findUnique({ where: { id } });
    case "mangas":
      return prisma.manga.findUnique({ where: { id } });
    case "novelas":
      return prisma.novela.findUnique({ where: { id } });
    case "channels":
      return prisma.channel.findUnique({ where: { id } });
  }
}

export async function getCollectionDetail(
  collection: AdminCollection,
  id: string,
): Promise<AdminMediaDetail | null> {
  switch (collection) {
    case "movies": {
      const movie = await prisma.movie.findUnique({ where: { id } });
      if (!movie) return null;
      return {
        id: movie.id,
        title: movie.title,
        slug: movie.slug,
        description: movie.description,
        imageUrl: movie.imageUrl,
        genres: movie.genres,
        videoUrl: movie.videoUrl,
      };
    }
    case "series": {
      const series = await prisma.series.findUnique({
        where: { id },
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
      });
      if (!series) return null;
      return {
        id: series.id,
        title: series.title,
        slug: series.slug,
        description: series.description,
        imageUrl: series.imageUrl,
        genres: series.genres,
        seasons: series.seasons.map((season) => ({
          id: season.id,
          number: season.number,
          episodes: season.episodes.map((episode) => ({
            id: episode.id,
            number: episode.number,
            title: episode.title,
            videoUrl: episode.videoUrl,
            seasonId: episode.seasonId,
          })),
        })),
      };
    }
    case "animes": {
      const anime = await prisma.anime.findUnique({
        where: { id },
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
      });
      if (!anime) return null;
      return {
        id: anime.id,
        title: anime.title,
        slug: anime.slug,
        description: anime.description,
        imageUrl: anime.imageUrl,
        genres: anime.genres,
        aired: anime.aired,
        rating: anime.rating,
        status: anime.status,
        seasons: anime.seasons.map((season) => ({
          id: season.id,
          number: season.number,
          episodes: season.episodes.map((episode) => ({
            id: episode.id,
            number: episode.number,
            title: episode.title,
            videoUrl: episode.videoUrl,
            seasonId: episode.seasonId,
          })),
        })),
      };
    }
    case "mangas": {
      const manga = await prisma.manga.findUnique({
        where: { id },
        include: {
          chapters: {
            orderBy: { number: "asc" },
          },
        },
      });
      if (!manga) return null;
      return {
        id: manga.id,
        title: manga.title,
        slug: manga.slug,
        description: manga.description,
        imageUrl: manga.imageUrl,
        genres: manga.genres,
        aired: manga.aired,
        rating: manga.rating,
        status: manga.status,
        chapters: manga.chapters.map((chapter) => ({
          id: chapter.id,
          number: chapter.number,
          title: chapter.title,
          pages: chapter.pages,
          mangaId: chapter.mangaId,
        })),
      };
    }
    case "novelas": {
      const novela = await prisma.novela.findUnique({
        where: { id },
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
      });
      if (!novela) return null;
      return {
        id: novela.id,
        title: novela.title,
        slug: novela.slug,
        description: novela.description,
        imageUrl: novela.imageUrl,
        genres: novela.genres,
        seasons: novela.seasons.map((season) => ({
          id: season.id,
          number: season.number,
          episodes: season.episodes.map((episode) => ({
            id: episode.id,
            number: episode.number,
            title: episode.title,
            videoUrl: episode.videoUrl,
            seasonId: episode.seasonId,
          })),
        })),
      };
    }
    case "channels": {
      const channel = await prisma.channel.findUnique({ where: { id } });
      if (!channel) return null;
      return {
        id: channel.id,
        title: channel.title,
        slug: channel.slug,
        description: channel.description,
        imageUrl: channel.imageUrl,
        genres: [],
        videoUrl: channel.videoUrl,
        embedUrl: channel.embedUrl,
        position: channel.position,
      };
    }
  }
}

export function assertCollection(value: string): asserts value is AdminCollection {
  if (!isAdminCollection(value)) {
    throw new Error("Coleção inválida.");
  }
}
