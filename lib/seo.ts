import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";

export const metadataBase = new URL(SITE_URL);

const HREFLANG: Record<string, string> = {
  "pt-br": "pt-BR",
  en: "en",
  es: "es",
  fr: "fr",
  de: "de",
  ar: "ar",
};

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
