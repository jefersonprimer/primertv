"use client";

import { signup } from "@/app/actions/auth";
import { Link } from "@/i18n/routing";
import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const t = useTranslations("Auth");
  const [showPassword, setShowPassword] = useState(false);
  const [state, action, isPending] = useActionState(signup, undefined);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-black text-white">
      <div className="w-full max-w-md p-8 space-y-8 bg-zinc-900 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold text-center">{t("signupTitle")}</h2>
        <form action={action} className="space-y-6">
          <div>
            <label className="block text-sm font-medium">{t("nameLabel")}</label>
            <input
              name="name"
              type="text"
              required
              className="w-full px-3 py-2 mt-1 border border-zinc-700 rounded-md bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">{t("emailLabel")}</label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 mt-1 border border-zinc-700 rounded-md bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">{t("passwordLabel")}</label>
            <div className="relative mt-1">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-3 pr-10 py-2 border border-zinc-700 rounded-md bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-white"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {state?.error && (
            <p className="text-sm text-red-500">{t(state.error)}</p>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? t("creatingButton") : t("signupButton")}
          </button>
        </form>
        <p className="text-center text-sm">
          {t("hasAccount")}{" "}
          <Link href="/login" className="text-blue-500 hover:underline">
            {t("loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
