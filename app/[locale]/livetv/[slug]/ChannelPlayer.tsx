"use client";

import { useState } from "react";

interface ChannelPlayerProps {
  channel: {
    title: string;
    videoUrl: string | null;
    embedUrl: string | null;
    sources?: {
      id: string;
      title: string;
      url: string;
    }[];
  };
}

export function ChannelPlayer({ channel }: ChannelPlayerProps) {
  const [activePlayer, setActivePlayer] = useState<{
    type: "primary" | "embed" | "source";
    sourceId?: string;
  }>(() => {
    if (channel.videoUrl) return { type: "primary" };
    if (channel.sources && channel.sources.length > 0)
      return { type: "source", sourceId: channel.sources[0].id };
    return { type: "embed" };
  });

  const currentUrl =
    activePlayer.type === "primary"
      ? channel.videoUrl
      : activePlayer.type === "embed"
        ? channel.embedUrl
        : channel.sources?.find((s) => s.id === activePlayer.sourceId)?.url;

  const isDirectVideo =
    currentUrl?.split("?")[0].endsWith(".mp4") ||
    currentUrl?.split("?")[0].endsWith(".m3u8");

  return (
    <div className="space-y-6">
      <div className="group relative aspect-video overflow-hidden bg-black shadow-2xl max-w-5xl mx-auto">
        {currentUrl ? (
          isDirectVideo ? (
            <video
              src={currentUrl}
              controls
              autoPlay
              className="h-full w-full"
            />
          ) : (
            <iframe
              src={currentUrl}
              className="absolute inset-0 h-full w-full overflow-y-auto"
              allowFullScreen
              scrolling="auto"
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

      <div className="flex flex-wrap items-center gap-4">
        {channel.videoUrl && (
          <button
            onClick={() => setActivePlayer({ type: "primary" })}
            className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${
              activePlayer.type === "primary"
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            Player Principal
          </button>
        )}

        {channel.sources?.map((source) => (
          <button
            key={source.id}
            onClick={() =>
              setActivePlayer({ type: "source", sourceId: source.id })
            }
            className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${
              activePlayer.type === "source" &&
              activePlayer.sourceId === source.id
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {source.title}
          </button>
        ))}

        {channel.embedUrl && (
          <button
            onClick={() => setActivePlayer({ type: "embed" })}
            className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${
              activePlayer.type === "embed"
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            Player Alternativo
          </button>
        )}
      </div>
    </div>
  );
}
