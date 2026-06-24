import { cache } from "react";
import { prisma } from "@/lib/prisma";

interface AniListResponse {
  data: {
    Media?: {
      bannerImage: string | null;
    };
  };
}

interface TmdbSearchResponse {
  results?: Array<{
    backdrop_path: string | null;
    id?: number;
    media_type?: string;
  }>;
}

interface TmdbImagesResponse {
  logos?: Array<{
    file_path: string;
    iso_639_1: string | null;
  }>;
}

/**
 * Searches AniList and TMDB APIs for a banner backdrop URL based on the anime title,
 * saves the result to the database (using 'none' as a placeholder if not found),
 * and returns the banner image URL.
 * Wrapped in React cache to prevent duplicate calls during the same request lifecycle.
 */
export const getAnimeBanner = cache(async (animeId: string, title: string): Promise<string | null> => {
  if (!title || !animeId) return null;

  let resolvedBanner: string | null = null;

  // 1. Tentar AniList (GraphQL)
  try {
    const query = `
      query ($search: String) {
        Media(search: $search, type: ANIME) {
          bannerImage
        }
      }
    `;

    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { search: title },
      }),
      next: { revalidate: 3600 }, // Integração com o cache do Next.js
    });

    if (response.ok) {
      const data = (await response.json()) as AniListResponse;
      if (data.data?.Media?.bannerImage) {
        resolvedBanner = data.data.Media.bannerImage;
      }
    }
  } catch (error) {
    console.error("Erro ao buscar banner no AniList:", error);
  }

  // 2. Tentar TMDB (Se AniList falhar ou não retornar banner)
  if (!resolvedBanner) {
    const tmdbKey = process.env.TMDB_API_KEY;
    const tmdbToken = process.env.TMDB_API_READ_ACCESS_TOKEN;

    if (tmdbKey || tmdbToken) {
      try {
        const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(title)}&language=pt-BR`;
        const headers: HeadersInit = {};

        if (tmdbToken) {
          headers["Authorization"] = `Bearer ${tmdbToken}`;
        }

        const response = await fetch(
          tmdbKey && !tmdbToken ? `${url}&api_key=${tmdbKey}` : url,
          {
            headers,
            next: { revalidate: 3600 },
          }
        );

        if (response.ok) {
          const data = (await response.json()) as TmdbSearchResponse;
          const firstMatch = data.results?.find((item) => item.backdrop_path);
          if (firstMatch?.backdrop_path) {
            resolvedBanner = `https://image.tmdb.org/t/p/original${firstMatch.backdrop_path}`;
          }
        }
      } catch (error) {
        console.error("Erro ao buscar banner no TMDB:", error);
      }
    }
  }

  // Define "none" se não encontrar nada nas APIs externas para evitar requisições repetidas no futuro
  const bannerToSave = resolvedBanner || "none";

  // Salvar no banco de dados para evitar chamadas futuras
  try {
    await prisma.anime.update({
      where: { id: animeId },
      data: { bannerUrl: bannerToSave },
    });
  } catch (dbError) {
    console.error(`Erro ao salvar banner do anime "${title}" no banco:`, dbError);
  }

  return resolvedBanner;
});

/**
 * Searches TMDB API for an anime logo URL based on the anime title,
 * saves the result to the database, and returns the logo image URL.
 * Wrapped in React cache to prevent duplicate calls during the same request lifecycle.
 */
export const getAnimeLogo = cache(async (animeId: string, title: string): Promise<string | null> => {
  if (!title || !animeId) return null;

  // 1. Check database first to see if logo exists or is "none"
  const anime = await prisma.anime.findUnique({
    where: { id: animeId },
    select: { logoUrl: true },
  });

  if (anime?.logoUrl) {
    return anime.logoUrl === "none" ? null : anime.logoUrl;
  }

  let resolvedLogo: string | null = null;
  const tmdbKey = process.env.TMDB_API_KEY;
  const tmdbToken = process.env.TMDB_API_READ_ACCESS_TOKEN;

  if (tmdbKey || tmdbToken) {
    try {
      const searchUrl = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(title)}&language=pt-BR`;
      const headers: HeadersInit = {};

      if (tmdbToken) {
        headers["Authorization"] = `Bearer ${tmdbToken}`;
      }

      const searchResponse = await fetch(
        tmdbKey && !tmdbToken ? `${searchUrl}&api_key=${tmdbKey}` : searchUrl,
        { headers, next: { revalidate: 3600 } }
      );

      if (searchResponse.ok) {
        const searchData = (await searchResponse.json()) as TmdbSearchResponse;
        const firstMatch = searchData.results?.find(
          (item) => item.media_type === "tv" || item.media_type === "movie"
        );

        if (firstMatch && firstMatch.id) {
          const mediaType = firstMatch.media_type || "tv";
          const imagesUrl = `https://api.themoviedb.org/3/${mediaType}/${firstMatch.id}/images`;
          const imagesResponse = await fetch(
            tmdbKey && !tmdbToken ? `${imagesUrl}&api_key=${tmdbKey}` : imagesUrl,
            { headers, next: { revalidate: 3600 } }
          );

          if (imagesResponse.ok) {
            const imagesData = (await imagesResponse.json()) as TmdbImagesResponse;
            const logos = imagesData.logos || [];

            const preferred = logos.find((l) => l.iso_639_1 === "pt") ||
                              logos.find((l) => l.iso_639_1 === "en") ||
                              logos[0];

            if (preferred?.file_path) {
              resolvedLogo = `https://image.tmdb.org/t/p/original${preferred.file_path}`;
            }
          }
        }
      }
    } catch (error) {
      console.error(`Erro ao buscar logo do anime "${title}" no TMDB:`, error);
    }
  }

  const logoToSave = resolvedLogo || "none";

  try {
    await prisma.anime.update({
      where: { id: animeId },
      data: { logoUrl: logoToSave },
    });
  } catch (dbError) {
    console.error(`Erro ao salvar logo do anime "${title}" no banco:`, dbError);
  }

  return resolvedLogo;
});

/**
 * Searches TMDB API for a series banner backdrop URL based on the series title,
 * saves the result to the database (using 'none' as a placeholder if not found),
 * and returns the banner image URL.
 * Wrapped in React cache to prevent duplicate calls during the same request lifecycle.
 */
export const getSeriesBanner = cache(async (seriesId: string, title: string): Promise<string | null> => {
  if (!title || !seriesId) return null;

  let resolvedBanner: string | null = null;
  const tmdbKey = process.env.TMDB_API_KEY;
  const tmdbToken = process.env.TMDB_API_READ_ACCESS_TOKEN;

  if (tmdbKey || tmdbToken) {
    try {
      const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(title)}&language=pt-BR`;
      const headers: HeadersInit = {};

      if (tmdbToken) {
        headers["Authorization"] = `Bearer ${tmdbToken}`;
      }

      const response = await fetch(
        tmdbKey && !tmdbToken ? `${url}&api_key=${tmdbKey}` : url,
        {
          headers,
          next: { revalidate: 3600 },
        }
      );

      if (response.ok) {
        const data = (await response.json()) as TmdbSearchResponse;
        const firstMatch = data.results?.find((item) => item.backdrop_path);
        if (firstMatch?.backdrop_path) {
          resolvedBanner = `https://image.tmdb.org/t/p/original${firstMatch.backdrop_path}`;
        }
      }
    } catch (error) {
      console.error("Erro ao buscar banner da série no TMDB:", error);
    }
  }

  // Define "none" se não encontrar nada nas APIs externas para evitar requisições repetidas no futuro
  const bannerToSave = resolvedBanner || "none";

  // Salvar no banco de dados para evitar chamadas futuras
  try {
    await prisma.series.update({
      where: { id: seriesId },
      data: { bannerUrl: bannerToSave },
    });
  } catch (dbError) {
    console.error(`Erro ao salvar banner da série "${title}" no banco:`, dbError);
  }

  return resolvedBanner;
});

/**
 * Searches TMDB API for a series logo URL based on the series title,
 * saves the result to the database, and returns the logo image URL.
 * Wrapped in React cache to prevent duplicate calls during the same request lifecycle.
 */
export const getSeriesLogo = cache(async (seriesId: string, title: string): Promise<string | null> => {
  if (!title || !seriesId) return null;

  let resolvedLogo: string | null = null;
  const tmdbKey = process.env.TMDB_API_KEY;
  const tmdbToken = process.env.TMDB_API_READ_ACCESS_TOKEN;

  if (tmdbKey || tmdbToken) {
    try {
      const searchUrl = `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(title)}&language=pt-BR`;
      const headers: HeadersInit = {};

      if (tmdbToken) {
        headers["Authorization"] = `Bearer ${tmdbToken}`;
      }

      const searchResponse = await fetch(
        tmdbKey && !tmdbToken ? `${searchUrl}&api_key=${tmdbKey}` : searchUrl,
        { headers, next: { revalidate: 3600 } }
      );

      if (searchResponse.ok) {
        const searchData = (await searchResponse.json()) as TmdbSearchResponse;
        const tvId = searchData.results?.[0]?.id;

        if (tvId) {
          const imagesUrl = `https://api.themoviedb.org/3/tv/${tvId}/images`;
          const imagesResponse = await fetch(
            tmdbKey && !tmdbToken ? `${imagesUrl}&api_key=${tmdbKey}` : imagesUrl,
            { headers, next: { revalidate: 3600 } }
          );

          if (imagesResponse.ok) {
            const imagesData = (await imagesResponse.json()) as TmdbImagesResponse;
            const logos = imagesData.logos || [];

            // Prefer Portuguese logo, fallback to English, then any
            const preferred = logos.find((l) => l.iso_639_1 === "pt") ||
                              logos.find((l) => l.iso_639_1 === "en") ||
                              logos[0];

            if (preferred?.file_path) {
              resolvedLogo = `https://image.tmdb.org/t/p/original${preferred.file_path}`;
            }
          }
        }
      }
    } catch (error) {
      console.error(`Erro ao buscar logo da série "${title}" no TMDB:`, error);
    }
  }

  const logoToSave = resolvedLogo || "none";

  try {
    await prisma.series.update({
      where: { id: seriesId },
      data: { logoUrl: logoToSave },
    });
  } catch (dbError) {
    console.error(`Erro ao salvar logo da série "${title}" no banco:`, dbError);
  }

  return resolvedLogo;
});

/**
 * Searches TMDB API for a movie banner backdrop URL based on the movie title,
 * saves the result to the database (using 'none' as a placeholder if not found),
 * and returns the banner image URL.
 * Wrapped in React cache to prevent duplicate calls during the same request lifecycle.
 */
export const getMovieBanner = cache(async (movieId: string, title: string): Promise<string | null> => {
  if (!title || !movieId) return null;

  let resolvedBanner: string | null = null;
  const tmdbKey = process.env.TMDB_API_KEY;
  const tmdbToken = process.env.TMDB_API_READ_ACCESS_TOKEN;

  if (tmdbKey || tmdbToken) {
    try {
      const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}&language=pt-BR`;
      const headers: HeadersInit = {};

      if (tmdbToken) {
        headers["Authorization"] = `Bearer ${tmdbToken}`;
      }

      const response = await fetch(
        tmdbKey && !tmdbToken ? `${url}&api_key=${tmdbKey}` : url,
        {
          headers,
          next: { revalidate: 3600 },
        }
      );

      if (response.ok) {
        const data = (await response.json()) as TmdbSearchResponse;
        const firstMatch = data.results?.find((item) => item.backdrop_path);
        if (firstMatch?.backdrop_path) {
          resolvedBanner = `https://image.tmdb.org/t/p/original${firstMatch.backdrop_path}`;
        }
      }
    } catch (error) {
      console.error("Erro ao buscar banner do filme no TMDB:", error);
    }
  }

  // Define "none" se não encontrar nada nas APIs externas para evitar requisições repetidas no futuro
  const bannerToSave = resolvedBanner || "none";

  // Salvar no banco de dados para evitar chamadas futuras
  try {
    await prisma.movie.update({
      where: { id: movieId },
      data: { bannerUrl: bannerToSave },
    });
  } catch (dbError) {
    console.error(`Erro ao salvar banner do filme "${title}" no banco:`, dbError);
  }

  return resolvedBanner;
});

interface KitsuMangaResponse {
  data?: Array<{
    attributes?: {
      coverImage?: {
        original?: string | null;
        large?: string | null;
        small?: string | null;
        tiny?: string | null;
      } | null;
    };
  }>;
}

/**
 * Searches AniList (GraphQL) and Kitsu (REST) APIs for a manga banner image URL
 * based on the manga title, saves the result to the database (using 'none' as placeholder if not found),
 * and returns the banner image URL.
 * Wrapped in React cache to prevent duplicate calls during the same request lifecycle.
 */
export const getMangaBanner = cache(async (mangaId: string, title: string): Promise<string | null> => {
  if (!title || !mangaId) return null;

  let resolvedBanner: string | null = null;

  // 1. Tentar AniList (GraphQL)
  try {
    const query = `
      query ($search: String) {
        Media(search: $search, type: MANGA) {
          bannerImage
        }
      }
    `;

    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { search: title },
      }),
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const data = (await response.json()) as AniListResponse;
      if (data.data?.Media?.bannerImage) {
        resolvedBanner = data.data.Media.bannerImage;
      }
    }
  } catch (error) {
    console.error("Erro ao buscar banner no AniList (Manga):", error);
  }

  // 2. Tentar Kitsu API (Se AniList falhar ou não retornar banner)
  if (!resolvedBanner) {
    try {
      const url = `https://kitsu.io/api/edge/manga?filter[text]=${encodeURIComponent(title)}`;
      const response = await fetch(url, {
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
        next: { revalidate: 3600 },
      });

      if (response.ok) {
        const data = (await response.json()) as KitsuMangaResponse;
        const firstMatch = data.data?.[0];
        const coverImage = firstMatch?.attributes?.coverImage;
        if (coverImage) {
          resolvedBanner = coverImage.original || coverImage.large || coverImage.small || coverImage.tiny || null;
        }
      }
    } catch (error) {
      console.error("Erro ao buscar banner no Kitsu (Manga):", error);
    }
  }

  // Define "none" se não encontrar nada nas APIs externas para evitar requisições repetidas no futuro
  const bannerToSave = resolvedBanner || "none";

  // Salvar no banco de dados para evitar chamadas futuras
  try {
    await prisma.manga.update({
      where: { id: mangaId },
      data: { bannerUrl: bannerToSave },
    });
  } catch (dbError) {
    console.error(`Erro ao salvar banner do manga "${title}" no banco:`, dbError);
  }

  return resolvedBanner;
});
