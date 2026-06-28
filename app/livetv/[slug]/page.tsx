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
    <main className="mx-auto max-w-[1223px]">
      <ChannelPlayer channel={channel} />
    </main>
  );
}
