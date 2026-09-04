"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Eye, EyeOff, KeyRound, Mail, CheckCircle2, ArrowLeft } from "lucide-react";
import { requestPasswordReset, resetPasswordWithCode, ResetPasswordState } from "@/app/actions/resetPassword";

export default function ForgotPasswordPage() {
  const t = useTranslations("Auth");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Request Code Action
  const [requestCodeState, requestCodeAction, isRequestPending] = useActionState(
    async (prevState: ResetPasswordState | undefined, formData: FormData) => {
      const result = await requestPasswordReset(prevState, formData);
      if (result.success && result.email) {
        setEmail(result.email);
        setStep(2);
      }
      return result;
    },
    undefined
  );

  // Reset Password Action
  const [resetState, resetAction, isResetPending] = useActionState(
    async (prevState: ResetPasswordState | undefined, formData: FormData) => {
      const result = await resetPasswordWithCode(prevState, formData);
      if (result.success) {
        setStep(3);
      }
      return result;
    },
    undefined
  );

  return (
    <div className="flex flex-col items-center justify-center h-[80vh] md:h-auto md:min-h-[calc(100vh-4rem)] bg-black text-white px-4 py-8">
      <div className="w-full h-full md:h-auto md:max-w-md p-6 sm:p-8 space-y-6 bg-black md:bg-zinc-900 md:rounded-xl md:shadow-2xl border border-zinc-800 flex flex-col justify-center">

        {step === 1 && (
          <>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 mb-2">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">{t("forgotPasswordTitle")}</h2>
              <p className="text-sm text-zinc-400">{t("forgotPasswordSubtitle")}</p>
            </div>

            <form action={requestCodeAction} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  {t("emailLabel")}
                </label>
                <div className="relative mt-1">
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="seuemail@exemplo.com"
                    defaultValue={email}
                    className="w-full pl-10 pr-3 py-2.5 border border-zinc-700 rounded-lg bg-zinc-800/80 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <Mail className="w-5 h-5 text-zinc-500 absolute left-3 top-3" />
                </div>
              </div>

              {requestCodeState?.error && (
                <div className="p-3 text-xs text-red-400 bg-red-950/50 border border-red-800/50 rounded-lg">
                  {t(requestCodeState.error)}
                </div>
              )}

              <button
                type="submit"
                disabled={isRequestPending}
                className="w-full py-2.5 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {isRequestPending ? t("sendingCodeButton") : t("sendCodeButton")}
              </button>
            </form>

            <div className="text-center pt-2">
              <Link href="/login" className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                {t("backToLogin")}
              </Link>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">{t("enterCodeTitle")}</h2>
              <p className="text-sm text-zinc-400">
                {t("enterCodeSubtitle", { email })}
              </p>
            </div>

            <form action={resetAction} className="space-y-4">
              <input type="hidden" name="email" value={email} />

              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  {t("codeLabel")}
                </label>
                <input
                  name="code"
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  className="w-full px-3 py-2.5 mt-1 border border-zinc-700 rounded-lg bg-zinc-800/80 text-white text-center text-xl tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  {t("newPasswordLabel")}
                </label>
                <div className="relative mt-1">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    className="w-full pl-3 pr-10 py-2.5 border border-zinc-700 rounded-lg bg-zinc-800/80 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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

              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  {t("confirmPasswordLabel")}
                </label>
                <div className="relative mt-1">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    className="w-full pl-3 pr-10 py-2.5 border border-zinc-700 rounded-lg bg-zinc-800/80 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-white"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {resetState?.error && (
                <div className="p-3 text-xs text-red-400 bg-red-950/50 border border-red-800/50 rounded-lg">
                  {t(resetState.error)}
                </div>
              )}

              <button
                type="submit"
                disabled={isResetPending}
                className="w-full py-2.5 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg shadow-blue-600/20"
              >
                {isResetPending ? t("resettingPasswordButton") : t("resetPasswordButton")}
              </button>
            </form>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                {t("resendCode")}
              </button>
              <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
                {t("backToLogin")}
              </Link>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="text-center space-y-6 py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">{t("forgotPasswordTitle")}</h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {t("passwordResetSuccess")}
              </p>
            </div>
            <Link
              href="/login"
              className="block w-full py-2.5 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20 text-center"
            >
              {t("backToLogin")}
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
