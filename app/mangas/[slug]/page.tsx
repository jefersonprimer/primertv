import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

import EpisodeList from "@/components/EpisodeList";
import MediaDescricao from "@/components/MediaDescricao";
import { WatchlistButton } from "@/components/WatchlistButton";
import { getAuthenticatedUserId, isInWatchlist } from "@/lib/watchlist";
import { Metadata } from "next";
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

  if (!manga) return { title: "Manga não encontrada" };

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
    description: `Leia ao ${manga.title} online grátis no PrimerTv.`,
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

  const userId = await getAuthenticatedUserId();
  const inWatchlist = await isInWatchlist("MANGA", manga.id);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header/Banner Section */}
      <div className="relative h-[70vh] w-full overflow-hidden bg-zinc-900">
        {finalBannerUrl ? (
          <Image
            src={finalBannerUrl}
            alt={manga.title}
            fill
            sizes="100vw"
            className="object-cover opacity-35"
            priority
          />
        ) : (
          manga.imageUrl && (
            <Image
              src={manga.imageUrl}
              alt={manga.title}
              fill
              sizes="100vw"
              className="object-cover opacity-30 blur-sm"
              priority
            />
          )
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 to-transparent dark:from-black" />

        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="mx-auto flex max-w-[1223px] flex-col gap-6 md:flex-row md:items-end">
            <div className="relative aspect-[2/3] w-48 lg:w-60 flex-shrink-0 overflow-hidden shadow-2xl">
              {manga.imageUrl ? (
                <Image
                  src={manga.imageUrl}
                  alt={manga.title}
                  fill
                  sizes="(max-width: 768px) 192px, 240px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-zinc-800 text-zinc-400">
                  Sem imagem
                </div>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 md:text-4xl">
                {manga.title}
              </h1>
              <WatchlistButton
                mediaType="MANGA"
                mediaId={manga.id}
                slug={manga.slug}
                initialInWatchlist={inWatchlist}
                isLoggedIn={Boolean(userId)}
              />
              {manga.genres && manga.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {manga.genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
              {manga.description && (
                <div className="max-w-2xl">
                  <MediaDescricao description={manga.description} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chapters Section */}
      <main className="mx-auto max-w-[1223px] py-12">
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
    </div>
  );
}
