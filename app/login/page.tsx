"use client";

import { login } from "@/app/actions/auth";
import Link from "next/link";
import { useActionState } from "react";

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, undefined);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-black text-white">
      <div className="w-full max-w-md p-8 space-y-8 bg-zinc-900 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold text-center">Login</h2>
        <form action={action} className="space-y-6">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 mt-1 border border-zinc-700 rounded-md bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Senha</label>
            <input
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 mt-1 border border-zinc-700 rounded-md bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {state?.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Entrando..." : "Login"}
          </button>
        </form>
        <p className="text-center text-sm">
          Não tem uma conta?{" "}
          <Link href="/signup" className="text-blue-500 hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
