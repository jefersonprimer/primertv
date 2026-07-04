import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/routing";

interface WatchRedirectProps {
  params: Promise<{ locale: string; publicId: string }>;
}

export default async function WatchRedirectPage({
  params,
}: WatchRedirectProps) {
  const { locale, publicId } = await params;

  // First look up in Anime episodes
  let episode = await prisma.episode.findUnique({
    where: { publicId },
    select: { slug: true, number: true },
  });

  if (!episode) {
    episode = await prisma.episode.findUnique({
      where: { id: publicId },
      select: { slug: true, number: true },
    });
  }

  if (!episode) {
    // If not found, look up in Series episodes
    const seriesEpisode = (await prisma.seriesEpisode.findUnique({
      where: { publicId },
      select: { slug: true, number: true },
    })) || (await prisma.seriesEpisode.findUnique({
      where: { id: publicId },
      select: { slug: true, number: true },
    }));
    if (seriesEpisode) {
      episode = seriesEpisode;
    }
  }

  if (!episode) {
    // If not found, look up in Movies
    const movie = (await prisma.movie.findUnique({
      where: { publicId },
      select: { slug: true },
    })) || (await prisma.movie.findUnique({
      where: { id: publicId },
      select: { slug: true },
    }));
    if (movie) {
      redirect({ href: `/watch/${publicId}/${movie.slug}`, locale });
    }
    notFound();
  }

  const slug = episode.slug || `episode-${episode.number}`;
  redirect({ href: `/watch/${publicId}/${slug}`, locale });
}
