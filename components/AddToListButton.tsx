"use client";

import { useTranslations } from "next-intl";
import { useState, useCallback, useRef, useEffect } from "react";
import { X, Plus, Check, Loader2, ListPlus, FolderPlus, ArrowLeft } from "lucide-react";
import {
  createList,
  toggleAnimeInList,
  getUserListsWithAnimeState,
} from "@/app/actions/lists";
import { Link } from "@/i18n/routing";

interface ListSelectorProps {
  animeId?: string;
  seriesId?: string;
  isLoggedIn: boolean;
  compact?: boolean;
  hasBorder?: boolean;
  roundedFull?: boolean;
  mobileVertical?: boolean;
  size?: number;
  className?: string;
}

interface UserList {
  id: string;
  name: string;
  description: string | null;
  isChecked: boolean;
}

export default function AddToListButton({
  animeId,
  seriesId,
  isLoggedIn,
  compact = false,
  hasBorder = true,
  roundedFull = true,
  mobileVertical = false,
  size,
  className = "",
}: ListSelectorProps) {
  const t = useTranslations("Lists");
  const [isOpen, setIsOpen] = useState(false);
  const [lists, setLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(false);

  // Sub-view toggle state for list creation
  const [showCreateSubModal, setShowCreateSubModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const iconSize = size ?? (compact ? 14 : 16);
  const sizeClass = compact ? "p-1.5" : "p-2";
  const borderClass = hasBorder ? "border border-zinc-800" : "";
  const roundedClass = roundedFull ? "rounded-full" : "rounded-md";

  const buttonClass = `group relative inline-flex items-center justify-center ${
    mobileVertical
      ? "flex-col md:flex-row gap-1 md:gap-2 text-xs md:text-sm p-2"
      : sizeClass
  } ${roundedClass} bg-zinc-900/90 ${borderClass} shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-zinc-800 hover:border-zinc-700 hover:shadow-white/5 active:scale-95 focus:outline-none text-white cursor-pointer ${className}`;

  const tooltipElement = (
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-2 text-xs font-normal text-white bg-[#272727] shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out whitespace-nowrap z-50">
      {t("tooltip")}
    </span>
  );

  const loadLists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserListsWithAnimeState(animeId, seriesId);
      setLists(data);
    } catch (err) {
      console.error(err);
      setError(t("errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [animeId, seriesId, t]);

  const handleToggle = async (listId: string) => {
    setError(null);
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId ? { ...l, isChecked: !l.isChecked } : l,
      ),
    );

    try {
      const res = await toggleAnimeInList(listId, animeId, seriesId);
      if (!res.success) {
        setLists((prev) =>
          prev.map((l) =>
            l.id === listId ? { ...l, isChecked: !l.isChecked } : l,
          ),
        );
        setError(res.error || t("errorUpdate"));
      }
    } catch (err) {
      console.error(err);
      setLists((prev) =>
        prev.map((l) =>
          l.id === listId ? { ...l, isChecked: !l.isChecked } : l,
        ),
      );
      setError(t("errorUpdate"));
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    setIsCreating(true);
    setError(null);

    try {
      const res = await createList(newListName, newListDesc);
      if (res.success && res.list) {
        setNewListName("");
        setNewListDesc("");
        setShowCreateSubModal(false);
        await loadLists();
      } else {
        setError(res.error || t("errorCreate"));
      }
    } catch (err) {
      console.error(err);
      setError(t("errorCreate"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setShowCreateSubModal(false);
    void loadLists();
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowCreateSubModal(false);
    setError(null);
  };

  useEffect(() => {
    if (showCreateSubModal) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showCreateSubModal]);

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className={buttonClass}
        aria-label="Adicionar a uma lista personalizada"
        title={t("tooltip")}
      >
        <Plus
          size={iconSize}
          className="text-white transition-transform duration-200 group-hover:scale-110"
        />
        {mobileVertical && (
          <span className="text-xs md:hidden font-medium">{t("title")}</span>
        )}
        {tooltipElement}
      </Link>
    );
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className={buttonClass}
        aria-label="Adicionar a uma lista personalizada"
      >
        <Plus
          size={iconSize}
          className="text-white transition-transform duration-200 group-hover:scale-110"
        />
        {mobileVertical && (
          <span className="text-xs md:hidden font-medium">{t("title")}</span>
        )}
        {tooltipElement}
      </button>

      {/* Main Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative rounded-2xl w-full max-w-[95vw] sm:w-[720px] h-[495px] max-h-[90vh] overflow-hidden bg-zinc-950/95 border border-zinc-800/90 text-zinc-100 shadow-2xl shadow-black/80 flex flex-col transition-all">
            
            {/* Modal Top Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 bg-zinc-900/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  {showCreateSubModal ? (
                    <FolderPlus className="h-4 w-4" />
                  ) : (
                    <ListPlus className="h-4 w-4" />
                  )}
                </div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  {showCreateSubModal ? t("createList") : t("title")}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Action Bar Sub-Header: Left Action / Back, Right Counter */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/60 bg-zinc-900/30">
              {showCreateSubModal ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateSubModal(false);
                    setError(null);
                  }}
                  className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4 text-blue-400" />
                  <span>Voltar para minhas listas</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={lists.length >= 10}
                  onClick={() => {
                    setError(null);
                    setShowCreateSubModal(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  <span>{t("createList")}</span>
                </button>
              )}

              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-400">
                <span className="text-blue-400 font-bold">{lists.length}</span>
                <span className="text-zinc-600">/</span>
                <span>10</span>
              </div>
            </div>

            {/* Main Canvas Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 relative">
              {error && (
                <div className="rounded-xl bg-red-950/40 border border-red-800/60 p-3 text-xs text-red-200">
                  {error}
                </div>
              )}

              {showCreateSubModal ? (
                /* Native Creation Form view inside the modal canvas */
                <form onSubmit={handleCreateList} className="space-y-4 py-2 max-w-lg mx-auto animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-zinc-200">Detalhes da nova lista</h3>
                    <p className="text-xs text-zinc-500">Informe um nome e descrição para identificar sua lista.</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Nome da lista
                      </label>
                      <input
                        ref={nameInputRef}
                        type="text"
                        placeholder={t("listNamePlaceholder")}
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        maxLength={50}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Descrição (opcional)
                      </label>
                      <input
                        type="text"
                        placeholder={t("descriptionPlaceholder")}
                        value={newListDesc}
                        onChange={(e) => setNewListDesc(e.target.value)}
                        maxLength={150}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/60">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateSubModal(false);
                        setError(null);
                      }}
                      className="px-5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating || !newListName.trim()}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white transition-all shadow-md shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                    >
                      {isCreating && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      {t("createList")}
                    </button>
                  </div>
                </form>
              ) : loading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : lists.length === 0 ? (
                <div className="text-center py-12 px-4 text-zinc-400 text-sm flex flex-col items-center justify-center gap-2">
                  <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-1">
                    <FolderPlus className="h-8 w-8" />
                  </div>
                  <p className="font-semibold text-zinc-200 text-sm">{t("noLists")}</p>
                  <p className="text-xs text-zinc-500 max-w-[280px] leading-relaxed">
                    {t("emptySubtitle")}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setShowCreateSubModal(true);
                    }}
                    className="mt-3 flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer shadow-md shadow-blue-600/20"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t("createList")}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {lists.map((list) => (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => handleToggle(list.id)}
                      className={`group relative flex rounded-xl w-full items-center justify-between border p-3.5 transition-all text-left cursor-pointer ${
                        list.isChecked
                          ? "border-blue-500/60 bg-blue-950/20 hover:bg-blue-950/30"
                          : "border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-zinc-700/80"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={`p-2 rounded-lg transition-colors shrink-0 ${
                            list.isChecked
                              ? "bg-blue-600/20 text-blue-400"
                              : "bg-zinc-800/70 text-zinc-400 group-hover:text-zinc-200"
                          }`}
                        >
                          <ListPlus className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-zinc-100 group-hover:text-white transition-colors truncate">
                            {list.name}
                          </p>
                          {list.description && (
                            <p className="text-xs text-zinc-500 truncate mt-0.5">
                              {list.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-lg border transition-all shrink-0 ${
                          list.isChecked
                            ? "border-blue-500 bg-blue-600 text-white shadow-sm shadow-blue-500/30 scale-105"
                            : "border-zinc-700 bg-zinc-900 group-hover:border-zinc-500"
                        }`}
                      >
                        {list.isChecked && (
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer limits */}
            <div className="px-6 py-3 text-[11px] text-zinc-500 flex justify-between items-center bg-zinc-950 border-t border-zinc-800/60 font-medium mt-auto">
              <span>{t("limitLabel")}</span>
              <span>{t("maxItemsLabel")}</span>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
