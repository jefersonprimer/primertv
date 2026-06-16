import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { connection } from "next/server";
import { ChannelPlayer } from "./ChannelPlayer";

export const revalidate = 3600;

interface ChannelPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ChannelPageProps): Promise<Metadata> {
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
  await connection();
  const { slug } = await params;

  const channel = await prisma.channel.findUnique({
    where: { slug },
    include: {
      sources: true,
    },
  });

  if (!channel) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl p-8 md:p-12">
      <ChannelPlayer channel={channel} />

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-xl font-bold">Sobre o Canal</h3>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Você está assistindo ao sinal ao vivo de {channel.title}.{" "}
              {channel.description ||
                "Aproveite a melhor programação da TV brasileira em tempo real, com imagem de alta definição e som digital."}
            </p>
          </div>
        </div>

        <div>
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-bold">Instruções</h3>
            <ul className="mt-4 space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-500">
                  1
                </span>
                Se o player não carregar, tente atualizar a página ou trocar a opção de player.
              </li>
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-500">
                  2
                </span>
                Alguns canais podem exibir anúncios externos do próprio
                player.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
