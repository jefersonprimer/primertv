import {
  extractRecentAnimeEntries,
  fetchRecentAnime,
  upsertAnikotoSeriesMappings,
} from "@/lib/anikoto";

const DEFAULT_DELAY_MS = 2100;
const DEFAULT_RETRY_DELAY_MS = 10000;
const MAX_RETRIES = 3;

export type AnikotoSyncProgress = {
  page: number;
  totalPages: number | null;
  entriesSynced: number;
};

export type AnikotoSyncOptions = {
  maxPages?: number;
  delayMs?: number;
  retryDelayMs?: number;
  onProgress?: (progress: AnikotoSyncProgress) => void;
};

export type AnikotoSyncResult = {
  pagesProcessed: number;
  entriesSynced: number;
  totalPages: number | null;
  stoppedEarly: boolean;
};

export async function syncAnikotoCatalog(
  options: AnikotoSyncOptions = {},
): Promise<AnikotoSyncResult> {
  const delayMs = Math.max(0, options.delayMs ?? DEFAULT_DELAY_MS);
  const retryDelayMs = Math.max(0, options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS);
  const maxPages =
    options.maxPages && options.maxPages > 0 ? options.maxPages : null;

  let page = 1;
  let pagesProcessed = 0;
  let entriesSynced = 0;
  let totalPages: number | null = null;
  let stoppedEarly = false;

  while (true) {
    const payload = await fetchPageWithRetry(page, retryDelayMs);
    if (!payload) {
      stoppedEarly = true;
      break;
    }

    const entries = extractRecentAnimeEntries(payload);
    entriesSynced += await upsertAnikotoSeriesMappings(entries);

    totalPages = getTotalPages(payload) ?? totalPages;
    pagesProcessed += 1;
    options.onProgress?.({ page, totalPages, entriesSynced });

    if (maxPages !== null && page >= maxPages) break;
    if (totalPages !== null && page >= totalPages) break;
    if (entries.length === 0) break;

    page += 1;
    await sleep(delayMs);
  }

  return { pagesProcessed, entriesSynced, totalPages, stoppedEarly };
}

async function fetchPageWithRetry(
  page: number,
  retryDelayMs: number,
): Promise<Awaited<ReturnType<typeof fetchRecentAnime>>> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const payload = await fetchRecentAnime(page);
    if (payload) return payload;
    if (attempt < MAX_RETRIES) {
      await sleep(retryDelayMs);
    }
  }
  return null;
}

function getTotalPages(
  payload: Awaited<ReturnType<typeof fetchRecentAnime>>,
): number | null {
  const pagination = payload?.pagination;
  const total =
    pagination?.last_page ?? pagination?.total_pages ?? pagination?.pages;
  return typeof total === "number" && total > 0 ? total : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
