"use client";

import { useState } from "react";
import { Mail, Send, User, Info, MessageSquare, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ContatoPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const bodyText = `Nome: ${nome}\nE-mail: ${email}\n\nMensagem:\n${mensagem}`;
    const mailtoUrl = `mailto:support.primerlabs@gmail.com?subject=${encodeURIComponent(
      assunto
    )}&body=${encodeURIComponent(bodyText)}`;

    // Abre o cliente de e-mail padrão do usuário (como o Gmail, se configurado)
    window.location.href = mailtoUrl;
  };

  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-800 dark:text-zinc-300 pb-20">
      {/* Decorative Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] pointer-events-none overflow-hidden opacity-50 dark:opacity-30">
        <div className="absolute top-[-10%] left-[20%] w-[35%] h-[60%] rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 blur-3xl" />
        <div className="absolute top-[-5%] right-[20%] w-[35%] h-[60%] rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 pt-16 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/dmca"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          Voltar para DMCA
        </Link>

        {/* Header Hero */}
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30 backdrop-blur-md">
            <Mail size={12} className="animate-pulse" />
            <span>Fale Conosco</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
            Contato
          </h1>
          <p className="max-w-md mx-auto text-sm text-zinc-500 dark:text-zinc-400">
            Para entrar em contato com a equipe do PrimerTv preencha o formulário abaixo.
          </p>
        </div>

        {/* Contact Form Card */}
        <div className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome Field */}
            <div className="space-y-2">
              <label htmlFor="nome" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                Nome completo
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  id="nome"
                  required
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/40 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-sm transition-all text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                E-mail
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  id="email"
                  required
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/40 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-sm transition-all text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {/* Assunto Field */}
            <div className="space-y-2">
              <label htmlFor="assunto" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                Assunto
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                  <Info size={18} />
                </span>
                <input
                  type="text"
                  id="assunto"
                  required
                  placeholder="Qual o motivo do contato?"
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/40 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-sm transition-all text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {/* Mensagem Field */}
            <div className="space-y-2">
              <label htmlFor="mensagem" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                Escreva a mensagem
              </label>
              <div className="relative">
                <span className="absolute top-3 left-3 text-zinc-400">
                  <MessageSquare size={18} />
                </span>
                <textarea
                  id="mensagem"
                  required
                  rows={5}
                  placeholder="Escreva aqui os detalhes da sua mensagem..."
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/40 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-sm transition-all text-zinc-900 dark:text-white resize-y"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
            >
              <Send size={16} />
              Enviar Mensagem
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
