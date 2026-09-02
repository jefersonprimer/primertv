import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { User, Bookmark, Search } from "lucide-react";
import { MobileSidebar } from "./MobileSidebar";
import { Link } from "@/i18n/routing";
import { UserMenu } from "./UserMenu";
import { AddMediaButton } from "./admin/AddMediaButton";

export async function Header() {
  const session = await getSession();
  const user = session?.user;
  const t = await getTranslations("Header");

  const exploreLinks = [
    { href: "/popular", label: t("popular") },
    { href: "/new", label: t("new") },
    { href: "/seasons", label: t("seasons") },
    { href: "/calendar", label: t("calendar") },
  ];

  return (
    <header className="sticky top-0 px-4 z-50 w-full bg-[#0E0E0E]">
      <div className="mx-auto flex h-14 2xl:h-16 max-w-full items-center justify-between">
        <div className="flex h-full items-center gap-4">
          <div className="flex h-full items-center gap-3">
            <MobileSidebar />
            <Link
              href="/"
              className="flex items-center text-xl tracking-tight hover:scale-[1.03] transition-transform duration-300 group"
            >
              <span className="font-semibold text-zinc-100 group-hover:text-white transition-colors">
                primer
              </span>
              <span className="font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent ml-1 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                tv
              </span>
            </Link>
          </div>
          <nav className="hidden h-full items-center sm:flex gap-1">
            {exploreLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center px-4 py-3 rounded-md text-sm text-[#bbb] hover:text-white hover:bg-[#151515] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex h-full items-center gap-1.5">
          <Link
            href="/search"
            className="flex h-9 w-9 2xl:h-10 2xl:w-10 items-center justify-center rounded-full text-[#bbb] hover:text-white hover:bg-[#151515] transition-colors"
          >
            <Search className="w-5 h-5 2xl:w-6 2xl:h-6" />
          </Link>

          {user ? (
            <div className="flex h-full items-center gap-2">
              <Link
                href="/watchlist"
                className="hidden md:flex h-9 w-9 2xl:h-10 2xl:w-10 items-center justify-center rounded-full text-[#bbb] hover:text-white hover:bg-[#151515] transition-colors"
                title="Sua Lista"
              >
                <Bookmark className="w-5 h-5 2xl:w-6 2xl:h-6" />
              </Link>
              {user.role === "admin" && <AddMediaButton />}
              <UserMenu user={user} />
            </div>
          ) : (
            <Link
              href="/login"
              className="flex h-9 w-9 2xl:h-10 2xl:w-10 items-center justify-center rounded-full text-[#bbb] hover:text-white hover:bg-[#151515] transition-colors"
            >
              <User className="w-5 h-5 2xl:w-6 2xl:h-6" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
