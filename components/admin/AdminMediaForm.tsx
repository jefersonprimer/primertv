"use client";

import { saveMedia } from "@/app/admin/actions";
import {
  AdminCollection,
  AdminCollectionConfig,
  AdminField,
  joinGenres,
  joinAwards,
  toDateTimeLocal,
} from "@/lib/admin";
import { useActionState } from "react";

type AdminMediaFormProps = {
  collection: AdminCollection;
  config: AdminCollectionConfig;
  item?: Record<string, unknown> | null;
  redirectTo?: string;
  onCancel?: () => void;
  className?: string;
};

type FormState = {
  error?: string;
};

function FieldInput({
  field,
  defaultValue,
}: {
  field: AdminField;
  defaultValue: string;
}) {
  const baseClass =
    "mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100";

  if (field.type === "textarea") {
    return (
      <textarea
        name={field.name}
        defaultValue={defaultValue}
        placeholder={field.placeholder}
        rows={5}
        className={baseClass}
      />
    );
  }

  return (
    <input
      name={field.name}
      type={field.type}
      defaultValue={defaultValue}
      placeholder={field.placeholder}
      step={field.type === "number" ? (field.step || "1") : undefined}
      className={baseClass}
    />
  );
}

export function AdminMediaForm({
  collection,
  config,
  item,
  redirectTo,
  onCancel,
  className,
}: AdminMediaFormProps) {
  const [state, action, isPending] = useActionState<FormState, FormData>(
    saveMedia,
    {},
  );

  const itemTitle =
    typeof item?.title === "string" ? item.title : null;
  const title = itemTitle ? `Editando: ${itemTitle}` : `Novo ${config.itemLabel}`;

  return (
    <form
      action={action}
      className={className || "rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8"}
    >
      <input type="hidden" name="collection" value={collection} />
      <input type="hidden" name="id" value={typeof item?.id === "string" ? item.id : ""} />
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

      <div className="mb-8 flex flex-col gap-2 border-b border-zinc-100 pb-6 dark:border-zinc-800">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-400">
          {config.label}
        </p>
        <h2 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">
          {title}
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Preencha os campos abaixo para criar ou atualizar o registro manualmente.
        </p>
      </div>

      {state?.error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300">
          {state.error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {config.fields.map((field) => {
          const value = item?.[field.name];
          const defaultValue =
            field.name === "genres"
              ? joinGenres(Array.isArray(value) ? value : undefined)
              : field.name === "awards"
                ? joinAwards(Array.isArray(value) ? (value as string[]) : undefined)
                : field.name === "audio"
                  ? joinGenres(Array.isArray(value) ? (value as string[]) : undefined)
                  : field.name === "subtitles"
                    ? joinGenres(Array.isArray(value) ? (value as string[]) : undefined)
                    : field.type === "number"
                ? value == null
                  ? ""
                  : String(value)
                : field.type === "datetime-local"
                  ? toDateTimeLocal(value as any)
                  : value == null
                    ? ""
                    : String(value);

          return (
            <label
              key={field.name}
              className={`flex flex-col ${field.type === "textarea" ? "md:col-span-2" : ""}`}
            >
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {field.label}
                {field.required ? " *" : ""}
              </span>
              <FieldInput field={field} defaultValue={defaultValue} />
              {field.helpText && (
                <span className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                  {field.helpText}
                </span>
              )}
            </label>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Salvando..." : item ? "Atualizar mídia" : "Criar mídia"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-5 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            Cancelar
          </button>
        )}
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {item ? "Salva as alterações do item selecionado." : "Cria um novo item nesse catálogo."}
        </p>
      </div>
    </form>
  );
}
