import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { connection } from "next/server";

export const revalidate = 3600;

interface ChannelPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ChannelPageProps): Promise<Metadata> {
  const { slug } = await params;
  const channel = await prisma.channel.findUnique({ where: { slug } });

  if (!channel) return { title: "Canal não encontrado" };

  return {
    title: `Assistir ${channel.title} Ao Vivo Online - Primerflix`,
    description: `Assista ao canal ${channel.title} ao vivo online grátis no Primerflix.`,
    openGraph: {
      title: channel.title,
      images: channel.imageUrl ? [channel.imageUrl] : [],
    },
  };
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { slug } = await params;

  const channel = await prisma.channel.findUnique({
    where: { slug },
  });


  if (!channel) {
    notFound();
  }

  const isDirectVideo = channel.videoUrl?.endsWith(".mp4") || channel.videoUrl?.endsWith(".m3u8");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50">
      <div className="relative h-[40vh] w-full overflow-hidden bg-zinc-900">
        {channel.imageUrl && (
          <Image
            src={channel.imageUrl}
            alt={channel.title}
            fill
            sizes="100vw"
            className="object-cover opacity-40 blur-md"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-zinc-50/20 to-transparent dark:from-black dark:via-black/20" />
        
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 md:flex-row">
            <div className="relative aspect-[1/1] w-48 flex-shrink-0 overflow-hidden rounded-full shadow-2xl ring-4 ring-white/10 bg-white p-4">
              {channel.imageUrl ? (
                <Image
                  src={channel.imageUrl}
                  alt={channel.title}
                  fill
                  sizes="192px"
                  className="object-contain p-4"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-zinc-800 text-zinc-400">
                  {channel.title.substring(0, 1)}
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-center gap-6 text-center md:items-start md:text-left">
              <Link
                href="/channels"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-400"
              >
                ← Voltar para Canais
              </Link>
              <h1 className="text-5xl font-extrabold tracking-tight md:text-7xl">
                {channel.title}
              </h1>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-500 ring-1 ring-inset ring-red-500/20">
                  Ao Vivo
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  Transmissão Digital HD
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl p-8 md:p-12">
        <div className="group relative aspect-video w-full overflow-hidden rounded-3xl bg-black shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800">
          {channel.videoUrl ? (
            isDirectVideo ? (
              <video
                src={channel.videoUrl}
                controls
                autoPlay
                className="h-full w-full"
              />
            ) : (
              <iframe
                src={channel.videoUrl}
                className="absolute inset-0 h-full w-full"
                allowFullScreen
                scrolling="no"
                allow="autoplay; fullscreen; picture-in-picture"
                title={`Player para ${channel.title}`}
              />
            )
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-zinc-500">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500" />
              <p>Conectando ao sinal do canal...</p>
            </div>
          )}
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-xl font-bold">Sobre o Canal</h3>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Você está assistindo ao sinal ao vivo de {channel.title}. {channel.description || "Aproveite a melhor programação da TV brasileira em tempo real, com imagem de alta definição e som digital."}
              </p>
            </div>
          </div>
          
          <div>
            <div className="rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-lg font-bold">Instruções</h3>
              <ul className="mt-4 space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
                <li className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-500">1</span>
                  Se o player não carregar, tente atualizar a página.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-500">2</span>
                  Alguns canais podem exibir anúncios externos do próprio player.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
