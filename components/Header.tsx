import { getSession } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { User, Bookmark, Search } from "lucide-react";
import { MobileSidebar } from "./MobileSidebar";
import { ExploreDropdown } from "./ExploreDropdown";
import { UserMenu } from "./UserMenu";
import { AddMediaButton } from "./admin/AddMediaButton";

export async function Header() {
  const session = await getSession();
  const user = session?.user;
  const t = await getTranslations("Header");

  const desktopLinks = [
    { href: "/series", label: t("series") },
    { href: "/movies", label: t("movies") },
    { href: "/animes", label: t("animes") },
    { href: "/mangas", label: t("mangas") },
    { href: "/livetv", label: t("livetv") },
  ];

  return (
    <header className="sticky top-0 md:px-4 lg:px-2 xl:px-0 z-50 w-full bg-[#272727]">
      <div className="mx-auto flex h-16 max-w-full items-center justify-between">
        <div className="flex h-full items-center gap-4">
          <div className="flex h-full items-center gap-1">
            <MobileSidebar />
            <Link
              href="/"
              className="flex items-center lg:pl-4 text-lg font-semibold text-[#f2f2f2] hover:text-white"
            >
              primer tv
            </Link>
          </div>
          <nav className="hidden h-full items-center sm:flex">
            {desktopLinks.slice(0, 3).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex h-full items-center px-4 text-sm text-[#bbb] hover:text-white hover:bg-[#151515] transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="hidden md:flex h-full items-center">
              {desktopLinks.slice(3).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex h-full items-center px-4 text-sm text-[#bbb] hover:text-white hover:bg-[#151515] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-4 w-px bg-zinc-700 mx-2" />
              <ExploreDropdown />
            </div>
          </nav>
        </div>

        <div className="flex h-full items-center">
          <Link
            href="/search"
            className="flex h-full items-center px-4 text-[#bbb] hover:text-white hover:bg-[#151515] transition-colors"
          >
            <Search size={22} />
          </Link>

          {user ? (
            <div className="flex h-full items-center">
              {user.role === "admin" ? (
                <AddMediaButton />
              ) : (
                <Link
                  href="/watchlist"
                  className="hidden md:flex h-full items-center px-4 text-[#bbb] hover:text-white hover:bg-[#151515] transition-colors"
                >
                  <Bookmark size={22} />
                </Link>
              )}
              <UserMenu user={user} />
            </div>
          ) : (
            <Link
              href="/login"
              className="flex h-full items-center px-4 text-[#bbb] hover:text-white hover:bg-[#151515] transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800">
                <User size={20} />
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
