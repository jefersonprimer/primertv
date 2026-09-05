"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { ChevronDown, Play, Check } from "lucide-react";

export interface PlayerOption {
  id: string;
  label: string;
  href: string;
}

interface PlayerDropdownProps {
  players: PlayerOption[];
  activePlayerId: string;
}

export function PlayerDropdown({
  players,
  activePlayerId,
}: PlayerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activePlayer =
    players.find((p) => p.id === activePlayerId) || players[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!players || players.length === 0) return null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center justify-between gap-x-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-100 shadow-sm border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-700"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="flex items-center gap-2">
          <Play className="h-4 w-4 text-zinc-300 fill-zinc-300/20" />
          <span>{activePlayer?.label || "Select Player"}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 z-50 mt-2 w-56 origin-top-left rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl py-1.5 ring-1 ring-black/10 focus:outline-none backdrop-blur-md"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80 mb-1">
            Players
          </div>
          <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
            {players.map((p) => {
              const isActive = p.id === activePlayer?.id;
              return (
                <Link
                  key={p.id}
                  href={p.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2 text-sm transition-colors rounded-md mx-1 my-0.5 ${
                    isActive
                      ? "bg-zinc-800 text-white font-semibold"
                      : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
                  }`}
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    <Play
                      className={`h-3.5 w-3.5 ${
                        isActive ? "text-white fill-white" : "text-zinc-500"
                      }`}
                    />
                    {p.label}
                  </span>
                  {isActive && <Check className="h-4 w-4 text-white" />}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
