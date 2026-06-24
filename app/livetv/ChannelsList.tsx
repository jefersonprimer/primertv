"use client";

import { useState } from "react";
import Link from "next/link";
import { Tv, Play, Search, X } from "lucide-react";

interface Channel {
  id: string;
  slug: string;
  title: string;
  position: number;
}

interface ChannelsListProps {
  initialChannels: Channel[];
}

export function ChannelsList({ initialChannels }: ChannelsListProps) {
  const [search, setSearch] = useState("");

  const filteredChannels = initialChannels.filter((channel) =>
    channel.title.toLowerCase().includes(search.toLowerCase().trim()),
  );

  return (
    <div className="space-y-8">
      {/* Search Bar section */}
      <div className="w-full bg-[#151515] py-8">
        <div className="mx-auto max-w-[1223px] px-4">
          <div className="relative w-full max-w-[800px] mx-auto group">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar canais..."
              className="w-full rounded-none border-b-2 border-zinc-200 dark:border-zinc-800 border-x-0 border-t-0 bg-transparent py-3.5 pl-12 pr-12 text-base lg:text-3xl text-zinc-900 dark:text-zinc-100 outline-none transition-all duration-300 focus:border-b-blue-500 focus:ring-0 placeholder-zinc-400 dark:placeholder-zinc-500"
            />
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 group-focus-within:text-blue-500 transition-colors duration-300"
              size={24}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                aria-label="Limpar pesquisa"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1223px] px-4 space-y-8">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">
            {search ? "Resultados da busca" : "Todos os Canais"}
          </h2>
          <span className="rounded-full bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-500 dark:text-blue-400 transition-all duration-300">
            {filteredChannels.length}{" "}
            {filteredChannels.length === 1 ? "Canal" : "Canais"}
          </span>
        </div>

        {filteredChannels.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-center p-6 transition-all duration-300 animate-fade-in">
            <Tv className="h-12 w-12 text-zinc-400 mb-3" />
            <p className="text-zinc-500 font-medium">
              Nenhum canal correspondente encontrado.
            </p>
            <p className="text-zinc-400 text-sm mt-1">
              Tente buscar com termos diferentes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredChannels.map((channel) => (
              <Link
                key={channel.id}
                href={`/livetv/${channel.slug}`}
                className="group flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 shadow-sm transition-all duration-300 hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/5 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                    <Tv className="h-5 w-5" />
                  </div>
                  <h3 className="truncate font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-blue-500 transition-colors duration-300">
                    {channel.title}
                  </h3>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-400 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-all duration-300">
                  <Play className="h-4 w-4 fill-current opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
