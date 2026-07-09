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
          className="flex items-center gap-2 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer rounded-sm"
        >
          <Pencil className="h-4 w-4" />
          {t("editList")}
        </button>
      ) : (
        <button
          onClick={openModal}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-sm transition-colors cursor-pointer flex items-center justify-center"
          title={t("editList")}
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-md overflow-hidden border border-zinc-800 bg-zinc-900 p-1 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer z-20"
              aria-label={t("close")}
            >
              <X className="h-5 w-5" />
            </button>

            {/* Form */}
            <div className="pt-4">
              <form
                onSubmit={handleSubmit}
                className="flex flex-col h-full justify-between p-6 bg-transparent"
              >
                <div className="space-y-4 w-full">
                  <h3 className="text-lg font-bold text-white">
                    {t("editTitle")}
                  </h3>
                  {error && (
                    <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 p-2 rounded-sm">
                      {error}
                    </p>
                  )}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase">
                      {t("listNamePlaceholder").split("(")[0].trim()}
                    </label>
                    <input
                      type="text"
                      placeholder={t("listNamePlaceholder")}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-sm px-3 py-2.5 rounded-sm border border-zinc-800 bg-zinc-950 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-zinc-500 text-white transition-colors"
                      maxLength={50}
                      required
                    />
                    <label className="block text-xs font-semibold text-zinc-400 uppercase pt-2">
                      {t("descriptionPlaceholder").split("(")[0].trim()}
                    </label>
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
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 rounded-sm border border-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-400 hover:text-white transition-colors hover:bg-zinc-800 cursor-pointer"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="flex-1 flex items-center justify-center gap-2 rounded-sm bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t("save")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
