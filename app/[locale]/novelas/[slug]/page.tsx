import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";


import EpisodeList from "@/components/EpisodeList";
import MediaDescription from "@/components/MediaDescription";
import ShareButton from "@/components/ShareButton";
import { MediaCarousel } from "@/components/MediaCarousel";
import { getSession } from "@/lib/auth";
import { EditMediaButton } from "@/components/admin/EditMediaButton";
import { getFirstNovelaEpisodes } from "@/lib/media-performance";
import { getNovelaDetailsBySlug } from "@/lib/media-details";
import { StartWatchingButton } from "@/components/StartWatchingButton";

export const revalidate = 3600;

interface NovelaDetailsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: NovelaDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const novela = await getNovelaDetailsBySlug(slug);

  if (!novela) return { title: "Novela não encontrada" };

  return {
    title: `Assistir ${novela.title} Online em HD - PrimerTv`,
    description: `Assista a novela ${novela.title} online grátis em HD no PrimerTv.`,
    openGraph: {
      title: novela.title,
      images: novela.imageUrl ? [novela.imageUrl] : [],
    },
  };
}

export default async function NovelaDetailsPage({
  params,
}: NovelaDetailsPageProps) {
  const { slug } = await params;
  const novela = await getNovelaDetailsBySlug(slug);

  if (!novela) {
    notFound();
  }

  const session = await getSession();
  const isAdmin = session?.user?.role === "admin";

  const firstEpisodeId =
    (await getFirstNovelaEpisodes([novela.id])).get(novela.id)?.firstEpisodeId ??
    null;

  const similarNovelas =
    novela.genres && novela.genres.length > 0
      ? await prisma.novela.findMany({
          where: {
            genres: {
              hasSome: novela.genres,
            },
            id: {
              not: novela.id,
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
        <div className="absolute top-0 left-0 right-0 h-[90vh] hidden md:block bg-zinc-900 overflow-hidden">
          {novela.imageUrl && (
            <Image
              src={novela.imageUrl}
              alt={novela.title}
              fill
              sizes="100vw"
              className="object-cover opacity-100"
              priority
            />
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
              {novela.imageUrl ? (
                <Image
                  src={novela.imageUrl}
                  alt={novela.title}
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
                    {novela.title}
                  </h1>
                </div>

                {novela.genres && novela.genres.length > 0 && (
                  <div className="mt-2 flex items-center justify-center md:justify-start flex-wrap gap-2">
                    <span className="text-xs font-medium text-zinc-300 md:text-zinc-700 md:dark:text-zinc-300">
                      {novela.genres.map((genre, index) => (
                        <span key={genre}>
                          <span className="underline">{genre}</span>
                          {index < novela.genres.length - 1 && ", "}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <div className="flex flex-row items-center gap-3 w-full md:w-auto">
                  {firstEpisodeId && (
                    <StartWatchingButton
                      href={`/novelas/${novela.slug}/episode/${firstEpisodeId}`}
                      className="flex-1 md:h-auto md:flex-initial md:px-4 md:py-2 md:w-fit"
                      uppercase={false}
                    />
                  )}
                </div>
                <div className="flex flex-row items-center gap-3 w-full md:w-auto justify-center md:justify-start">
                  <ShareButton />
                  {isAdmin && (
                    <EditMediaButton
                      collection="novelas"
                      item={novela}
                      className="flex h-10 items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors md:h-auto md:py-2.5 uppercase"
                    />
                  )}
                </div>
              </div>

              {novela.description && (
                <div className="mt-4 w-full">
                  <MediaDescription
                    description={novela.description}
                    genres={novela.genres}
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
          Capítulos / Episódios
        </h2>

        {novela.seasons.length === 0 ? (
          <p className="text-zinc-500">Nenhum capítulo encontrado.</p>
        ) : (
          <div className="flex flex-col gap-12">
            {novela.seasons.map((season) => (
              <section key={season.id}>
                {novela.seasons.length > 1 && (
                  <h3 className="mb-4 text-xl font-semibold text-zinc-800 dark:text-zinc-200">
                    Temporada {season.number}
                  </h3>
                )}

                <EpisodeList
                  items={season.episodes}
                  baseUrl={`/novelas/${novela.slug}/episode`}
                  itemType="episode"
                  animeTitle={novela.title}
                />
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Similar Novelas Carousel */}
      {similarNovelas.length > 0 && (
        <div className="pl-2 lg:pl-0 pb-12">
          <MediaCarousel
            title="Novelas Semelhantes"
            subtitle="Baseado nos gêneros desta novela"
            items={similarNovelas}
            type="novela"
          />
        </div>
      )}
    </div>
  );
}
