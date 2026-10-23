import { unstable_cache } from "next/cache";
import { randomUUID } from "node:crypto";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const ANIKOTO_BASE_URL = "https://anikotoapi.site";
const MEGAPLAY_BASE_URL = "https://megaplay.buzz";
const ZOKOANIME_BASE_URL = "https://zokoanime.video";
const VIDNEST_BASE_URL = "https://vidnest.fun";
const ANIEMBED_BASE_URL = "https://aniembed.se";
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
  totalEpisodes: number | null;
};

type AnimeSource = {
  anilistId?: number | null;
  malId?: number | null;
  seasonAnilistId?: number | null;
  seasonMalId?: number | null;
  title?: string | null;
  titleEnglish?: string | null;
  slug?: string | null;
  seasonNumber?: number | null;
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
  ani_id?: string | number | null;
  mal_id?: string | number | null;
  year?: string | number | null;
  is_sub?: string | number | null;
  is_dub?: string | number | null;
};

type SeriesEpisode = {
  number?: number | string | null;
  episode_number?: number | string | null;
  embed_url?: string | { sub?: string | null; dub?: string | null } | null;
  episode_embed_id?: string | number | null;
  id?: string | number | null;
};

type SeriesAnime = {
  id?: string | number | null;
  title?: string | null;
  name?: string | null;
  episodes?: SeriesEpisode[] | null;
  ani_id?: string | number | null;
  mal_id?: string | number | null;
  year?: string | number | null;
  is_sub?: string | number | null;
  is_dub?: string | number | null;
};

type SeriesPayload = {
  anime?: SeriesAnime | null;
  episodes?: SeriesEpisode[] | null;
  data?: {
    anime?: SeriesAnime | null;
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
    const seasonNumber = source.seasonNumber || 1;
    const episodes = extractEpisodes(series)
      .map((episode) => {
        const number = parseEpisodeNumber(
          episode.number ?? episode.episode_number,
        );
        if (number === null) return null;

        const embedUrl = extractEmbedUrls(episode, seasonNumber);
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
      totalEpisodes: getSeriesEpisodeCount(series),
    };
  },
  ["megaplay-anime-catalog"],
  { revalidate: 60 * 60 * 24 },
);

function getSeriesEpisodeCount(series: SeriesPayload | null): number | null {
  const anime = series?.data?.anime ?? series?.anime ?? null;
  if (!anime) return null;

  const counts = [anime.is_sub, anime.is_dub]
    .map((value) => parseEpisodeNumber(value))
    .filter((count): count is number => count !== null && count > 0);

  if (counts.length === 0) return null;
  return Math.max(...counts);
}

function parseAnimeSource(titleKey: string): AnimeSource | null {
  try {
    return JSON.parse(titleKey) as AnimeSource;
  } catch {
    return null;
  }
}

async function resolveCatalogSeriesId(source: AnimeSource): Promise<string | null> {
  const expectedIds = getExpectedExternalIds(source);

  const mappedSeriesId = await lookupMappedCatalogSeriesId(expectedIds);
  if (mappedSeriesId) {
    const mappedSeries = await fetchSeries(mappedSeriesId);
    if (seriesMatchesSource(mappedSeries, source, expectedIds)) {
      return mappedSeriesId;
    }
  }

  for (const candidate of buildDirectCatalogCandidates(source)) {
    const series = await fetchSeries(String(candidate));
    if (!seriesMatchesSource(series, source, expectedIds)) {
      continue;
    }
    if (extractEpisodes(series).length > 0) {
      return String(candidate);
    }
  }

  const candidates = buildTitleCandidates(source);
  if (
    candidates.length === 0 &&
    expectedIds.anilist.size === 0 &&
    expectedIds.mal.size === 0
  ) {
    return null;
  }

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const payload = await fetchRecentAnime(page);
    const entries = extractRecentAnimeEntries(payload);
    if (entries.length === 0) break;

    const externalIdMatch = entries.find((entry) =>
      entryMatchesExternalIds(entry, expectedIds),
    );
    const match =
      externalIdMatch ??
      (candidates.length > 0
        ? entries.find((entry) => matchesAnyCandidate(entry, candidates))
        : undefined);

    if (match) {
      const id = match.id ?? match.slug;
      if (id !== null && id !== undefined && String(id).trim()) {
        await upsertAnikotoSeriesMapping(match);
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

async function lookupMappedCatalogSeriesId(expectedIds: {
  anilist: Set<string>;
  mal: Set<string>;
}): Promise<string | null> {
  const anilistIds = toNumericIds(expectedIds.anilist);
  const malIds = toNumericIds(expectedIds.mal);
  if (anilistIds.length === 0 && malIds.length === 0) return null;

  const conditions: Array<{
    aniId?: { in: number[] };
    malId?: { in: number[] };
  }> = [];
  if (anilistIds.length > 0) conditions.push({ aniId: { in: anilistIds } });
  if (malIds.length > 0) conditions.push({ malId: { in: malIds } });

  try {
    const rows = await prisma.anikotoSeries.findMany({
      where: { OR: conditions },
      orderBy: { syncedAt: "desc" },
      take: 25,
    });
    if (rows.length === 0) return null;

    const both = rows.find(
      (row) =>
        row.aniId !== null &&
        row.malId !== null &&
        expectedIds.anilist.has(String(row.aniId)) &&
        expectedIds.mal.has(String(row.malId)),
    );
    const malMatch = rows.find(
      (row) => row.malId !== null && expectedIds.mal.has(String(row.malId)),
    );
    const aniMatch = rows.find(
      (row) => row.aniId !== null && expectedIds.anilist.has(String(row.aniId)),
    );

    const selected = both ?? malMatch ?? aniMatch;
    return selected ? String(selected.anikotoId) : null;
  } catch (error) {
    console.warn("[anikoto] failed to read catalog mapping", error);
    return null;
  }
}

export async function upsertAnikotoSeriesMapping(
  entry: RecentAnimeEntry,
): Promise<void> {
  await upsertAnikotoSeriesMappings([entry]);
}

export async function upsertAnikotoSeriesMappings(
  entries: RecentAnimeEntry[],
): Promise<number> {
  const rowsByAnikotoId = new Map<number, AnikotoMappingRow>();

  for (const entry of entries) {
    const row = toAnikotoMappingRow(entry);
    if (row) {
      rowsByAnikotoId.set(row.anikotoId, row);
    }
  }

  const rows = [...rowsByAnikotoId.values()];
  if (rows.length === 0) return 0;

  const now = new Date();

  try {
    await prisma.$executeRaw`
      INSERT INTO "AnikotoSeries" (
        "id",
        "anikotoId",
        "aniId",
        "malId",
        "title",
        "slug",
        "year",
        "subEpisodes",
        "dubEpisodes",
        "syncedAt",
        "createdAt",
        "updatedAt"
      )
      VALUES ${Prisma.join(
        rows.map(
          (row) =>
            Prisma.sql`(${row.id}, ${row.anikotoId}, ${row.aniId}, ${row.malId}, ${row.title}, ${row.slug}, ${row.year}, ${row.subEpisodes}, ${row.dubEpisodes}, ${now}, ${now}, ${now})`,
        ),
      )}
      ON CONFLICT ("anikotoId") DO UPDATE SET
        "aniId" = EXCLUDED."aniId",
        "malId" = EXCLUDED."malId",
        "title" = EXCLUDED."title",
        "slug" = EXCLUDED."slug",
        "year" = EXCLUDED."year",
        "subEpisodes" = EXCLUDED."subEpisodes",
        "dubEpisodes" = EXCLUDED."dubEpisodes",
        "syncedAt" = EXCLUDED."syncedAt",
        "updatedAt" = EXCLUDED."updatedAt"
    `;
    return rows.length;
  } catch (error) {
    console.warn("[anikoto] failed to persist catalog mapping", error);
    return 0;
  }
}

type AnikotoMappingRow = {
  id: string;
  anikotoId: number;
  aniId: number | null;
  malId: number | null;
  title: string;
  slug: string | null;
  year: number | null;
  subEpisodes: number | null;
  dubEpisodes: number | null;
};

function toAnikotoMappingRow(entry: RecentAnimeEntry): AnikotoMappingRow | null {
  const anikotoId = parseEpisodeNumber(entry.id ?? null);
  if (anikotoId === null || anikotoId <= 0) return null;

  const title =
    entry.title ?? entry.name ?? entry.english_title ?? entry.title_english;
  if (!title || !title.trim()) return null;

  return {
    id: randomUUID(),
    anikotoId,
    aniId: parseEpisodeNumber(entry.ani_id ?? null),
    malId: parseEpisodeNumber(entry.mal_id ?? null),
    title: title.trim(),
    slug: entry.slug?.trim() || null,
    year: parseEpisodeNumber(entry.year ?? null),
    subEpisodes: parseEpisodeNumber(entry.is_sub ?? null),
    dubEpisodes: parseEpisodeNumber(entry.is_dub ?? null),
  };
}

function toNumericIds(ids: Set<string>): number[] {
  const result: number[] = [];
  for (const id of ids) {
    const parsed = Number(id);
    if (Number.isFinite(parsed)) {
      result.push(parsed);
    }
  }
  return result;
}

function buildDirectCatalogCandidates(source: AnimeSource): number[] {
  const candidates: number[] = [];
  const add = (value?: number | null) => {
    if (!isFiniteNumber(value)) return;
    if (!candidates.includes(value)) {
      candidates.push(value);
    }
  };

  add(source.seasonAnilistId);
  add(source.seasonMalId);
  if (!source.seasonNumber || source.seasonNumber === 1) {
    add(source.anilistId);
    add(source.malId);
  }

  return candidates;
}

function getExpectedExternalIds(source: AnimeSource): {
  anilist: Set<string>;
  mal: Set<string>;
} {
  const anilist = new Set<string>();
  const mal = new Set<string>();
  const add = (target: Set<string>, value?: number | null) => {
    if (!isFiniteNumber(value)) return;
    target.add(String(value));
  };

  add(anilist, source.seasonAnilistId);
  add(mal, source.seasonMalId);
  if (!source.seasonNumber || source.seasonNumber === 1) {
    add(anilist, source.anilistId);
    add(mal, source.malId);
  }

  return { anilist, mal };
}

function seriesMatchesSource(
  series: SeriesPayload | null,
  source: AnimeSource,
  expectedIds: { anilist: Set<string>; mal: Set<string> },
): boolean {
  const anime = series?.data?.anime ?? series?.anime ?? null;
  if (!anime) return false;

  const aniId = toIdString(anime.ani_id);
  const malId = toIdString(anime.mal_id);

  if (aniId && expectedIds.anilist.has(aniId)) return true;
  if (malId && expectedIds.mal.has(malId)) return true;
  if (aniId || malId) return false;

  return seriesMatchesTitle(anime, source);
}

function entryMatchesExternalIds(
  entry: RecentAnimeEntry,
  expectedIds: { anilist: Set<string>; mal: Set<string> },
): boolean {
  const aniId = toIdString(entry.ani_id);
  const malId = toIdString(entry.mal_id);

  if (aniId && expectedIds.anilist.has(aniId)) return true;
  if (malId && expectedIds.mal.has(malId)) return true;
  return false;
}

function seriesMatchesTitle(anime: SeriesAnime, source: AnimeSource): boolean {
  const sourceTitles = buildBaseTitleCandidates(source);
  if (sourceTitles.length === 0) return false;

  const animeTitles = [anime.title, anime.name]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => normalizeText(value));

  return animeTitles.some((title) => sourceTitles.includes(title));
}

function toIdString(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export async function fetchRecentAnime(page: number): Promise<RecentAnimePayload | null> {
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

export function extractRecentAnimeEntries(payload: RecentAnimePayload | null): RecentAnimeEntry[] {
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
  const rawCandidates: string[] = [];
  const baseTitles = buildBaseTitleCandidates(source);

  if (source.seasonNumber && source.seasonNumber > 1) {
    for (const base of baseTitles) {
      rawCandidates.push(`${base} season ${source.seasonNumber}`);
      rawCandidates.push(`${base} temporada ${source.seasonNumber}`);
      rawCandidates.push(`${base} ${source.seasonNumber}`);
      rawCandidates.push(`${base} st ${source.seasonNumber}`);
    }
  } else {
    rawCandidates.push(...baseTitles);
  }

  return Array.from(new Set(rawCandidates.map((value) => normalizeText(value)))).filter(Boolean);
}

function buildBaseTitleCandidates(source: AnimeSource): string[] {
  return Array.from(
    new Set(
      [source.title, source.titleEnglish, source.slug?.replace(/-/g, " ")]
        .filter((value): value is string => Boolean(value && value.trim()))
        .map((value) => normalizeText(value)),
    ),
  ).filter(Boolean);
}

function buildDirectPlayers(
  source: AnimeSource,
  episodeNumber: number,
): MegaPlayAnimePlayer[] {
  const players: MegaPlayAnimePlayer[] = [];

  const effectiveAnilistId =
    source.seasonAnilistId ??
    (!source.seasonNumber || source.seasonNumber === 1 ? source.anilistId : null);

  const effectiveMalId =
    source.seasonMalId ??
    (!source.seasonNumber || source.seasonNumber === 1 ? source.malId : null);

  if (effectiveAnilistId) {
    const basePath = `/stream/ani/${encodeURIComponent(String(effectiveAnilistId))}/${episodeNumber}`;
    const vidnestPath = `/anime/${encodeURIComponent(String(effectiveAnilistId))}/${episodeNumber}`;
    const aniEmbedPath = `/e/${encodeURIComponent(String(effectiveAnilistId))}/${episodeNumber}`;
    players.push({
      id: "aniembed-anilist-sub",
      label: "AniEmbed (Sub)",
      url: `${ANIEMBED_BASE_URL}${aniEmbedPath}?lang=sub`,
    });
    players.push({
      id: "aniembed-anilist-dub",
      label: "AniEmbed (Dub)",
      url: `${ANIEMBED_BASE_URL}${aniEmbedPath}?lang=dub`,
    });
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
    players.push({
      id: "vidnest-anilist-sub",
      label: "VidNest (Sub)",
      url: `${VIDNEST_BASE_URL}${vidnestPath}/sub`,
    });
    players.push({
      id: "vidnest-anilist-dub",
      label: "VidNest (Dub)",
      url: `${VIDNEST_BASE_URL}${vidnestPath}/dub`,
    });
    players.push({
      id: "zokoanime-anilist-sub",
      label: "ZokoAnime (AniList Sub)",
      url: `${ZOKOANIME_BASE_URL}${basePath}/sub`,
    });
    players.push({
      id: "zokoanime-anilist-dub",
      label: "ZokoAnime (AniList Dub)",
      url: `${ZOKOANIME_BASE_URL}${basePath}/dub`,
    });
  }

  if (effectiveMalId) {
    const basePath = `/stream/mal/${encodeURIComponent(String(effectiveMalId))}/${episodeNumber}`;
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
    players.push({
      id: "zokoanime-mal-sub",
      label: "ZokoAnime (Sub)",
      url: `${ZOKOANIME_BASE_URL}${basePath}/sub`,
    });
    players.push({
      id: "zokoanime-mal-dub",
      label: "ZokoAnime (Dub)",
      url: `${ZOKOANIME_BASE_URL}${basePath}/dub`,
    });
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

function extractEmbedUrls(episode: SeriesEpisode, seasonNumber: number): {
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
    sub: `${MEGAPLAY_BASE_URL}/stream/s-${seasonNumber}/${encodeURIComponent(String(episodeEmbedId))}/sub`,
    dub: `${MEGAPLAY_BASE_URL}/stream/s-${seasonNumber}/${encodeURIComponent(String(episodeEmbedId))}/dub`,
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
