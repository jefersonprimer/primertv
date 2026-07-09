import { Menu } from "lucide-react";

export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 md:px-4 lg:px-2 xl:px-0 z-50 w-full bg-[#272727]">
      <div className="mx-auto flex h-16 max-w-full items-center justify-between">
        <div className="flex h-full items-center gap-4">
          <div className="flex h-full items-center gap-1">
            <div className="flex h-9 w-9 items-center justify-center text-[#bbb] md:hidden">
              <Menu size={22} />
            </div>
            <div className="flex items-center lg:pl-4 text-xl tracking-tight">
              <span className="font-semibold text-zinc-100">primer</span>
              <span className="font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent ml-1 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                tv
              </span>
            </div>
          </div>

          {/* Desktop Nav placeholders */}
          <nav className="hidden h-full items-center sm:flex">
            <div className="flex h-full items-center px-4">
              <div className="h-4 w-20 animate-pulse bg-zinc-700" />
            </div>
            <div className="flex h-full items-center px-4">
              <div className="h-4 w-14 animate-pulse bg-zinc-700" />
            </div>
            <div className="flex h-full items-center px-4">
              <div className="h-4 w-14 animate-pulse bg-zinc-700" />
            </div>
            <div className="hidden md:flex h-full items-center">
              <div className="flex h-full items-center px-4">
                <div className="h-4 w-14 animate-pulse bg-zinc-700" />
              </div>
              <div className="flex h-full items-center px-4">
                <div className="h-4 w-14 animate-pulse bg-zinc-700" />
              </div>
              <div className="flex h-full items-center px-4">
                <div className="h-4 w-20 animate-pulse bg-zinc-700" />
              </div>
            </div>
          </nav>
        </div>

        {/* Right side icons placeholders */}
        <div className="flex h-full items-center">
          <div className="flex h-full items-center px-4 text-[#bbb]">
            <div className="h-5 w-5 animate-pulse rounded-full bg-zinc-700" />
          </div>
          <div className="flex h-full items-center px-4 text-[#bbb]">
            <div className="h-5 w-5 animate-pulse rounded-full bg-zinc-700" />
          </div>
          <div className="flex h-full items-center px-4">
            <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-700" />
          </div>
        </div>
      </div>
    </header>
  );
}
