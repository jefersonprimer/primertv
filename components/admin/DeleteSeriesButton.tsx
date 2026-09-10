"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { deleteSeries } from "@/app/admin/actions";

type DeleteSeriesButtonProps = {
  seriesId: string;
  seriesSlug: string;
  className?: string;
  redirectTo?: string;
};

function DeleteButtonContent() {
  const { pending } = useFormStatus();

  return pending ? (
    <>
      <Loader2 size={16} className="animate-spin" />
      <span>Apagando...</span>
    </>
  ) : (
    <>
      <Trash2 size={16} />
      <span>Excluir</span>
    </>
  );
}

export function DeleteSeriesButton({
  seriesId,
  seriesSlug,
  className,
  redirectTo = "/series",
}: DeleteSeriesButtonProps) {
  return (
    <form
      action={deleteSeries}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Tem certeza que deseja apagar esta série por completo? Isso removerá também temporadas, episódios e vínculos associados.",
          )
        ) {
          event.preventDefault();
        }
      }}
      className="flex-shrink-0"
    >
      <input type="hidden" name="id" value={seriesId} />
      <input type="hidden" name="slug" value={seriesSlug} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button
        type="submit"
        className={
          className ||
          "flex h-10 items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-950 dark:bg-zinc-950 dark:text-red-300 dark:hover:bg-red-950/30 md:h-auto md:py-2.5 uppercase"
        }
      >
        <DeleteButtonContent />
      </button>
    </form>
  );
}
