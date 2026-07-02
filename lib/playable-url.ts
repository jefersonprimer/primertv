const DIRECT_MEDIA_EXTENSIONS = [".mp4", ".m3u8", ".webm", ".ogg"];
const MAX_DEPTH = 3;
const TIMEOUT_MS = 8000;

export async function resolvePlayableUrl(
  inputUrl: string | null | undefined,
): Promise<string | null> {
  if (!inputUrl) return null;

  let currentUrl = normalizeUrl(inputUrl);
  if (!currentUrl) return null;

  const visited = new Set<string>();

  for (let depth = 0; depth < MAX_DEPTH; depth++) {
    if (visited.has(currentUrl)) {
      return null;
    }
    visited.add(currentUrl);

    if (isDirectMediaUrl(currentUrl) || isKnownEmbedUrl(currentUrl)) {
      return currentUrl;
    }

    const html = await fetchHtml(currentUrl);
    if (!html) {
      return null;
    }

    const dooplayUrl = await tryExtractDooplay(html, currentUrl);
    if (dooplayUrl) {
      if (isDirectMediaUrl(dooplayUrl) || isKnownEmbedUrl(dooplayUrl)) {
        return dooplayUrl;
      }
      currentUrl = dooplayUrl;
      continue;
    }

    const candidates = collectCandidates(html, currentUrl);
    const directCandidate = candidates.find(isDirectMediaUrl);
    if (directCandidate) {
      return directCandidate;
    }

    const embedCandidate = candidates.find(isKnownEmbedUrl);
    if (embedCandidate) {
      return embedCandidate;
    }

    const nextCandidate = candidates.find((candidate) => !visited.has(candidate));
    if (!nextCandidate) {
      // If we are at depth > 0 and have no more candidates, 
      // the current URL might be the best we can do (e.g. an unknown embed player)
      return depth > 0 ? currentUrl : null;
    }

    currentUrl = nextCandidate;
  }

  return null;
}

function isDirectMediaUrl(url: string): boolean {
  const pathname = safePathname(url);
  return DIRECT_MEDIA_EXTENSIONS.some((extension) => pathname.endsWith(extension));
}

function isKnownEmbedUrl(url: string): boolean {
  const embedPatterns = [
    "blogger.com/video.g",
    "youtube.com/embed",
    "player.vimeo.com/video",
    "dailymotion.com/embed",
    "vidsrc.me",
    "vidsrc.to",
    "embed.su",
    "aniwave.to",
    "vidplay.site",
    "filemoon.sx",
    "vizcloud.online",
    "mcloud.to",
    "myembed.biz",
    "2embed.cc",
  ];
  return embedPatterns.some((pattern) => url.includes(pattern));
}

async function tryExtractDooplay(
  html: string,
  baseUrl: string,
): Promise<string | null> {
  const optionMatch = html.match(
    /class=['"]dooplay_player_option['"][^>]*data-type=['"]([^'"]+)['"][^>]*data-post=['"]([^'"]+)['"][^>]*data-nume=['"]([^'"]+)['"]/i,
  );

  if (optionMatch) {
    const type = optionMatch[1];
    const post = optionMatch[2];
    const nume = optionMatch[3];
    const ajaxUrl = new URL("/wp-admin/admin-ajax.php", baseUrl).toString();

    try {
      const params = new URLSearchParams();
      params.append("action", "doo_player_ajax");
      params.append("post", post);
      params.append("nume", nume);
      params.append("type", type);

      const response = await fetch(ajaxUrl, {
        method: "POST",
        body: params,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.embed_url) {
          return data.embed_url;
        }
      }
    } catch (e) {
      console.error("Error extracting Dooplay player:", e);
    }
  }
  return null;
}

async function fetchHtml(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml+xml") && !contentType.includes("text/plain")) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function collectCandidates(html: string, baseUrl: string): string[] {
  const candidates = new Set<string>();
  const content = decodeEscapedHtml(html);

  const patterns = [
    /<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi,
    /<video\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi,
    /<source\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi,
    /(?:src|href|file|url)\s*[:=]\s*["']([^"']+\.(?:mp4|m3u8|webm|ogg)(?:\?[^"'<> ]*)?)["']/gi,
    /(?:src|href)\s*=\s*["']([^"']+\.(?:mp4|m3u8|webm|ogg)(?:\?[^"'<> ]*)?)["']/gi,
  ];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      const normalized = normalizeUrl(match[1], baseUrl);
      if (normalized) {
        candidates.add(normalized);
      }
    }
  }

  return [...candidates];
}

function decodeEscapedHtml(input: string): string {
  return input
    .replace(/\\u003c/gi, "<")
    .replace(/\\u003e/gi, ">")
    .replace(/\\u0026/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

function normalizeUrl(url: string, baseUrl?: string): string | null {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("javascript:") || trimmed.startsWith("data:")) {
    return null;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  try {
    return baseUrl ? new URL(trimmed, baseUrl).toString() : new URL(trimmed).toString();
  } catch {
    return null;
  }
}

function safePathname(url: string): string {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return url.split("?")[0].toLowerCase();
  }
}
