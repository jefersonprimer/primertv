import { prisma } from "@/lib/prisma";
import { connection } from "next/server";
import { ChannelsList } from "./ChannelsList";

export default async function ChannelsPage() {
  await connection();

  const channels = await prisma.channel.findMany({
    orderBy: [{ position: "asc" }, { title: "asc" }],
  });

  return (
    <div className="pb-8">
      <ChannelsList initialChannels={channels} />
    </div>
  );
}
