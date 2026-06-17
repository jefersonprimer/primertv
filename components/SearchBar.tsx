"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="flex justify-center w-full">
      <form onSubmit={handleSearch} className="relative w-full max-w-[880px]">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar animes, séries, filmes, mangás ou novelas..."
          className="w-full border-b border-zinc-200 bg-transparent py-4 pl-12 text-xl text-zinc-900 outline-none transition-all focus:border-blue-500 dark:border-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500"
        />
        <svg
          className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </form>
    </div>
  );
}
