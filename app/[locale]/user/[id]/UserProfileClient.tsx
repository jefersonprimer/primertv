"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User as UserIcon,
  Calendar,
  Bookmark,
  History,
  List as ListIcon,
  Star,
  Edit,
  Shield,
  Film,
  AtSign,
  Share2,
  Copy,
  Check,
  Play,
  Clock,
  Sparkles,
  Flame,
  Tv,
  BookOpen,
  Award,
  Layers,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export interface WatchlistItemData {
  id: string;
  createdAt: Date | string;
  mediaType: "ANIME" | "SERIES" | "MANGA";
  anime?: {
    id: string;
    slug: string;
    title: string;
    imageUrl: string | null;
    score: number | null;
    latestEpisodeNumber: number | null;
    genres: string[];
  } | null;
  series?: {
    id: string;
    slug: string;
    title: string;
    imageUrl: string | null;
    score: number | null;
  } | null;
  manga?: {
    id: string;
    slug: string;
    title: string;
    imageUrl: string | null;
  } | null;
}

export interface WatchHistoryData {
  id: string;
  watchedAt: Date | string;
  episode?: {
    id: string;
    number: number;
    title: string | null;
    imageUrl: string | null;
    season: {
      number: number;
      anime: {
        id: string;
        slug: string;
        title: string;
        imageUrl: string | null;
        genres?: string[];
      };
    };
  } | null;
}

export interface CustomListData {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date | string;
  _count: {
    items: number;
  };
}

export interface AnimeRatingData {
  id: string;
  score: number;
  updatedAt: Date | string;
  anime: {
    id: string;
    slug: string;
    title: string;
    imageUrl: string | null;
  };
}

export interface UserProfileClientProps {
  locale: string;
  targetUser: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
    imageBackground: string | null;
    createdAt: Date | string;
    watchlistItems: WatchlistItemData[];
    watchHistory: WatchHistoryData[];
    customLists: CustomListData[];
    animeRatings: AnimeRatingData[];
    _count: {
      watchlistItems: number;
      watchHistory: number;
      customLists: number;
      animeRatings: number;
    };
  };
  activeUsername: string;
  isOwner: boolean;
  isAdmin: boolean;
  memberSince: string;
}

export function UserProfileClient({
  locale,
  targetUser,
  activeUsername,
  isOwner,
  isAdmin,
  memberSince,
}: UserProfileClientProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "watchlist" | "history" | "lists" | "ratings">("overview");
  const [watchlistFilter, setWatchlistFilter] = useState<"ALL" | "ANIME" | "SERIES" | "MANGA">("ALL");
  const [copied, setCopied] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);

  // Gamification & Calculations
  const epCount = targetUser._count.watchHistory;
  const watchlistCount = targetUser._count.watchlistItems;
  const ratingCount = targetUser._count.animeRatings;
  const listsCount = targetUser._count.customLists;

  // Total watch time estimation (average 24 mins per episode)
  const totalWatchMinutes = epCount * 24;
  const watchHours = Math.floor(totalWatchMinutes / 60);
  const remainingMins = totalWatchMinutes % 60;

  // Level & XP Formula
  const xp = epCount * 12 + watchlistCount * 5 + ratingCount * 15 + listsCount * 20;
  const level = Math.floor(Math.sqrt(xp / 40)) + 1;
  const currentLevelBaseXP = (level - 1) * (level - 1) * 40;
  const nextLevelXP = level * level * 40;
  const xpInCurrentLevel = xp - currentLevelBaseXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelBaseXP;
  const levelProgress = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)));

  // Title by level
  const getLevelTitle = (lvl: number) => {
    if (lvl >= 20) return "Lenda Suprema";
    if (lvl >= 15) return "Mestre Otaku";
    if (lvl >= 10) return "Maratonista de Elite";
    if (lvl >= 5) return "Entusiasta de Anime";
    return "Iniciante Primer";
  };

  // Genre breakdown calculation
  const genreCounts: Record<string, number> = {};
  targetUser.watchlistItems.forEach((item) => {
    if (item.anime?.genres) {
      item.anime.genres.forEach((g) => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    }
  });

  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalGenreHits = topGenres.reduce((acc, curr) => acc + curr[1], 0) || 1;

  // Media type counts
  const animeWatchlistCount = targetUser.watchlistItems.filter((i) => i.mediaType === "ANIME").length;
  const seriesWatchlistCount = targetUser.watchlistItems.filter((i) => i.mediaType === "SERIES").length;
  const mangaWatchlistCount = targetUser.watchlistItems.filter((i) => i.mediaType === "MANGA").length;

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyUsername = () => {
    navigator.clipboard.writeText(`@${activeUsername}`);
    setCopiedUsername(true);
    setTimeout(() => setCopiedUsername(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de ${targetUser.name} no PrimerTv`,
          text: `Confira o perfil, animes e watchlist de ${targetUser.name} no PrimerTv!`,
          url: window.location.href,
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // Filter watchlist items
  const filteredWatchlist = targetUser.watchlistItems.filter((item) => {
    if (watchlistFilter === "ALL") return true;
    return item.mediaType === watchlistFilter;
  });

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 pb-20 selection:bg-blue-600 selection:text-white">
      {/* Background Decorative Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-60 -right-20 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Hero Banner Header */}
      <div className="relative h-56 sm:h-72 md:h-80 w-full overflow-hidden border-b border-white/10 z-10">
        {targetUser.imageBackground ? (
          <img
            src={targetUser.imageBackground}
            alt={`Capa de ${targetUser.name}`}
            className="h-full w-full object-cover object-center transform scale-105 filter brightness-90"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-blue-950 via-slate-900 to-purple-950 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-purple-600/20" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/40 to-transparent" />
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-24 sm:-mt-28">
        {/* User Card Header */}
        <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-6">
            
            {/* Left side: Avatar + User details */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left w-full lg:w-auto">
              
              {/* Avatar with dynamic level ring */}
              <div className="relative group shrink-0">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-500 group-hover:scale-105" />
                <div className="relative h-32 w-32 sm:h-36 sm:w-36 rounded-2xl bg-zinc-950 border-2 border-white/20 overflow-hidden shadow-2xl flex items-center justify-center text-zinc-300 font-bold text-4xl">
                  {targetUser.image ? (
                    <img
                      src={targetUser.image}
                      alt={targetUser.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl font-black bg-gradient-to-br from-blue-400 to-purple-500 bg-clip-text text-transparent">
                      {targetUser.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {/* Level Badge Pill */}
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-extrabold text-[11px] shadow-lg border border-white/20 flex items-center gap-1 whitespace-nowrap">
                  <Sparkles className="h-3 w-3 text-amber-300 fill-amber-300" />
                  Nível {level}
                </div>
              </div>

              {/* User Metadata */}
              <div className="space-y-2 mt-2 sm:mt-0 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                    {targetUser.name}
                  </h1>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                      <Shield className="h-3.5 w-3.5" /> Administrador
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    <Award className="h-3.5 w-3.5" /> {getLevelTitle(level)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm text-zinc-400 font-medium">
                  <button
                    onClick={handleCopyUsername}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-blue-400 border border-blue-500/20 transition-colors group cursor-pointer"
                    title="Clique para copiar username"
                  >
                    <AtSign className="h-3.5 w-3.5" />
                    <span>{activeUsername}</span>
                    {copiedUsername ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-zinc-500 group-hover:text-zinc-300" />
                    )}
                  </button>

                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <Calendar className="h-4 w-4 text-zinc-500" />
                    Membro desde {memberSince}
                  </span>
                </div>

                {/* Level Progress Bar inside header */}
                <div className="pt-2 max-w-md w-full">
                  <div className="flex justify-between items-center text-xs font-semibold mb-1">
                    <span className="text-zinc-400 flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5 text-amber-400" /> Progresso de XP
                    </span>
                    <span className="text-zinc-300">
                      {xp} <span className="text-zinc-500">/ {nextLevelXP} XP</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-zinc-800/80 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      style={{ width: `${levelProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-zinc-800">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700/90 border border-zinc-700/70 text-xs sm:text-sm font-semibold text-zinc-200 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Share2 className="h-4 w-4 text-blue-400" />
                Compartilhar
              </button>

              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700/90 border border-zinc-700/70 text-xs sm:text-sm font-semibold text-zinc-200 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-purple-400" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>

              {isOwner && (
                <Link
                  href={`/${locale}/profile`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Edit className="h-4 w-4" />
                  Editar Perfil
                </Link>
              )}
            </div>

          </div>
        </div>

        {/* Quick Statistics Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 my-8">
          {/* Stat Card 1: Watch Time */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover:border-blue-500/40 transition-all group">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-black text-white tracking-tight">
                {watchHours}h <span className="text-sm font-semibold text-zinc-400">{remainingMins}m</span>
              </p>
              <p className="text-xs text-zinc-400 font-medium">Tempo Assistido Est.</p>
            </div>
          </div>

          {/* Stat Card 2: Episodes Watched */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover:border-purple-500/40 transition-all group">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
              <History className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-black text-white tracking-tight">
                {epCount}
              </p>
              <p className="text-xs text-zinc-400 font-medium">Episódios Vistos</p>
            </div>
          </div>

          {/* Stat Card 3: Watchlist Items */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover:border-amber-500/40 transition-all group">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
              <Bookmark className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-black text-white tracking-tight">
                {watchlistCount}
              </p>
              <p className="text-xs text-zinc-400 font-medium">Na Watchlist</p>
            </div>
          </div>

          {/* Stat Card 4: Ratings */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover:border-emerald-500/40 transition-all group">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-black text-white tracking-tight">
                {ratingCount}
              </p>
              <p className="text-xs text-zinc-400 font-medium">Avaliações Feitas</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-2 border-b border-zinc-800 overflow-x-auto no-scrollbar pb-px mb-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "overview"
                ? "bg-zinc-800/80 text-blue-400 border-b-2 border-blue-500"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Visão Geral
          </button>

          <button
            onClick={() => setActiveTab("watchlist")}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "watchlist"
                ? "bg-zinc-800/80 text-blue-400 border-b-2 border-blue-500"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
            }`}
          >
            <Bookmark className="h-4 w-4" />
            Watchlist
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-300 font-semibold border border-white/5">
              {watchlistCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "history"
                ? "bg-zinc-800/80 text-purple-400 border-b-2 border-purple-500"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
            }`}
          >
            <History className="h-4 w-4" />
            Histórico
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-300 font-semibold border border-white/5">
              {epCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("lists")}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "lists"
                ? "bg-zinc-800/80 text-amber-400 border-b-2 border-amber-500"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
            }`}
          >
            <ListIcon className="h-4 w-4" />
            Listas
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-300 font-semibold border border-white/5">
              {listsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ratings")}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "ratings"
                ? "bg-zinc-800/80 text-emerald-400 border-b-2 border-emerald-500"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
            }`}
          >
            <Star className="h-4 w-4" />
            Avaliações
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-300 font-semibold border border-white/5">
              {ratingCount}
            </span>
          </button>
        </div>

        {/* TAB CONTENT AREAS */}
        
        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === "overview" && (
          <div className="space-y-10">
            {/* Grid 2 Columns: Left Stats & Genres | Right Media Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Top Genres */}
              <div className="lg:col-span-2 bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                    Gêneros Mais Favoritados
                  </h3>
                  <span className="text-xs text-zinc-400">baseado na watchlist</span>
                </div>

                {topGenres.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">Sem gêneros suficientes registrados.</p>
                ) : (
                  <div className="space-y-3 pt-2">
                    {topGenres.map(([genre, count], idx) => {
                      const percent = Math.round((count / totalGenreHits) * 100);
                      const colors = [
                        "from-blue-500 to-cyan-400",
                        "from-purple-500 to-indigo-400",
                        "from-pink-500 to-rose-400",
                        "from-amber-500 to-yellow-400",
                        "from-emerald-500 to-teal-400",
                      ];
                      return (
                        <div key={genre} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-zinc-200">{genre}</span>
                            <span className="text-zinc-400">{count} {count === 1 ? "título" : "títulos"} ({percent}%)</span>
                          </div>
                          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${colors[idx % colors.length]} rounded-full`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Col: Media Distribution */}
              <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-purple-400" />
                  Distribuição da Coleção
                </h3>

                <div className="space-y-4">
                  {/* Anime Bar */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/40 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <Tv className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Animes</p>
                        <p className="text-[11px] text-zinc-400">{animeWatchlistCount} salvos</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-blue-400">
                      {watchlistCount > 0 ? Math.round((animeWatchlistCount / watchlistCount) * 100) : 0}%
                    </span>
                  </div>

                  {/* Series Bar */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/40 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                        <Film className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Séries</p>
                        <p className="text-[11px] text-zinc-400">{seriesWatchlistCount} salvas</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-purple-400">
                      {watchlistCount > 0 ? Math.round((seriesWatchlistCount / watchlistCount) * 100) : 0}%
                    </span>
                  </div>

                  {/* Manga Bar */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/40 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Mangás</p>
                        <p className="text-[11px] text-zinc-400">{mangaWatchlistCount} salvos</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-amber-400">
                      {watchlistCount > 0 ? Math.round((mangaWatchlistCount / watchlistCount) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Watchlist Highlights */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-blue-400" /> Watchlist em Destaque
                </h2>
                {targetUser.watchlistItems.length > 0 && (
                  <button
                    onClick={() => setActiveTab("watchlist")}
                    className="text-xs text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Ver todos ({watchlistCount}) <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {targetUser.watchlistItems.length === 0 ? (
                <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-8 text-center space-y-3">
                  <Bookmark className="h-10 w-10 text-zinc-600 mx-auto" />
                  <p className="text-sm font-semibold text-zinc-400">
                    {targetUser.name} ainda não adicionou itens à watchlist.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {targetUser.watchlistItems.slice(0, 6).map((item) => {
                    const media = item.anime || item.series || item.manga;
                    if (!media) return null;
                    const typeLabel = item.anime ? "Anime" : item.series ? "Série" : "Mangá";
                    const href = item.anime
                      ? `/${locale}/animes/${media.slug}`
                      : item.series
                      ? `/${locale}/series/${media.slug}`
                      : `/${locale}/mangas/${media.slug}`;

                    return (
                      <Link
                        key={item.id}
                        href={href}
                        className="group relative flex flex-col bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all hover:-translate-y-1 shadow-lg"
                      >
                        <div className="aspect-[3/4] w-full bg-zinc-950 relative overflow-hidden">
                          {media.imageUrl ? (
                            <img
                              src={media.imageUrl}
                              alt={media.title}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-zinc-600">
                              <Film className="h-8 w-8" />
                            </div>
                          )}
                          <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-black/80 backdrop-blur-md text-white border border-white/10">
                            {typeLabel}
                          </span>
                        </div>
                        <div className="p-3">
                          <h3 className="text-xs font-bold text-zinc-100 line-clamp-1 group-hover:text-blue-400 transition-colors">
                            {media.title}
                          </h3>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Recent History Feed */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-purple-400" /> Visto Recentemente
                </h2>
                {targetUser.watchHistory.length > 0 && (
                  <button
                    onClick={() => setActiveTab("history")}
                    className="text-xs text-purple-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Ver histórico completo ({epCount}) <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {targetUser.watchHistory.length === 0 ? (
                <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-8 text-center space-y-3">
                  <History className="h-10 w-10 text-zinc-600 mx-auto" />
                  <p className="text-sm font-semibold text-zinc-400">
                    Nenhum histórico recente de episódios registrados.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {targetUser.watchHistory.slice(0, 6).map((h) => {
                    const ep = h.episode;
                    const anime = ep?.season?.anime;
                    if (!ep || !anime) return null;

                    return (
                      <Link
                        key={h.id}
                        href={`/${locale}/watch/${ep.id}/${anime.slug}`}
                        className="group flex items-center gap-3.5 bg-zinc-900/60 border border-white/10 hover:border-purple-500/40 rounded-2xl p-3 transition-all hover:bg-zinc-800/60 shadow-md"
                      >
                        <div className="h-16 w-24 rounded-xl bg-zinc-950 overflow-hidden relative shrink-0">
                          <img
                            src={ep.imageUrl || anime.imageUrl || ""}
                            alt={anime.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="h-6 w-6 text-white fill-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-zinc-100 line-clamp-1 group-hover:text-purple-400 transition-colors">
                            {anime.title}
                          </h4>
                          <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                            T{ep.season.number} : EP {ep.number} {ep.title ? `- ${ep.title}` : ""}
                          </p>
                          <p className="text-[10px] text-zinc-500 mt-1">
                            {new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(new Date(h.watchedAt))}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ================= TAB 2: WATCHLIST ================= */}
        {activeTab === "watchlist" && (
          <div className="space-y-6">
            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWatchlistFilter("ALL")}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  watchlistFilter === "ALL"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Todos ({targetUser.watchlistItems.length})
              </button>
              <button
                onClick={() => setWatchlistFilter("ANIME")}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  watchlistFilter === "ANIME"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Animes ({animeWatchlistCount})
              </button>
              <button
                onClick={() => setWatchlistFilter("SERIES")}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  watchlistFilter === "SERIES"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Séries ({seriesWatchlistCount})
              </button>
              <button
                onClick={() => setWatchlistFilter("MANGA")}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  watchlistFilter === "MANGA"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Mangás ({mangaWatchlistCount})
              </button>
            </div>

            {filteredWatchlist.length === 0 ? (
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-12 text-center space-y-3">
                <Bookmark className="h-12 w-12 text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-zinc-400">
                  Nenhum item nesta categoria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredWatchlist.map((item) => {
                  const media = item.anime || item.series || item.manga;
                  if (!media) return null;
                  const typeLabel = item.anime ? "Anime" : item.series ? "Série" : "Mangá";
                  const href = item.anime
                    ? `/${locale}/animes/${media.slug}`
                    : item.series
                    ? `/${locale}/series/${media.slug}`
                    : `/${locale}/mangas/${media.slug}`;

                  return (
                    <Link
                      key={item.id}
                      href={href}
                      className="group relative flex flex-col bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all hover:-translate-y-1.5 shadow-lg"
                    >
                      <div className="aspect-[3/4] w-full bg-zinc-950 relative overflow-hidden">
                        {media.imageUrl ? (
                          <img
                            src={media.imageUrl}
                            alt={media.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-zinc-600">
                            <Film className="h-8 w-8" />
                          </div>
                        )}
                        <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-black/80 backdrop-blur-md text-white border border-white/10">
                          {typeLabel}
                        </span>
                      </div>
                      <div className="p-3">
                        <h3 className="text-xs font-bold text-zinc-100 line-clamp-1 group-hover:text-blue-400 transition-colors">
                          {media.title}
                        </h3>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: HISTORY ================= */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {targetUser.watchHistory.length === 0 ? (
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-12 text-center space-y-3">
                <History className="h-12 w-12 text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-zinc-400">
                  Nenhum histórico registrado.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {targetUser.watchHistory.map((h) => {
                  const ep = h.episode;
                  const anime = ep?.season?.anime;
                  if (!ep || !anime) return null;

                  return (
                    <Link
                      key={h.id}
                      href={`/${locale}/watch/${ep.id}/${anime.slug}`}
                      className="group flex items-center gap-4 bg-zinc-900/60 border border-white/10 hover:border-purple-500/40 rounded-2xl p-3.5 transition-all hover:bg-zinc-800/60 shadow-md"
                    >
                      <div className="h-20 w-32 rounded-xl bg-zinc-950 overflow-hidden relative shrink-0">
                        <img
                          src={ep.imageUrl || anime.imageUrl || ""}
                          alt={anime.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="h-7 w-7 text-white fill-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-zinc-100 line-clamp-1 group-hover:text-purple-400 transition-colors">
                          {anime.title}
                        </h4>
                        <p className="text-[11px] text-zinc-300 font-semibold mt-1">
                          Temporada {ep.season.number} • EP {ep.number}
                        </p>
                        {ep.title && (
                          <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                            {ep.title}
                          </p>
                        )}
                        <p className="text-[10px] text-zinc-500 mt-1.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(h.watchedAt))}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: CUSTOM LISTS ================= */}
        {activeTab === "lists" && (
          <div className="space-y-4">
            {targetUser.customLists.length === 0 ? (
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-12 text-center space-y-3">
                <ListIcon className="h-12 w-12 text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-zinc-400">
                  Nenhuma lista personalizada criada ainda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {targetUser.customLists.map((list) => (
                  <div
                    key={list.id}
                    className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 space-y-3 flex flex-col justify-between hover:border-amber-500/40 transition-all shadow-md"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                          <ListIcon className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-bold text-white line-clamp-1">{list.name}</h3>
                      </div>
                      {list.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 mt-2">
                          {list.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-xs text-zinc-400">
                      <span className="font-semibold text-amber-400">{list._count.items} itens</span>
                      <span className="text-[11px] text-zinc-500">
                        {new Date(list.createdAt).toLocaleDateString(locale)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: RATINGS ================= */}
        {activeTab === "ratings" && (
          <div className="space-y-4">
            {targetUser.animeRatings.length === 0 ? (
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-12 text-center space-y-3">
                <Star className="h-12 w-12 text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-zinc-400">
                  Nenhuma avaliação registrada até o momento.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {targetUser.animeRatings.map((rating) => (
                  <Link
                    key={rating.id}
                    href={`/${locale}/animes/${rating.anime.slug}`}
                    className="group flex items-center gap-3.5 bg-zinc-900/60 border border-white/10 hover:border-emerald-500/40 rounded-2xl p-3 transition-all hover:bg-zinc-800/60 shadow-md"
                  >
                    <div className="h-16 w-12 rounded-xl bg-zinc-950 overflow-hidden shrink-0">
                      {rating.anime.imageUrl && (
                        <img
                          src={rating.anime.imageUrl}
                          alt={rating.anime.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-zinc-100 line-clamp-1 group-hover:text-emerald-400 transition-colors">
                        {rating.anime.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-amber-400 font-extrabold mt-1">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span>{rating.score} / 10</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
