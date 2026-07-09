import { getTranslations } from "next-intl/server";
import { NAV_LINKS } from "./nav-links";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { getSession } from "@/lib/auth";
import { Link } from "@/i18n/routing";
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
              className="flex items-center transition-transform duration-300 group"
            >
              <span className="text-2xl font-semibold text-zinc-100 group-hover:text-white transition-colors tracking-tight">
                primer
              </span>
              <span className="text-2xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent ml-1 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] tracking-tight">
                tv
              </span>
            </Link>
            <p className="max-w-md text-sm text-[#bbb] leading-relaxed">
              {t("description")}
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-4 mt-2">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-6 w-6 items-center justify-center text-[#bbb] hover:text-white transition-all duration-200"
                aria-label="Twitter"
              >
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                >
                  <title>PayPal</title>
                  <path d="M15.607 4.653H8.941L6.645 19.251H1.82L4.862 0h7.995c3.754 0 6.375 2.294 6.473 5.513-.648-.478-2.105-.86-3.722-.86m6.57 5.546c0 3.41-3.01 6.853-6.958 6.853h-2.493L11.595 24H6.74l1.845-11.538h3.592c4.208 0 7.346-3.634 7.153-6.949a5.24 5.24 0 0 1 2.848 4.686M9.653 5.546h6.408c.907 0 1.942.222 2.363.541-.195 2.741-2.655 5.483-6.441 5.483H8.714Z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-6 w-6 items-center justify-center text-[#bbb] hover:text-white transition-all duration-200"
                aria-label="Twitter"
              >
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                >
                  <title>X</title>
                  <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
                </svg>
              </a>

              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-6 w-6 items-center justify-center text-[#bbb] hover:text-white transition-all duration-200"
                aria-label="GitHub"
              >
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                >
                  <title>GitHub</title>
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </a>
              <a
                href="https://t.me/+9k8C3C8Yix8zMDIx"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-6 w-6 items-center justify-center text-[#bbb] hover:text-white transition-all duration-200"
                aria-label="Telegram"
              >
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                >
                  <title>Telegram</title>
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
            </div>
            {/* Language Selector Indicator */}
            <LanguageSwitcher />
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#f2f2f2] mb-4">
              {t("navHeading")}
            </h3>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center text-sm text-[#bbb] hover:text-white transition-colors duration-150"
                  >
                    <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-white">
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
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#f2f2f2] mb-4">
              {t("supportHeading")}
            </h3>
            <ul className="space-y-2.5 text-sm text-[#bbb] hover:text-white">
              <li>
                <Link
                  href="/faq"
                  className="group flex items-center text-[#bbb] hover:text-white transition-colors duration-150"
                >
                  <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-white">
                    ›
                  </span>
                  {t("helpCenter")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contato"
                  className="group flex items-center text-sm text-[#bbb] hover:text-white transition-colors duration-150"
                >
                  <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-blue-white">
                    ›
                  </span>
                  {t("contact")}
                </Link>
              </li>
              <li>
                <Link
                  href="/status"
                  className="group flex items-center text-sm text-[#bbb] hover:text-white transition-colors duration-150"
                >
                  <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-white">
                    ›
                  </span>
                  {t("serverStatus")}
                </Link>
              </li>
              <li>
                <Link
                  href="/termos"
                  className="group flex items-center text-sm text-[#bbb] hover:text-white transition-colors duration-150"
                >
                  <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-white">
                    ›
                  </span>
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidade"
                  className="group flex items-center text-sm text-[#bbb] hover:text-white transition-colors duration-150"
                >
                  <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-white">
                    ›
                  </span>
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/dmca"
                  className="group flex items-center text-sm text-[#bbb] hover:text-white transition-colors duration-150"
                >
                  <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-white">
                    ›
                  </span>
                  {t("dmca")}
                </Link>
              </li>
            </ul>
          </div>

          {/* User Account / Membership */}
          <div className="hidden md:block">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#f2f2f2] mb-4">
              {t("accountHeading")}
            </h3>
            <ul className="space-y-2.5">
              {user ? (
                <>
                  <li>
                    <Link
                      href="/history"
                      className="group flex items-center text-sm text-[#bbb] hover:text-white transition-colors duration-150"
                    >
                      <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-white">
                        ›
                      </span>
                      {t("history")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/watchlist"
                      className="group flex items-center text-sm text-[#bbb] hover:text-white transition-colors duration-150"
                    >
                      <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-white">
                        ›
                      </span>
                      {t("watchlist")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/lists"
                      className="group flex items-center text-sm text-[#bbb] hover:text-white transition-colors duration-150"
                    >
                      <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-white">
                        ›
                      </span>
                      {t("myLists")}
                    </Link>
                  </li>
                  <li>
                    <form action={logout}>
                      <button
                        type="submit"
                        className="group flex w-full items-center text-sm text-[#bbb] hover:text-white transition-colors duration-150 text-left cursor-pointer"
                      >
                        <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-white">
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
                      className="group flex items-center text-sm text-[#bbb] hover:text-white transition-colors duration-150"
                    >
                      <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-white">
                        ›
                      </span>
                      {t("login")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/signup"
                      className="group flex items-center text-sm text-[#bbb] hover:text-white transition-colors duration-150"
                    >
                      <span className="mr-0 opacity-0 transition-all duration-150 group-hover:mr-1.5 group-hover:opacity-100 text-white">
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
        <p className="text-xs text-[#bbb] leading-relaxed mb-4">
          {t("disclaimer")}
        </p>

        {/* Footer Bottom */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between text-xs text-[#bbb]">
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
            <span className="text-white">
              © {new Date().getFullYear()} primer tv.
            </span>
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
