"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Plus, Loader2, FolderPlus } from "lucide-react";
import { createList } from "@/app/actions/lists";

interface CreateListFormProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

export default function CreateListForm({
  onSuccess,
  isModal = false,
}: CreateListFormProps) {
  const t = useTranslations("Lists");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await createList(name, description);
      if (res.success) {
        setName("");
        setDescription("");
        onSuccess?.();
      } else {
        setError(res.error || t("errorCreate"));
      }
    } catch (err) {
      console.error(err);
      setError(t("errorCreate"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col h-full justify-between p-6 ${
        isModal
          ? "bg-transparent"
          : "border border-zinc-800 bg-zinc-950 rounded-2xl"
      }`}
    >
      <div className="space-y-4 w-full">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <FolderPlus className="h-4 w-4" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">{t("createList")}</h3>
        </div>

        {error && (
          <p className="text-xs text-red-300 bg-red-950/40 border border-red-800/60 p-3 rounded-xl">
            {error}
          </p>
        )}

        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Nome da lista
            </label>
            <input
              type="text"
              placeholder={t("listNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-zinc-500 text-white transition-all"
              maxLength={50}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Descrição (opcional)
            </label>
            <textarea
              placeholder={t("descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-zinc-500 text-white resize-none transition-all"
              maxLength={150}
              rows={3}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-4 py-2.5 text-xs font-semibold text-white transition-all shadow-md shadow-blue-600/25 disabled:opacity-50 cursor-pointer active:scale-95"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4 stroke-[2.5]" />
        )}
        {t("createList")}
      </button>
    </form>
  );
}
