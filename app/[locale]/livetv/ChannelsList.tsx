"use client";

import { useState } from "react";
import Link from "next/link";
import { Tv, Play } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("LiveTV");
  const [search, setSearch] = useState("");

  const filteredChannels = initialChannels.filter((channel) =>
    channel.title.toLowerCase().includes(search.toLowerCase().trim()),
  );

  return (
    <div className="space-y-8">
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={t("searchPlaceholder")}
        showRecent={false}
      />

      <div className="mx-auto max-w-[1223px] px-4 space-y-8">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">
            {search ? t("searchResults") : t("allChannels")}
          </h2>
          <span className="rounded-full bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-500 dark:text-blue-400 transition-all duration-300">
            {filteredChannels.length}{" "}
            {filteredChannels.length === 1 ? t("channel") : t("channels")}
          </span>
        </div>

        {filteredChannels.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-center p-6 transition-all duration-300 animate-fade-in">
            <Tv className="h-12 w-12 text-zinc-400 mb-3" />
            <p className="text-zinc-500 font-medium">
              {t("noChannels")}
            </p>
            <p className="text-zinc-400 text-sm mt-1">
              {t("tryDifferentTerms")}
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
