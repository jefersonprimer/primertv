import { prisma } from "@/lib/prisma";
import { connection } from "next/server";
import { ChannelsList } from "./ChannelsList";

export default async function ChannelsPage() {
  await connection();

  const channels = await prisma.channel.findMany({
    orderBy: [{ position: "asc" }, { title: "asc" }],
  });

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] 2xl:min-h-[calc(100vh-4rem)] bg-[#0E0E0E] pb-8">
      <ChannelsList initialChannels={channels} />
    </div>
  );
}
