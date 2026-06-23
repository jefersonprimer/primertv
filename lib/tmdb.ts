import { cache } from "react";
import { prisma } from "@/lib/prisma";

interface TmdbSearchResult {
  id: number;
  overview?: string;
  release_date?: string;
  genre_ids?: number[];
  vote_average?: number;
}

interface TmdbSearchResponse {
  results?: TmdbSearchResult[];
}

interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbMovieDetails {
  runtime?: number | null;
  genres?: TmdbGenre[];
  overview?: string | null;
  release_date?: string;
  vote_average?: number;
}

interface TmdbReleaseDateEntry {
  certification: string;
}

interface TmdbReleaseDatesResult {
  iso_3166_1: string;
  release_dates: TmdbReleaseDateEntry[];
}

interface TmdbReleaseDatesResponse {
  results?: TmdbReleaseDatesResult[];
}

const TMDB_GENRE_MAP: Record<number, string> = {
  28: "Ação",
  12: "Aventura",
  16: "Animação",
  35: "Comédia",
  80: "Crime",
  99: "Documentário",
  18: "Drama",
  10751: "Família",
  14: "Fantasia",
  36: "História",
  27: "Terror",
  10402: "Música",
  9648: "Mistério",
  10749: "Romance",
  878: "Ficção científica",
  10770: "Cinema TV",
  53: "Suspense",
  10752: "Guerra",
  37: "Faroeste",
};

function tmdbFetch(url: string) {
  const tmdbKey = process.env.TMDB_API_KEY;
  const tmdbToken = process.env.TMDB_API_READ_ACCESS_TOKEN;

  const headers: Record<string, string> = {};
  if (tmdbToken) {
    headers["Authorization"] = `Bearer ${tmdbToken}`;
  }

  return fetch(
    tmdbKey && !tmdbToken ? `${url}&api_key=${tmdbKey}` : url,
    { headers, next: { revalidate: 3600 } },
  );
}

interface TmdbLogo {
  file_path: string;
  iso_639_1: string | null;
}

interface TmdbImagesResponse {
  logos?: TmdbLogo[];
}

function extractYear(releaseDate?: string): number | null {
  if (!releaseDate) return null;
  const year = parseInt(releaseDate.slice(0, 4), 10);
  return isNaN(year) ? null : year;
}

export interface MovieDetailsResult {
  runtime: number | null;
  releaseDate: Date | null;
  year: number | null;
  score: number | null;
  rating: string | null;
  description: string | null;
  genres: string[];
}

export const getMovieDetails = cache(async (
  movieId: string,
  title: string,
): Promise<MovieDetailsResult> => {
  const existing = await prisma.movie.findUnique({
    where: { id: movieId },
    select: { runtime: true, releaseDate: true, score: true, rating: true, description: true, genres: true },
  });

  if (existing?.runtime && existing?.releaseDate && existing?.score) {
    return {
      runtime: existing.runtime,
      releaseDate: existing.releaseDate,
      year: existing.releaseDate.getFullYear(),
      score: existing.score,
      rating: existing.rating,
      description: existing.description,
      genres: existing.genres,
    };
  }

  const tmdbKey = process.env.TMDB_API_KEY;
  const tmdbToken = process.env.TMDB_API_READ_ACCESS_TOKEN;
  if (!tmdbKey && !tmdbToken) {
    return {
      runtime: existing?.runtime ?? null,
      releaseDate: existing?.releaseDate ?? null,
      year: existing?.releaseDate?.getFullYear() ?? null,
      score: existing?.score ?? null,
      rating: existing?.rating ?? null,
      description: existing?.description ?? null,
      genres: existing?.genres ?? [],
    };
  }

  try {
    const searchRes = await tmdbFetch(
      `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}&language=pt-BR`,
    );

    if (!searchRes.ok) throw new Error(`TMDB search failed: ${searchRes.status}`);

    const searchData = (await searchRes.json()) as TmdbSearchResponse;
    const firstResult = searchData.results?.[0];
    if (!firstResult) throw new Error("No TMDB result found");

    const movieIdTmdb = firstResult.id;

    const [detailsRes, releasesRes] = await Promise.all([
      tmdbFetch(
        `https://api.themoviedb.org/3/movie/${movieIdTmdb}?language=pt-BR`,
      ),
      tmdbFetch(
        `https://api.themoviedb.org/3/movie/${movieIdTmdb}/release_dates`,
      ),
    ]);

    const details = detailsRes.ok
      ? ((await detailsRes.json()) as TmdbMovieDetails)
      : null;

    const releases = releasesRes.ok
      ? ((await releasesRes.json()) as TmdbReleaseDatesResponse)
      : null;

    const runtime = details?.runtime ?? null;

    const rawReleaseDate = details?.release_date
      ? new Date(details.release_date)
      : null;

    const score = details?.vote_average ?? null;

    let certification: string | null = null;
    if (releases?.results) {
      const br = releases.results.find((r) => r.iso_3166_1 === "BR");
      const us = releases.results.find((r) => r.iso_3166_1 === "US");
      const preferred = br || us;
      if (preferred && preferred.release_dates.length > 0) {
        certification = preferred.release_dates[0].certification || null;
      }
    }

    const tmdbGenres = details?.genres?.map((g) => TMDB_GENRE_MAP[g.id] || g.name) ?? [];

    const overview = details?.overview ?? null;

    await prisma.movie.update({
      where: { id: movieId },
      data: {
        runtime,
        releaseDate: rawReleaseDate,
        score,
        rating: certification || undefined,
        description: overview || undefined,
        genres: tmdbGenres.length > 0 ? tmdbGenres : undefined,
      },
    });

    return {
      runtime,
      releaseDate: rawReleaseDate,
      year: rawReleaseDate ? rawReleaseDate.getFullYear() : null,
      score,
      rating: certification,
      description: overview,
      genres: tmdbGenres,
    };
  } catch (error) {
    console.error(`Erro ao buscar dados do TMDB para "${title}":`, error);
    return {
      runtime: existing?.runtime ?? null,
      releaseDate: existing?.releaseDate ?? null,
      year: existing?.releaseDate?.getFullYear() ?? null,
      score: existing?.score ?? null,
      rating: existing?.rating ?? null,
      description: existing?.description ?? null,
      genres: existing?.genres ?? [],
    };
  }
});

export const getMovieLogo = cache(async (movieId: string, title: string): Promise<string | null> => {
  if (!title || !movieId) return null;

  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
    select: { logoUrl: true },
  });

  if (movie?.logoUrl) {
    return movie.logoUrl === "none" ? null : movie.logoUrl;
  }

  let resolvedLogo: string | null = null;

  const tmdbKey = process.env.TMDB_API_KEY;
  const tmdbToken = process.env.TMDB_API_READ_ACCESS_TOKEN;

  if (tmdbKey || tmdbToken) {
    try {
      const searchUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}&language=pt-BR`;
      const headers: Record<string, string> = {};

      if (tmdbToken) {
        headers["Authorization"] = `Bearer ${tmdbToken}`;
      }

      const searchResponse = await fetch(
        tmdbKey && !tmdbToken ? `${searchUrl}&api_key=${tmdbKey}` : searchUrl,
        { headers, next: { revalidate: 3600 } }
      );

      if (searchResponse.ok) {
        const searchData = (await searchResponse.json()) as TmdbSearchResponse;
        const movieIdTmdb = searchData.results?.[0]?.id;

        if (movieIdTmdb) {
          const imagesUrl = `https://api.themoviedb.org/3/movie/${movieIdTmdb}/images`;
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
      console.error(`Erro ao buscar logo do filme "${title}" no TMDB:`, error);
    }
  }

  const logoToSave = resolvedLogo || "none";

  try {
    await prisma.movie.update({
      where: { id: movieId },
      data: { logoUrl: logoToSave },
    });
  } catch (dbError) {
    console.error(`Erro ao salvar logo do filme "${title}" no banco:`, dbError);
  }

  return resolvedLogo;
});
