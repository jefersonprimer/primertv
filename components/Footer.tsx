import { Link } from "@/i18n/routing";
import { NAV_LINKS } from "./nav-links";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

export async function Footer() {
  const session = await getSession();
  const user = session?.user;
  const t = await getTranslations("Footer");
  const tHeader = await getTranslations("Header");

  const linkKeyMap: Record<string, string> = {
    "/series": "series",
    "/movies": "movies",
    "/animes": "animes",
    "/mangas": "mangas",
    "/livetv": "livetv",
    "/seasons": "seasons",
    "/calendar": "calendar",
    "/novelas": "novelas",
    "/popular": "popular",
    "/new": "new",
  };

  return (
    <footer className="w-full bg-black/80 text-zinc-400 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand & Description */}
          <div className="flex flex-col gap-4 sm:col-span-2">
            <Link
              href="/"
              className="flex items-center transition-opacity hover:opacity-80"
            >
              <span className="text-2xl font-bold tracking-tighter text-white">
                PrimerTv
              </span>
            </Link>
            <p className="max-w-md text-sm text-zinc-400 leading-relaxed">
              {t("description")}
            </p>
            {/* Social Icons */}
            <div className="flex gap-4 mt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition-all duration-200 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-500"
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
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition-all duration-200 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-500"
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
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition-all duration-200 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-500"
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
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition-all duration-200 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-500"
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
            {/* Language Selector Indicator */}
            <LanguageSwitcher />
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-100 mb-4">
              {t("navHeading")}
            </h3>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center text-sm text-zinc-400 hover:text-blue-500 transition-colors duration-150"
                  >
                    <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-500">
                      ›
                    </span>
                    {tHeader(linkKeyMap[link.href] || link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="hidden md:block">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-100 mb-4">
              {t("supportHeading")}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/faq"
                  className="group flex items-center text-sm text-zinc-400 hover:text-blue-500 transition-colors duration-150"
                >
                  <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-500">
                    ›
                  </span>
                  {t("helpCenter")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contato"
                  className="group flex items-center text-sm text-zinc-400 hover:text-blue-500 transition-colors duration-150"
                >
                  <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-500">
                    ›
                  </span>
                  {t("contact")}
                </Link>
              </li>
              <li>
                <Link
                  href="/status"
                  className="group flex items-center text-sm text-zinc-400 hover:text-blue-500 transition-colors duration-150"
                >
                  <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-500">
                    ›
                  </span>
                  {t("serverStatus")}
                </Link>
              </li>
              <li>
                <Link
                  href="/termos"
                  className="group flex items-center text-sm text-zinc-400 hover:text-blue-500 transition-colors duration-150"
                >
                  <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-500">
                    ›
                  </span>
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidade"
                  className="group flex items-center text-sm text-zinc-400 hover:text-blue-500 transition-colors duration-150"
                >
                  <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-500">
                    ›
                  </span>
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/dmca"
                  className="group flex items-center text-sm text-zinc-400 hover:text-blue-500 transition-colors duration-150"
                >
                  <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-500">
                    ›
                  </span>
                  {t("dmca")}
                </Link>
              </li>
            </ul>
          </div>

          {/* User Account / Membership */}
          <div className="hidden md:block">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-100 mb-4">
              {t("accountHeading")}
            </h3>
            <ul className="space-y-2.5">
              {user ? (
                <>
                  <li>
                    <Link
                      href="/history"
                      className="group flex items-center text-sm text-zinc-400 hover:text-blue-500 transition-colors duration-150"
                    >
                      <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-500">
                        ›
                      </span>
                      {t("history")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/watchlist"
                      className="group flex items-center text-sm text-zinc-400 hover:text-blue-500 transition-colors duration-150"
                    >
                      <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-500">
                        ›
                      </span>
                      {t("watchlist")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/lists"
                      className="group flex items-center text-sm text-zinc-400 hover:text-blue-500 transition-colors duration-150"
                    >
                      <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-500">
                        ›
                      </span>
                      {t("myLists")}
                    </Link>
                  </li>
                  <li>
                    <form action={logout}>
                      <button
                        type="submit"
                        className="group flex w-full items-center text-sm text-zinc-400 hover:text-red-500 transition-colors duration-150 text-left cursor-pointer"
                      >
                        <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-red-500">
                          ›
                        </span>
                        {t("logout")}
                      </button>
                    </form>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link
                      href="/login"
                      className="group flex items-center text-sm text-zinc-400 hover:text-blue-500 transition-colors duration-150"
                    >
                      <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-500">
                        ›
                      </span>
                      {t("login")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/signup"
                      className="group flex items-center text-sm text-zinc-400 hover:text-blue-500 transition-colors duration-150"
                    >
                      <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-500">
                        ›
                      </span>
                      {t("signup")}
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <hr className="my-8 border-zinc-800/80" />

        {/* Disclaimer */}
        <p className="text-xs text-zinc-500/80 leading-relaxed mb-4">
          {t("disclaimer")}
        </p>

        {/* Footer Bottom */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between text-xs text-zinc-500">
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
            <span>© {new Date().getFullYear()} PrimerTv.</span>
            <span className="hidden sm:inline">•</span>
            <span>{t("allRightsReserved")}</span>
            <Link
              href="https://primerlabs.vercel.app"
              className="flex items-center gap-1.5 hover:underline hover:text-white"
            >
              {t("developedBy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
