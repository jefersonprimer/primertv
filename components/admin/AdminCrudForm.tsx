"use client";

import { useActionState } from "react";
import type { AdminField } from "@/lib/admin";

type FormState = {
  error?: string;
};

type AdminCrudFormProps = {
  title: string;
  description: string;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  fields: AdminField[];
  hiddenFields?: Array<{ name: string; value: string }>;
  defaults?: Record<string, string>;
  emptyHint?: string;
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
      step={field.step || (field.type === "number" ? "1" : undefined)}
      className={baseClass}
    />
  );
}

export function AdminCrudForm({
  title,
  description,
  action,
  submitLabel,
  fields,
  hiddenFields = [],
  defaults = {},
  emptyHint,
}: AdminCrudFormProps) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    action,
    {},
  );

  return (
    <form
      action={formAction}
      className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="mb-6">
        <h3 className="text-xl font-bold text-zinc-950 dark:text-zinc-50">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>

      {hiddenFields.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}

      {state?.error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => {
          const value = defaults[field.name] ?? "";
          return (
            <label
              key={field.name}
              className={`flex flex-col ${field.type === "textarea" ? "md:col-span-2" : ""}`}
            >
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {field.label}
                {field.required ? " *" : ""}
              </span>
              <FieldInput field={field} defaultValue={value} />
              {field.helpText && (
                <span className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                  {field.helpText}
                </span>
              )}
            </label>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Salvando..." : submitLabel}
        </button>
        {emptyHint && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyHint}</p>
        )}
      </div>
    </form>
  );
}
