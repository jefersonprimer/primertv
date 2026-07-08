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
          : "border border-dashed border-zinc-800 bg-zinc-900"
      }`}
    >
      <div className="space-y-4 w-full">
        <h3 className="text-lg font-bold text-white">
          {t("createList")}
        </h3>
        {error && (
          <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 p-2 rounded-sm">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <input
            type="text"
            placeholder={t("listNamePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-sm px-3 py-2.5 rounded-sm border border-zinc-800 bg-zinc-950 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-zinc-500 text-white transition-colors"
            maxLength={50}
            required
          />
          <textarea
            placeholder={t("descriptionPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm px-3 py-2.5 rounded-sm border border-zinc-800 bg-zinc-950 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-zinc-500 text-white resize-none transition-colors"
            maxLength={150}
            rows={3}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-sm bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
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
