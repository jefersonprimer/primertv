import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { BookOpen } from "lucide-react";

import EpisodeList from "@/components/EpisodeList";
import MediaDescricao from "@/components/MediaDescricao";
import RatingBadge from "@/components/RatingBadge";
import { WatchlistButton } from "@/components/WatchlistButton";
import ShareButton from "@/components/ShareButton";
import { getAuthenticatedUserId, isInWatchlist } from "@/lib/watchlist";
import { MediaCarousel } from "@/components/MediaCarousel";
import { getMangaBanner } from "@/lib/banners";

export const revalidate = 3600;

interface MangaDetailsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: MangaDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const manga = await prisma.manga.findUnique({ where: { slug } });

  if (!manga) return { title: "Mangá não encontrado" };

  let bannerUrl = manga.bannerUrl;
  if (!bannerUrl) {
    bannerUrl = await getMangaBanner(manga.id, manga.title);
  }
  const ogBannerUrl = bannerUrl === "none" ? null : bannerUrl;

  const ogImages = [];
  if (ogBannerUrl) ogImages.push(ogBannerUrl);
  if (manga.imageUrl) ogImages.push(manga.imageUrl);

  return {
    title: `Leia ${manga.title} Online - PrimerTv`,
    description: `Leia o mangá ${manga.title} online grátis no PrimerTv.`,
    openGraph: {
      title: manga.title,
      images: ogImages,
    },
  };
}

export default async function MangaDetailsPage({
  params,
}: MangaDetailsPageProps) {
  const { slug } = await params;

  const manga = await prisma.manga.findUnique({
    where: { slug },
    include: {
      chapters: {
        orderBy: { number: "asc" },
      },
    },
  });

  if (!manga) {
    notFound();
  }

  let bannerUrl = manga.bannerUrl;
  if (!bannerUrl) {
    bannerUrl = await getMangaBanner(manga.id, manga.title);
  }
  const finalBannerUrl = bannerUrl === "none" ? null : bannerUrl;

  const firstChapterId = manga.chapters[0]?.id;
  const userId = await getAuthenticatedUserId();
  const inWatchlist = await isInWatchlist("MANGA", manga.id);

  const similarMangas =
    manga.genres && manga.genres.length > 0
      ? await prisma.manga.findMany({
          where: {
            genres: {
              hasSome: manga.genres,
            },
            id: {
              not: manga.id,
            },
          },
          select: {
            id: true,
            slug: true,
            title: true,
            imageUrl: true,
          },
          take: 15,
        })
      : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Hero Section */}
      <div className="relative md:min-h-[90vh] w-full md:flex md:flex-col md:justify-end">
        {/* Banner Section */}
        <div className="absolute inset-0 hidden md:block bg-zinc-900 overflow-hidden">
          {finalBannerUrl ? (
            <Image
              src={finalBannerUrl}
              alt={manga.title}
              fill
              sizes="100vw"
              className="object-cover opacity-100"
              priority
            />
          ) : (
            manga.imageUrl && (
              <Image
                src={manga.imageUrl}
                alt={manga.title}
                fill
                sizes="100vw"
                className="object-cover opacity-100"
                priority
              />
            )
          )}
          {/* Bottom Gradient (fades to page bg) */}
          <div className="absolute bottom-0 left-0 right-0 h-68 bg-gradient-to-t from-zinc-50 to-transparent dark:from-black" />
          {/* Left Gradient (occupies 40% of the width, fading softer to transparent) */}
          <div className="absolute inset-y-0 left-0 w-[40%] bg-gradient-to-r from-zinc-50/80 to-transparent dark:from-black/80" />
          {/* Right Gradient (occupies 10% of the width, fading to transparent) */}
          <div className="absolute inset-y-0 right-0 w-[10%] bg-gradient-to-l from-zinc-50/50 to-transparent dark:from-black/50" />
        </div>

        {/* Content Container */}
        <div className="mx-auto max-w-[1223px] w-full relative z-10 md:py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end">
            {/* Poster Image */}
            <div className="relative aspect-[2/3] w-full self-center overflow-hidden shadow-2xl md:hidden flex-shrink-0">
              {manga.imageUrl ? (
                <Image
                  src={manga.imageUrl}
                  alt={manga.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 240px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-zinc-800 text-zinc-400">
                  Sem imagem
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="relative z-10 flex flex-1 flex-col gap-4 md:gap-8 -mt-70 md:mt-0 py-6 px-4 md:p-0 w-full">
              {/* Mobile Background: borderless subtle gradient from transparent to black */}
              <div
                className="absolute inset-x-0 bottom-0 -top-[6px] -z-10 md:hidden"
                style={
                  {
                    backgroundImage:
                      "linear-gradient(to bottom, rgba(0, 0, 0, 0) 0px, rgba(0, 0, 0, 0.5) 50px, rgba(0, 0, 0, 0.8) 140px, #000 260px)",
                  } as React.CSSProperties
                }
              />
              <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left w-full md:max-w-2xl">
                <div className="flex flex-col gap-1 w-full items-center md:items-start">
                  <h1 className="text-2xl font-bold text-zinc-50 md:text-zinc-900 md:dark:text-zinc-50 md:text-[34px] line-clamp-2 max-w-[380px]">
                    {manga.title}
                  </h1>
                </div>

                {(manga.rating ||
                  (manga.genres && manga.genres.length > 0)) && (
                  <div className="mt-2 flex items-center justify-center md:justify-start flex-wrap gap-2">
                    {manga.rating && (
                      <RatingBadge rating={manga.rating} className="h-5 w-5" />
                    )}
                    {manga.rating &&
                      manga.genres &&
                      manga.genres.length > 0 && (
                        <span
                          className="text-zinc-400 dark:text-zinc-600 flex items-center justify-center"
                          aria-hidden="true"
                        >
                          <svg
                            className="h-2 w-2 fill-current"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2L22 12L12 22L2 12Z" />
                          </svg>
                        </span>
                      )}
                    <span className="text-xs font-medium text-zinc-300 md:text-zinc-700 md:dark:text-zinc-300">
                      {manga.genres?.map((genre, index) => (
                        <span key={genre}>
                          <span className="underline">{genre}</span>
                          {index < manga.genres.length - 1 && ", "}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <div className="flex flex-row items-center gap-3 w-full md:w-auto">
                  {firstChapterId && (
                    <Link
                      href={`/mangas/${manga.slug}/chapter/${firstChapterId}`}
                      className="flex h-10 flex-1 items-center justify-center gap-2 bg-blue-600 font-semibold text-white transition-colors hover:bg-blue-700 md:h-auto md:flex-initial md:px-4 md:py-2 md:w-fit"
                    >
                      <BookOpen className="h-5 w-5" />
                      Começar a ler Cap 1
                    </Link>
                  )}
                  <WatchlistButton
                    mediaType="MANGA"
                    mediaId={manga.id}
                    slug={manga.slug}
                    initialInWatchlist={inWatchlist}
                    isLoggedIn={Boolean(userId)}
                  />
                </div>
                <div className="flex flex-row items-center gap-3 w-full md:w-auto justify-center md:justify-start">
                  <ShareButton />
                </div>
              </div>

              {manga.description && (
                <div className="mt-4 w-full">
                  <MediaDescricao
                    description={manga.description}
                    rating={manga.rating || undefined}
                    genres={manga.genres}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chapters Section */}
      <main className="mx-auto max-w-[1240px] pb-12 px-4 md:px-0">
        <h2 className="mb-8 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Capítulos
        </h2>
        {manga.chapters.length === 0 ? (
          <p className="text-zinc-500">Nenhum capítulo encontrado.</p>
        ) : (
          <EpisodeList
            items={manga.chapters}
            baseUrl={`/mangas/${manga.slug}/chapter`}
            label="Capítulo"
            itemType="chapter"
          />
        )}
      </main>

      {/* Similar Mangas Carousel */}
      {similarMangas.length > 0 && (
        <div className="pl-2 lg:pl-0 pb-12">
          <MediaCarousel
            title="Mangás Semelhantes"
            subtitle="Baseado nos gêneros deste mangá"
            items={similarMangas}
            type="manga"
          />
        </div>
      )}
    </div>
  );
}
