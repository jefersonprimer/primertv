export interface ParsedPlayer {
  label: string;
  url: string;
}

const DEFAULT_LANG_MAP: Record<string, string> = {
  "pt-br dub": "Português (BR) Dublado",
  "pt-br sub": "Português (BR) Legendado",
  "pt-br": "Português (BR)",
  "en dub": "English Dubbed",
  "en sub": "English Subtitled",
  "en": "English",
  "es dub": "Español (LAT) Doblado",
  "es sub": "Español (LAT) Subtitulado",
  "es": "Español (LAT)",
  "fr dub": "Français Doublé",
  "fr sub": "Français Sous-titré",
  "fr": "Français",
  "de dub": "Deutsch Synchronisiert",
  "de sub": "Deutsch Untertitelt",
  "de": "Deutsch",
  "ar dub": "العربية مدبلج",
  "ar sub": "العربية مترجم",
  "ar": "العربية",
  "ja sub": "日本語 字幕",
  "ja dub": "日本語 吹き替え",
  "ja": "日本語",
};

/**
 * Parses a single line from the customPlayers textarea.
 * Accepts:
 * - JSON: {"Dublado em Português": "https://..."} or {"pt-br dub": "https://..."} or {"label": "...", "url": "..."}
 * - Key: URL format: "Dublado em Português: https://..."
 * - Plain URL fallback: "https://..."
 */
export function parseCustomPlayerLine(
  line: string,
  fallbackIndex: number
): ParsedPlayer | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // 1. Check if line is a JSON string
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === "object" && parsed !== null) {
        // Format A: {"label": "...", "url": "..."}
        const labelProp = parsed.label || parsed.name || parsed.key || parsed.title;
        const urlProp = parsed.url || parsed.src || parsed.link || parsed.videoUrl;
        if (urlProp && labelProp) {
          const rawLabel = String(labelProp).trim();
          const mapped = DEFAULT_LANG_MAP[rawLabel.toLowerCase()] || rawLabel;
          return { label: mapped, url: String(urlProp).trim() };
        }

        // Format B: {"Key/Label": "URL"} (e.g. {"Dublado em Português": "https://..."})
        const keys = Object.keys(parsed);
        if (keys.length === 1) {
          const rawKey = keys[0].trim();
          const urlVal = String(parsed[rawKey]).trim();
          if (urlVal) {
            const mapped = DEFAULT_LANG_MAP[rawKey.toLowerCase()] || rawKey;
            return { label: mapped, url: urlVal };
          }
        }
      }
    } catch {
      // Fall through to regex parsing
    }
  }

  // 2. Format: "Label: https://..." or "Label | https://..."
  const keyValueMatch = trimmed.match(/^([^:|]+)\s*[:|]\s*(https?:\/\/.+)$/i);
  if (keyValueMatch) {
    const rawKey = keyValueMatch[1].trim();
    const urlVal = keyValueMatch[2].trim();
    const mapped = DEFAULT_LANG_MAP[rawKey.toLowerCase()] || rawKey;
    return { label: mapped, url: urlVal };
  }

  // 3. Plain URL fallback
  return {
    label: `Player ${fallbackIndex}`,
    url: trimmed,
  };
}
