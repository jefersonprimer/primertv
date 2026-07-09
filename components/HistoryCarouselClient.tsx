"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { HistoryCard, type HistoryItem } from "./HistoryCard";
import { ChevronRight } from "lucide-react";

interface HistoryCarouselClientProps {
  items: HistoryItem[];
}

export function HistoryCarouselClient({ items }: HistoryCarouselClientProps) {
  const t = useTranslations("History");

  if (items.length === 0) return null;

  const displayItems = items.slice(0, 4);

  return (
    <section className="relative">
      <div
        className="mb-3 sm:mb-4 flex items-center justify-between w-full"
        style={{
          paddingLeft: "max(8px, (100vw - 1240px) / 2)",
          paddingRight: "max(8px, (100vw - 1240px) / 2)",
        }}
      >
        <h2 className="text-[22px] md:text-[28px] font-bold text-[#f2f2f2]">
          {t("continueWatching")}
        </h2>
        <Link
          href="/history"
          className="flex items-center gap-1.5 text-sm font-bold text-[#bbb] hover:text-white hover:underline uppercase"
        >
          <span>{t("viewHistory")}</span>
          <ChevronRight size={20} />
        </Link>
      </div>

      {/* Desktop/Tablet Grid: 2 columns on sm, 3 on md, 4 on lg */}
      <div
        className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        style={{
          paddingLeft: "max(8px, (100vw - 1252px) / 2)",
          paddingRight: "max(8px, (100vw - 1252px) / 2)",
        }}
      >
        {displayItems.map((item) => (
          <HistoryCard key={item.id} item={item} />
        ))}
      </div>

      {/* Mobile Vertical Column (max 4 items) - As it was originally */}
      <div
        className="flex sm:hidden flex-col"
        style={{
          paddingLeft: "max(0px, (100vw - 1223px) / 2)",
          paddingRight: "max(10px, (100vw - 1223px) / 2)",
        }}
      >
        {displayItems.map((item) => (
          <HistoryCard
            key={item.id}
            item={item}
            isMobileRow
            className="w-full"
          />
        ))}
      </div>
    </section>
  );
}
