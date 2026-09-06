"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";

export function ProfileTabs() {
  const pathname = usePathname();
  const t = useTranslations("UserMenu");

  const tabs = [
    {
      id: "watchlist",
      href: "/watchlist",
      label: t("watchlist"),
    },
    {
      id: "lists",
      href: "/lists",
      label: t("myLists"),
    },
    {
      id: "history",
      href: "/history",
      label: t("history"),
    },
  ];

  return (
    <div className="mb-8 border-b border-zinc-800/80 pb-px">
      <div className="flex space-x-6 overflow-x-auto scrollbar-none px-2 md:px-0">
        {tabs.map((tab) => {
          // Match exactly or check if it's a sub-route (e.g. /lists/[id])
          const isActive =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`relative flex items-center uppercase gap-2 pb-4 pt-2 text-sm font-semibold transition-all duration-300 outline-none hover:text-white group shrink-0 ${
                isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span
                className={`isActive
                    ? "text-blue-400"
                    : "text-zinc-500 group-hover:text-zinc-400"
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] rounded-full animate-fade-in" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
