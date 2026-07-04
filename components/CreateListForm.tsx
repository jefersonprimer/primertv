"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { createList } from "@/app/actions/lists";
import { useTranslations } from "next-intl";

interface CreateListFormProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

export default function CreateListForm({ onSuccess, isModal = false }: CreateListFormProps) {
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
          : "border-2 border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20"
      }`}
    >
      <div className="space-y-4 w-full">
        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
          {t("createList")}
        </h3>
        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 p-2 rounded-lg">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <input
            type="text"
            placeholder={t("listNamePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-sm px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-400 dark:placeholder-zinc-600 text-zinc-800 dark:text-zinc-100"
            maxLength={50}
            required
          />
          <input
            type="text"
            placeholder={t("descriptionPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-400 dark:placeholder-zinc-600 text-zinc-800 dark:text-zinc-100"
            maxLength={150}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {t("createList")}
      </button>
    </form>
  );
}
