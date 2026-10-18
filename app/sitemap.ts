import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

const locales = routing.locales;

const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/animes", changeFrequency: "daily", priority: 0.9 },
  { path: "/series", changeFrequency: "daily", priority: 0.9 },
  { path: "/movies", changeFrequency: "daily", priority: 0.9 },
  { path: "/livetv", changeFrequency: "daily", priority: 0.8 },
  { path: "/mangas", changeFrequency: "daily", priority: 0.8 },
  { path: "/novelas", changeFrequency: "daily", priority: 0.8 },
  { path: "/seasons", changeFrequency: "weekly", priority: 0.7 },
  { path: "/calendar", changeFrequency: "weekly", priority: 0.6 },
  { path: "/popular", changeFrequency: "daily", priority: 0.7 },
  { path: "/new", changeFrequency: "daily", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.3 },
  { path: "/dmca", changeFrequency: "monthly", priority: 0.2 },
];

type SlugRow = { slug: string; updatedAt: Date };

function localizedEntries(
  base: string,
  rows: SlugRow[],
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
): MetadataRoute.Sitemap {
  return locales.flatMap((locale) =>
    rows.map((row) => ({
      url: `${SITE_URL}/${locale}${base}/${row.slug}`,
      lastModified: row.updatedAt,
      changeFrequency,
      priority,
    })),
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [animes, series, movies, mangas, novelas, channels] =
    await Promise.all([
      // Exclui stubs ("anime-*" sem imagem) que retornam 404 na página de detalhe
      prisma.anime.findMany({
        where: {
          NOT: { AND: [{ slug: { startsWith: "anime-" } }, { imageUrl: null }] },
        },
        select: { slug: true, updatedAt: true },
      }),
      prisma.series.findMany({
        select: { slug: true, updatedAt: true },
      }),
      prisma.movie.findMany({
        select: { slug: true, updatedAt: true },
      }),
      prisma.manga.findMany({
        select: { slug: true, updatedAt: true },
      }),
      prisma.novela.findMany({
        select: { slug: true, updatedAt: true },
      }),
      prisma.channel.findMany({
        select: { slug: true, updatedAt: true },
      }),
    ]);

  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    STATIC_PATHS.map(({ path, changeFrequency, priority }) => ({
      url: `${SITE_URL}/${locale}${path === "/" ? "" : path}`,
      changeFrequency,
      priority,
    })),
  );

  return [
    ...staticEntries,
    ...localizedEntries("/animes", animes, "weekly", 0.8),
    ...localizedEntries("/series", series, "weekly", 0.8),
    ...localizedEntries("/movies", movies, "weekly", 0.8),
    ...localizedEntries("/mangas", mangas, "weekly", 0.8),
    ...localizedEntries("/novelas", novelas, "weekly", 0.8),
    ...localizedEntries("/livetv", channels, "daily", 0.7),
  ];
}
