import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";

export const metadataBase = new URL(SITE_URL);

/**
 * Diretiva de robôs para páginas privadas, fluxos autenticados, buscas
 * ou variantes que não devem ser indexadas, mas cujos links podem ser rastreados.
 */
export const NOINDEX_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: true,
};

export const SITE_NAME = "PrimerTV";

const HREFLANG: Record<string, string> = {
  "pt-br": "pt-BR",
  en: "en",
  es: "es",
  fr: "fr",
  de: "de",
  ar: "ar",
};

export const OG_LOCALES: Record<string, string> = {
  "pt-br": "pt_BR",
  en: "en_US",
  es: "es_ES",
  fr: "fr_FR",
  de: "de_DE",
  ar: "ar_AR",
};

export function getOgLocale(locale?: string): string {
  if (!locale) return "pt_BR";
  return OG_LOCALES[locale] ?? "pt_BR";
}

export const DEFAULT_TWITTER: NonNullable<Metadata["twitter"]> = {
  card: "summary_large_image",
};

export interface OpenGraphOptions {
  title: string;
  description?: string;
  locale?: string;
  type?:
    | "website"
    | "article"
    | "book"
    | "video.movie"
    | "video.episode"
    | "video.tv_show"
    | "video.other";
  images?: (string | { url: string; alt?: string; width?: number; height?: number })[];
  url?: string;
}

export function buildOpenGraph({
  title,
  description,
  locale = "pt-br",
  type = "website",
  images,
  url,
}: OpenGraphOptions): Metadata["openGraph"] {
  const ogLocale = getOgLocale(locale);
  const baseOg = {
    title,
    ...(description ? { description } : {}),
    siteName: SITE_NAME,
    locale: ogLocale,
    ...(url ? { url } : {}),
    ...(images && images.length > 0 ? { images } : {}),
  };

  switch (type) {
    case "video.movie":
      return { ...baseOg, type: "video.movie" };
    case "video.episode":
      return { ...baseOg, type: "video.episode" };
    case "video.tv_show":
      return { ...baseOg, type: "video.tv_show" };
    case "video.other":
      return { ...baseOg, type: "video.other" };
    case "book":
      return { ...baseOg, type: "book" };
    case "article":
      return { ...baseOg, type: "article" };
    case "website":
    default:
      return { ...baseOg, type: "website" };
  }
}

export interface TwitterOptions {
  card?: "summary" | "summary_large_image" | "player" | "app";
  title?: string;
  description?: string;
  images?: (string | { url: string; alt?: string })[];
}

export function buildTwitter({
  card = "summary_large_image",
  title,
  description,
  images,
}: TwitterOptions = {}): Metadata["twitter"] {
  return {
    card,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(images && images.length > 0 ? { images } : {}),
  };
}

/**
 * Gera `alternates.canonical` + `alternates.languages` (hreflang) para uma
 * página dentro de `app/[locale]`.
 *
 * @param path Caminho SEM o prefixo de locale, ex.: "/", "/animes", "/animes/meu-slug".
 *             Ignorar query strings (?player= etc.) — variantes canonizam para a URL limpa.
 */
export function buildAlternates(
  locale: string,
  path: string,
): Metadata["alternates"] {
  const normalized =
    path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[HREFLANG[l] ?? l] = `${SITE_URL}/${l}${normalized}`;
  }
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}${normalized}`;

  return {
    canonical: `${SITE_URL}/${locale}${normalized}`,
    languages,
  };
}
