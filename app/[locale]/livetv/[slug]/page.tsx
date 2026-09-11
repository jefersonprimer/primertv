import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { connection } from "next/server";
import { ChannelPlayer } from "./ChannelPlayer";
import { getSession } from "@/lib/auth";

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

  const [channel, allChannels, session] = await Promise.all([
    prisma.channel.findFirst({
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
    }),
    prisma.channel.findMany({
      orderBy: { position: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        imageUrl: true,
        position: true,
      },
    }),
    getSession(),
  ]);

  if (!channel) {
    notFound();
  }

  const isAdmin = session?.user?.role === "admin";

  return (
    <main className="w-full min-h-[calc(100vh-3.5rem)] 2xl:min-h-[calc(100vh-4rem)] bg-[#0E0E0E]">
      <div className="mx-auto max-w-[1500px] px-0 md:px-6 py-0 md:py-6 pb-6 md:pb-10">
        <ChannelPlayer
          channel={channel}
          allChannels={allChannels}
          isAdmin={isAdmin}
        />
      </div>
    </main>
  );
}
