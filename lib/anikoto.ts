import { unstable_cache } from "next/cache";

const ANIKOTO_BASE_URL = "https://anikotoapi.site";
const MEGAPLAY_BASE_URL = "https://megaplay.buzz";
const REQUEST_TIMEOUT_MS = 8000;
const MAX_PAGES = 6;
const PAGE_SIZE = 100;

export type MegaPlayAnimePlayer = {
  id: string;
  label: string;
  url: string;
};

export type MegaPlayCatalogEpisode = {
  number: number;
  title: string | null;
  subUrl: string | null;
  dubUrl: string | null;
};

export type MegaPlayAnimeCatalog = {
  seriesId: string;
  title: string | null;
  episodes: MegaPlayCatalogEpisode[];
};

type AnimeSource = {
  anilistId?: number | null;
  malId?: number | null;
  title?: string | null;
  titleEnglish?: string | null;
  slug?: string | null;
};

type RecentAnimeEntry = {
  id?: string | number | null;
  title?: string | null;
  name?: string | null;
  english_title?: string | null;
  title_english?: string | null;
  slug?: string | null;
  aliases?: string[] | null;
  synonyms?: string[] | null;
};

type SeriesEpisode = {
  number?: number | string | null;
  episode_number?: number | string | null;
  embed_url?: string | { sub?: string | null; dub?: string | null } | null;
  episode_embed_id?: string | number | null;
  id?: string | number | null;
};

type SeriesPayload = {
  anime?: {
    id?: string | number | null;
    title?: string | null;
    name?: string | null;
    episodes?: SeriesEpisode[] | null;
  } | null;
  episodes?: SeriesEpisode[] | null;
  data?: {
    anime?: {
      id?: string | number | null;
      title?: string | null;
      name?: string | null;
    } | null;
    episodes?: SeriesEpisode[] | null;
  } | null;
};

type RecentAnimePayload = {
  anime?: RecentAnimeEntry[] | null;
  data?: RecentAnimeEntry[] | null;
  results?: RecentAnimeEntry[] | null;
  items?: RecentAnimeEntry[] | null;
  pagination?: {
    last_page?: number | null;
    total_pages?: number | null;
    pages?: number | null;
  } | null;
};

export const getMegaPlayAnimePlayers = unstable_cache(
  async (sourceKey: string, episodeNumber: number) => {
    const source = parseAnimeSource(sourceKey);
    if (!source) return [] as MegaPlayAnimePlayer[];

    const directPlayers = buildDirectPlayers(source, episodeNumber);
    if (directPlayers.length > 0) {
      return directPlayers;
    }

    const catalog = await getMegaPlayAnimeCatalog(sourceKey);
    const targetEpisode = catalog?.episodes.find(
      (episode) => episode.number === episodeNumber,
    );

    if (!targetEpisode) return [] as MegaPlayAnimePlayer[];

    return buildPlayersFromEpisode(targetEpisode);
  },
  ["megaplay-anime-players"],
  { revalidate: 60 * 60 * 24 },
);

export const getMegaPlayAnimeCatalog = unstable_cache(
  async (sourceKey: string): Promise<MegaPlayAnimeCatalog | null> => {
    const source = parseAnimeSource(sourceKey);
    if (!source) return null;

    const seriesId = await resolveCatalogSeriesId(source);
    if (!seriesId) return null;

    const series = await fetchSeries(seriesId);
    const episodes = extractEpisodes(series)
      .map((episode) => {
        const number = parseEpisodeNumber(
          episode.number ?? episode.episode_number,
        );
        if (number === null) return null;

        const embedUrl = extractEmbedUrls(episode);
        return {
          number,
          title: getEpisodeTitle(episode),
          subUrl: embedUrl.sub || embedUrl.single,
          dubUrl: embedUrl.dub || embedUrl.single,
        } satisfies MegaPlayCatalogEpisode;
      })
      .filter((episode): episode is MegaPlayCatalogEpisode => episode !== null)
      .sort((a, b) => a.number - b.number);

    return {
      seriesId,
      title: getSeriesTitle(series),
      episodes,
    };
  },
  ["megaplay-anime-catalog"],
  { revalidate: 60 * 60 * 24 },
);

function parseAnimeSource(titleKey: string): AnimeSource | null {
  try {
    return JSON.parse(titleKey) as AnimeSource;
  } catch {
    return null;
  }
}

async function resolveCatalogSeriesId(source: AnimeSource): Promise<string | null> {
  const directCandidates = [source.anilistId, source.malId]
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  for (const candidate of directCandidates) {
    const series = await fetchSeries(String(candidate));
    if (extractEpisodes(series).length > 0) {
      return String(candidate);
    }
  }

  const candidates = buildTitleCandidates(source);
  if (candidates.length === 0) return null;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const payload = await fetchRecentAnime(page);
    const entries = extractRecentAnimeEntries(payload);
    if (entries.length === 0) break;

    const match = entries.find((entry) => matchesAnyCandidate(entry, candidates));
    if (match) {
      const id = match.id ?? match.slug;
      if (id !== null && id !== undefined && String(id).trim()) {
        return String(id);
      }
    }

    const totalPages = payload?.pagination?.last_page ?? payload?.pagination?.total_pages ?? payload?.pagination?.pages;
    if (typeof totalPages === "number" && totalPages > 0 && page >= totalPages) {
      break;
    }

    if (entries.length < PAGE_SIZE) {
      break;
    }
  }

  return null;
}

async function fetchRecentAnime(page: number): Promise<RecentAnimePayload | null> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(PAGE_SIZE),
  });
  return fetchJson<RecentAnimePayload>(`${ANIKOTO_BASE_URL}/recent-anime?${params.toString()}`);
}

async function fetchSeries(seriesId: string): Promise<SeriesPayload | null> {
  return fetchJson<SeriesPayload>(`${ANIKOTO_BASE_URL}/series/${encodeURIComponent(seriesId)}`);
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        accept: "application/json,text/plain,*/*",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function extractRecentAnimeEntries(payload: RecentAnimePayload | null): RecentAnimeEntry[] {
  if (!payload) return [];

  const candidates = [
    payload.anime,
    payload.data,
    payload.results,
    payload.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function extractEpisodes(payload: SeriesPayload | null): SeriesEpisode[] {
  if (!payload) return [];

  const candidates = [
    payload.episodes,
    payload.anime?.episodes,
    payload.data?.episodes,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function buildTitleCandidates(source: AnimeSource): string[] {
  const rawCandidates = [
    source.title,
    source.titleEnglish,
    source.slug?.replace(/-/g, " "),
  ].filter((value): value is string => Boolean(value && value.trim()));

  return Array.from(new Set(rawCandidates.map((value) => normalizeText(value)))).filter(Boolean);
}

function buildDirectPlayers(
  source: AnimeSource,
  episodeNumber: number,
): MegaPlayAnimePlayer[] {
  const players: MegaPlayAnimePlayer[] = [];

  if (source.anilistId) {
    const basePath = `/stream/ani/${encodeURIComponent(String(source.anilistId))}/${episodeNumber}`;
    players.push({
      id: "megaplay-anilist-sub",
      label: "MegaPlay (AniList Sub)",
      url: `${MEGAPLAY_BASE_URL}${basePath}/sub`,
    });
    players.push({
      id: "megaplay-anilist-dub",
      label: "MegaPlay (AniList Dub)",
      url: `${MEGAPLAY_BASE_URL}${basePath}/dub`,
    });
    return players;
  }

  if (source.malId) {
    const basePath = `/stream/mal/${encodeURIComponent(String(source.malId))}/${episodeNumber}`;
    players.push({
      id: "megaplay-mal-sub",
      label: "MegaPlay (MAL Sub)",
      url: `${MEGAPLAY_BASE_URL}${basePath}/sub`,
    });
    players.push({
      id: "megaplay-mal-dub",
      label: "MegaPlay (MAL Dub)",
      url: `${MEGAPLAY_BASE_URL}${basePath}/dub`,
    });
    return players;
  }

  return players;
}

function buildPlayersFromEpisode(episode: MegaPlayCatalogEpisode): MegaPlayAnimePlayer[] {
  const players: MegaPlayAnimePlayer[] = [];

  if (episode.subUrl) {
    players.push({
      id: "megaplay-sub",
      label: "MegaPlay (Sub)",
      url: episode.subUrl,
    });
  }

  if (episode.dubUrl && episode.dubUrl !== episode.subUrl) {
    players.push({
      id: "megaplay-dub",
      label: "MegaPlay (Dub)",
      url: episode.dubUrl,
    });
  }

  if (players.length === 0) {
    const fallback = episode.subUrl || episode.dubUrl;
    if (fallback) {
      players.push({
        id: "megaplay",
        label: "MegaPlay",
        url: fallback,
      });
    }
  }

  return players;
}

function matchesAnyCandidate(entry: RecentAnimeEntry, candidates: string[]): boolean {
  const entryTexts = [
    entry.title,
    entry.name,
    entry.english_title,
    entry.title_english,
    entry.slug?.replace(/-/g, " "),
    ...(entry.aliases || []),
    ...(entry.synonyms || []),
  ]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => normalizeText(value));

  return entryTexts.some((text) => candidates.includes(text));
}

function extractEmbedUrls(episode: SeriesEpisode): {
  single: string | null;
  sub: string | null;
  dub: string | null;
} {
  const direct = episode.embed_url;

  if (typeof direct === "string") {
    const normalized = normalizeUrl(direct);
    return { single: normalized, sub: null, dub: null };
  }

  if (direct && typeof direct === "object") {
    return {
      single: null,
      sub: normalizeUrl(direct.sub),
      dub: normalizeUrl(direct.dub),
    };
  }

  const episodeEmbedId = episode.episode_embed_id;
  if (!episodeEmbedId) {
    return { single: null, sub: null, dub: null };
  }

  return {
    single: null,
    sub: `${MEGAPLAY_BASE_URL}/stream/s-2/${encodeURIComponent(String(episodeEmbedId))}/sub`,
    dub: `${MEGAPLAY_BASE_URL}/stream/s-2/${encodeURIComponent(String(episodeEmbedId))}/dub`,
  };
}

function getEpisodeTitle(episode: SeriesEpisode): string | null {
  const raw = (episode as { title?: string | null }).title;
  return typeof raw === "string" && raw.trim() ? raw : null;
}

function getSeriesTitle(series: SeriesPayload | null): string | null {
  if (!series) return null;
  return (
    series.anime?.title ??
    series.anime?.name ??
    series.data?.anime?.title ??
    series.data?.anime?.name ??
    null
  );
}

function parseEpisodeNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed).toString();
  } catch {
    return trimmed;
  }
}
