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
  const decoded = decodeURIComponent(slug);
  const normalizedNFC = decoded.normalize("NFC");
  const normalizedNFD = decoded.normalize("NFD");
  const slugified = decoded.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\-]+/g, "").replace(/-+/g, "-");
  const channel = await prisma.channel.findFirst({
    where: {
      OR: [
        { slug: normalizedNFC },
        { slug: normalizedNFD },
        { slug: decoded },
        { slug: slugified },
        { slug: slug },
      ],
    },
  });

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
  const decoded = decodeURIComponent(slug);
  const normalizedNFC = decoded.normalize("NFC");
  const normalizedNFD = decoded.normalize("NFD");
  const slugified = decoded.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\-]+/g, "").replace(/-+/g, "-");

  const channel = await prisma.channel.findFirst({
    where: {
      OR: [
        { slug: normalizedNFC },
        { slug: normalizedNFD },
        { slug: decoded },
        { slug: slugified },
        { slug: slug },
      ],
    },
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
