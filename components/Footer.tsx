import Link from "next/link";
import { NAV_LINKS } from "./nav-links";
import { Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-white/80 text-zinc-600 backdrop-blur-md dark:bg-black/80 dark:text-zinc-400">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand & Description */}
          <div className="flex flex-col gap-4 sm:col-span-2">
            <Link
              href="/"
              className="flex items-center transition-opacity hover:opacity-80"
            >
              <span className="text-2xl font-bold tracking-tighter text-zinc-900 dark:text-white">
                PrimerTv
              </span>
            </Link>
            <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              A sua plataforma definitiva para assistir aos melhores canais,
              novelas, séries, filmes, animes e ler mangás. Desfrute da melhor
              experiência de entretenimento digital.
            </p>
            {/* Social Icons */}
            <div className="flex gap-4 mt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-all duration-200 hover:border-blue-500 hover:bg-blue-500/5 hover:text-blue-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-500"
                aria-label="Instagram"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-all duration-200 hover:border-blue-500 hover:bg-blue-500/5 hover:text-blue-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-500"
                aria-label="Twitter"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-all duration-200 hover:border-blue-500 hover:bg-blue-500/5 hover:text-blue-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-500"
                aria-label="YouTube"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
                  <polygon points="10 15 15 12 10 9 10 15" />
                </svg>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-all duration-200 hover:border-blue-500 hover:bg-blue-500/5 hover:text-blue-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-500"
                aria-label="GitHub"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 mb-4">
              Navegação
            </h3>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center text-sm text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-500 transition-colors duration-150"
                  >
                    <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-600 dark:text-blue-500">
                      ›
                    </span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 mb-4">
              Suporte
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/faq"
                  className="group flex items-center text-sm text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-500 transition-colors duration-150"
                >
                  <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-600 dark:text-blue-500">
                    ›
                  </span>
                  Central de Ajuda
                </Link>
              </li>
              <li>
                <Link
                  href="/status"
                  className="group flex items-center text-sm text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-500 transition-colors duration-150"
                >
                  <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-600 dark:text-blue-500">
                    ›
                  </span>
                  Status do Servidor
                </Link>
              </li>
              <li>
                <Link
                  href="/termos"
                  className="group flex items-center text-sm text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-500 transition-colors duration-150"
                >
                  <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-600 dark:text-blue-500">
                    ›
                  </span>
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidade"
                  className="group flex items-center text-sm text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-500 transition-colors duration-150"
                >
                  <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-600 dark:text-blue-500">
                    ›
                  </span>
                  Privacidade
                </Link>
              </li>
            </ul>
          </div>

          {/* User Account / Membership */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 mb-4">
              Minha Conta
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/login"
                  className="group flex items-center text-sm text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-500 transition-colors duration-150"
                >
                  <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-600 dark:text-blue-500">
                    ›
                  </span>
                  Entrar
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="group flex items-center text-sm text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-500 transition-colors duration-150"
                >
                  <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-600 dark:text-blue-500">
                    ›
                  </span>
                  Criar Conta
                </Link>
              </li>
              <li>
                <Link
                  href="/watchlist"
                  className="group flex items-center text-sm text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-500 transition-colors duration-150"
                >
                  <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-600 dark:text-blue-500">
                    ›
                  </span>
                  Minha Lista
                </Link>
              </li>
              <li>
                <Link
                  href="/historico"
                  className="group flex items-center text-sm text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-500 transition-colors duration-150"
                >
                  <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-600 dark:text-blue-500">
                    ›
                  </span>
                  Histórico
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <hr className="my-8 border-zinc-200 dark:border-zinc-800/80" />

        {/* Footer Bottom */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between text-xs text-zinc-400 dark:text-zinc-500">
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
            <span>© {new Date().getFullYear()} PrimerTv.</span>
            <span className="hidden sm:inline">•</span>
            <span>Todos os direitos reservados.</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {/* Language Selector Indicator */}
            <div className="flex items-center gap-1.5 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-default">
              <Globe size={14} className="text-zinc-400 dark:text-zinc-500" />
              <span>Português (Brasil)</span>
            </div>

            {/* Created with Heart */}
            <div className="flex items-center gap-1.5">
              Desenvolvido por PrimerLabs
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
