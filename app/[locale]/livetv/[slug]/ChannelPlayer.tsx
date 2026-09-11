"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Tv,
  Play,
  Radio,
  MonitorPlay,
  Search,
  X,
  ChevronRight,
  Info,
} from "lucide-react";
import ShareButton from "@/components/ShareButton";
import { EditMediaButton } from "@/components/admin/EditMediaButton";
import { DeleteChannelButton } from "@/components/admin/DeleteChannelButton";

interface Channel {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  embedUrl?: string | null;
  position?: number;
  sources?: {
    id: string;
    title: string;
    url: string;
  }[];
}

interface SidebarChannel {
  id: string;
  slug: string;
  title: string;
  imageUrl?: string | null;
  position?: number;
}

interface ChannelPlayerProps {
  channel: Channel;
  allChannels?: SidebarChannel[];
  isAdmin?: boolean;
}

export function ChannelPlayer({
  channel,
  allChannels = [],
  isAdmin = false,
}: ChannelPlayerProps) {
  const [search, setSearch] = useState("");
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

  const filteredChannels = allChannels.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase().trim()),
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
      {/* Coluna Principal: Header, Player e Informações */}
      <div className="space-y-4">
        {/* Video Player */}
        <div className="group relative aspect-video overflow-hidden rounded-none md:rounded-2xl bg-black shadow-2xl border-0 md:border md:border-zinc-800">
          {currentUrl ? (
            isDirectVideo ? (
              <video
                src={currentUrl}
                controls
                autoPlay
                className="h-full w-full object-contain"
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
              <p className="text-sm font-medium">
                Conectando ao sinal do canal...
              </p>
            </div>
          )}
        </div>

        {/* Header do Canal */}
        <div className="mx-4 md:mx-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 text-blue-500 shadow-sm">
              {channel.imageUrl ? (
                <Image
                  src={channel.imageUrl}
                  alt={channel.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <Tv className="h-6 w-6 text-blue-500 dark:text-blue-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                  {channel.title}
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  AO VIVO
                </span>
              </div>
              {channel.description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                  {channel.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:flex-row sm:items-center shrink-0">
            <ShareButton size={18} hasBorder={true} roundedFull={true} />
            {isAdmin && (
              <>
                <EditMediaButton collection="channels" item={channel as unknown as Record<string, unknown>} />
                <DeleteChannelButton
                  channelId={channel.id}
                  channelSlug={channel.slug}
                />
              </>
            )}
          </div>
        </div>

        {/* Seletor de Sinais */}
        <div className="px-4 md:px-0 flex flex-wrap items-center justify-start gap-2.5 pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mr-1 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-blue-500" /> Sinais disponíveis:
          </span>

          {channel.videoUrl && (
            <button
              onClick={() => setActivePlayer({ type: "primary" })}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activePlayer.type === "primary"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-[#161616] text-zinc-300 hover:bg-[#222] border border-[#222]"
              }`}
            >
              <Play className="w-3 h-3 fill-current" /> Sinal Principal
            </button>
          )}

          {channel.sources?.map((source, index) => (
            <button
              key={source.id}
              onClick={() =>
                setActivePlayer({ type: "source", sourceId: source.id })
              }
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activePlayer.type === "source" &&
                activePlayer.sourceId === source.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-[#161616] text-zinc-300 hover:bg-[#222] border border-[#222]"
              }`}
            >
              <Radio className="w-3 h-3" />{" "}
              {source.title || `Opção ${index + 1}`}
            </button>
          ))}

          {channel.embedUrl && (
            <button
              onClick={() => setActivePlayer({ type: "embed" })}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activePlayer.type === "embed"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-[#161616] text-zinc-300 hover:bg-[#222] border border-[#222]"
              }`}
            >
              <MonitorPlay className="w-3 h-3" /> Player Alternativo
            </button>
          )}
        </div>

        {/* Detalhes / Sinopse estendida */}
        {channel.description && (
          <div className="mx-4 md:mx-0 rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-5 space-y-2">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Info size={16} className="text-blue-500" /> Sobre este canal
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
              {channel.description}
            </p>
          </div>
        )}
      </div>

      {/* Sidebar: Lista de Canais */}
      {allChannels.length > 0 && (
        <div className="mx-4 md:mx-0 flex flex-col rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4 shadow-sm max-h-[85vh] lg:sticky lg:top-24">
          <div className="space-y-3 pb-3 border-b border-[#1F1F1F]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Tv className="h-4 w-4 text-blue-500" /> Canais Ao Vivo
              </h2>
              <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-500 dark:text-blue-400">
                {allChannels.length} canais
              </span>
            </div>

            {/* Input de Busca na Sidebar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar canal..."
                className="w-full rounded-xl border border-[#262626] bg-[#161616] pl-9 pr-8 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Lista scrollável de canais */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pt-3 pr-1 min-h-[300px] lg:min-h-0">
            {filteredChannels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-400">
                <Tv className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-xs font-medium">Nenhum canal encontrado</p>
              </div>
            ) : (
              filteredChannels.map((c) => {
                const isActive = c.slug === channel.slug;
                return (
                  <Link
                    key={c.id}
                    href={`/livetv/${c.slug}`}
                    className={`group flex items-center justify-between rounded-xl p-2.5 text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-zinc-300 hover:bg-[#161616] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className={`relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border transition ${
                          isActive
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:text-blue-500"
                        }`}
                      >
                        {c.imageUrl ? (
                          <Image
                            src={c.imageUrl}
                            alt={c.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Tv className="h-4 w-4" />
                        )}
                      </div>
                      <span className="truncate font-semibold text-xs">
                        {c.title}
                      </span>
                    </div>

                    {isActive ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 shrink-0">
                        <Play className="h-2.5 w-2.5 fill-current animate-pulse" />{" "}
                        Assistindo
                      </span>
                    ) : (
                      <ChevronRight className="h-4 w-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
