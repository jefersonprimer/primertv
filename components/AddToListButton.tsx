"use client";

import { useState, useEffect } from "react";
import { ListPlus, X, Plus, Check, Loader2, Info } from "lucide-react";
import {
  createList,
  toggleAnimeInList,
  getUserListsWithAnimeState,
} from "@/app/actions/lists";

interface ListSelectorProps {
  animeId: string;
  isLoggedIn: boolean;
  compact?: boolean;
}

interface UserList {
  id: string;
  name: string;
  description: string | null;
  isChecked: boolean;
}

export default function AddToListButton({
  animeId,
  isLoggedIn,
  compact = false,
}: ListSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lists, setLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load lists when modal opens
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      loadLists();
    }
  }, [isOpen, isLoggedIn]);

  const loadLists = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserListsWithAnimeState(animeId);
      setLists(data);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar suas listas.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (listId: string) => {
    setError(null);
    // Optimistic UI update
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId ? { ...l, isChecked: !l.isChecked } : l,
      ),
    );

    try {
      const res = await toggleAnimeInList(listId, animeId);
      if (!res.success) {
        // Revert UI update
        setLists((prev) =>
          prev.map((l) =>
            l.id === listId ? { ...l, isChecked: !l.isChecked } : l,
          ),
        );
        setError(res.error || "Erro ao atualizar a lista.");
      }
    } catch (err) {
      console.error(err);
      // Revert UI update
      setLists((prev) =>
        prev.map((l) =>
          l.id === listId ? { ...l, isChecked: !l.isChecked } : l,
        ),
      );
      setError("Erro ao atualizar a lista.");
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
        // Refresh list
        await loadLists();
      } else {
        setError(res.error || "Erro ao criar lista.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao criar lista.");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <a
        href="/login"
        className={
          compact
            ? "flex h-8 w-8 items-center justify-center text-blue-600 hover:text-blue-700 rounded-lg flex-shrink-0 transition-colors"
            : "flex h-10 flex-1 md:flex-initial md:w-fit items-center justify-center gap-2 border-2 border-blue-600 hover:border-blue-700 font-semibold text-blue-600 hover:text-blue-700 transition-colors px-4 py-1.5 md:px-2 md:py-1.5 flex-shrink-0 rounded-lg md:rounded-none md:border-0"
        }
      >
        <ListPlus className={compact ? "h-4 w-4" : "h-6 w-6"} />
        {!compact && (
          <>
            <span className="md:hidden">Minha Lista</span>
            <span className="hidden md:inline">Salvar em Lista</span>
          </>
        )}
      </a>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={
          compact
            ? "flex h-8 w-8 items-center justify-center text-blue-600 hover:text-blue-700 rounded-lg flex-shrink-0 cursor-pointer transition-colors"
            : "flex h-10 flex-1 md:flex-initial md:w-fit items-center justify-center gap-2 border-2 border-blue-600 hover:border-blue-700 font-semibold text-blue-600 hover:text-blue-700 transition-colors px-4 py-1.5 md:px-2 md:py-1.5 flex-shrink-0 cursor-pointer rounded-lg md:rounded-none md:border-0"
        }
        title="Adicionar a uma lista personalizada"
      >
        <Plus className={compact ? "h-6 w-6" : "h-6 w-6"} />
        {!compact && <span className="md:hidden">Minha Lista</span>}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <h2 className="text-lg font-bold text-zinc-50 flex items-center gap-2">
                <ListPlus className="h-5 w-5 text-blue-500" />
                Minhas Listas
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="rounded-lg bg-red-950/55 border border-red-800 p-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              {/* Lists Checklist */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  Escolha uma lista
                </h3>

                {loading ? (
                  <div className="flex justify-center items-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                ) : lists.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 text-sm">
                    Você ainda não tem nenhuma lista personalizada.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {lists.map((list) => (
                      <button
                        key={list.id}
                        type="button"
                        onClick={() => handleToggle(list.id)}
                        className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 hover:bg-zinc-800 hover:border-zinc-700 transition-all text-left group cursor-pointer"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-medium text-sm text-zinc-100 group-hover:text-white transition-colors truncate">
                            {list.name}
                          </p>
                          {list.description && (
                            <p className="text-xs text-zinc-500 truncate mt-0.5">
                              {list.description}
                            </p>
                          )}
                        </div>
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                            list.isChecked
                              ? "border-blue-500 bg-blue-600 text-white"
                              : "border-zinc-700 bg-zinc-900 group-hover:border-zinc-500"
                          }`}
                        >
                          {list.isChecked && (
                            <Check className="h-3 w-3 stroke-[3]" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Create new list form */}
              {lists.length < 10 ? (
                <form
                  onSubmit={handleCreateList}
                  className="space-y-3 pt-4 border-t border-zinc-800"
                >
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Criar nova lista
                  </h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Nome da lista (ex: Animes dessa Temporada)"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      maxLength={50}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Descrição (opcional)"
                      value={newListDesc}
                      onChange={(e) => setNewListDesc(e.target.value)}
                      maxLength={150}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isCreating || !newListName.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Criar Lista
                  </button>
                </form>
              ) : (
                <div className="flex items-start gap-2 rounded-xl bg-zinc-950/60 border border-zinc-850 p-3 text-xs text-zinc-400">
                  <Info className="h-4 w-4 text-zinc-500 flex-shrink-0 mt-0.5" />
                  <p>
                    Você atingiu o limite de 10 listas personalizadas. Delete
                    alguma para poder criar novas.
                  </p>
                </div>
              )}

              {/* Info limits */}
              <div className="text-[10px] text-zinc-500 flex justify-between pt-2 border-t border-zinc-800">
                <span>Limite: 10 listas por usuário</span>
                <span>Max: 100 animes por lista</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
