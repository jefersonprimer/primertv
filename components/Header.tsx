import Link from "next/link";
import { User, Bookmark, Search } from "lucide-react";
import { getSession } from "@/lib/auth";
import { MobileSidebar } from "./MobileSidebar";
import { UserMenu } from "./UserMenu";
import { ExplorarDropdown } from "./ExplorarDropdown";

import { AddMediaButton } from "./admin/AddMediaButton";

const DESKTOP_LINKS = [
  { href: "/series", label: "Séries" },
  { href: "/movies", label: "Filmes" },
  { href: "/animes", label: "Animes" },
  { href: "/mangas", label: "Mangas" },
  { href: "/livetv", label: "Live Tv" },
];

export async function Header() {
  const session = await getSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 md:px-4 lg:px-2 xl:px-0 z-50 w-full bg-[#272727]">
      <div className="mx-auto flex h-16 max-w-full items-center justify-between">
        <div className="flex h-full items-center gap-4">
          <div className="flex h-full items-center gap-1">
            <MobileSidebar />
            <Link href="/" className="flex items-center lg:pl-4">
              <span className="text-xl font-semibold text-[#f2f2f2] hover:text-white">
                primer tv
              </span>
            </Link>
          </div>
          <nav className="hidden h-full items-center sm:flex">
            {DESKTOP_LINKS.slice(0, 3).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex h-full items-center px-4 text-sm font-normal text-[#bbb] hover:text-[#f2f2f2] hover:bg-[#151515] transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="hidden md:flex h-full items-center">
              {DESKTOP_LINKS.slice(3).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex h-full items-center px-4 text-sm font-normal text-[#bbb] hover:text-[#f2f2f2] hover:bg-[#151515] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-4 w-px bg-zinc-700 mx-2" />
              <ExplorarDropdown />
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
