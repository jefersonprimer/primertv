"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { X, Pencil, Loader2 } from "lucide-react";
import { updateList } from "@/app/actions/lists";

interface EditListModalProps {
  listId: string;
  initialName: string;
  initialDescription?: string | null;
  triggerType?: "button" | "icon";
}

export default function EditListModal({
  listId,
  initialName,
  initialDescription = "",
  triggerType = "icon",
}: EditListModalProps) {
  const t = useTranslations("Lists");
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = () => {
    setName(initialName);
    setDescription(initialDescription || "");
    setError(null);
    setIsOpen(true);
  };
  const closeModal = () => setIsOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await updateList(listId, name, description);
      if (res.success) {
        closeModal();
      } else {
        setError(res.error || t("editError"));
      }
    } catch (err) {
      console.error(err);
      setError(t("editError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {triggerType === "button" ? (
        <button
          onClick={openModal}
          className="flex items-center gap-2 border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 px-4 py-2 text-sm font-semibold text-white transition-all cursor-pointer rounded-xl"
        >
          {t("editList")}
        </button>
      ) : (
        <button
          onClick={openModal}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-all cursor-pointer flex items-center justify-center"
          title={t("editList")}
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
            onClick={closeModal}
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/95 p-6 shadow-2xl shadow-black/80 transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 p-1.5 text-zinc-400 hover:bg-zinc-800/80 hover:text-white rounded-full transition-all cursor-pointer z-20"
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {t("editTitle")}
                </h3>
              </div>

              {error && (
                <p className="text-xs text-red-300 bg-red-950/40 border border-red-800/60 p-3 rounded-xl">
                  {error}
                </p>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    {t("listNamePlaceholder").split("(")[0].trim()}
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

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    {t("descriptionPlaceholder").split("(")[0].trim()}
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

              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-md shadow-blue-600/25 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
