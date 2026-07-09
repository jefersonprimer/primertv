"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toggleAnimeInList } from "@/app/actions/lists";

interface RemoveFromListButtonProps {
  listId: string;
  animeId?: string;
  seriesId?: string;
}

export default function RemoveFromListButton({
  listId,
  animeId,
  seriesId,
}: RemoveFromListButtonProps) {
  const t = useTranslations("Lists");
  const [isPending, setIsPending] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm(t("confirmRemoveItem"))) {
      setIsPending(true);
      try {
        const res = await toggleAnimeInList(listId, animeId, seriesId);
        if (!res.success) {
          alert(res.error || t("removeItemError"));
        }
      } catch (err) {
        console.error(err);
        alert(t("removeItemError"));
      } finally {
        setIsPending(false);
      }
    }
  };

  return (
    <button
      onClick={handleRemove}
      disabled={isPending}
      className="absolute top-2 right-2 z-15 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 hover:bg-red-650 text-zinc-150 hover:text-white transition-all cursor-pointer border border-zinc-700/50 shadow-md hover:scale-105"
      title={t("removeItemTitle")}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <X className="h-4 w-4" />
      )}
    </button>
  );
}
