import Image from "next/image";
import Link from "next/link";

export type MediaCardItem = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
};

export function MediaCard({
  item,
  type,
  priority = false,
  sizes = "(max-width: 640px) 160px, 200px",
}: {
  item: MediaCardItem;
  type: "anime" | "series" | "movie" | "manga" | "novela" | "channel";
  priority?: boolean;
  sizes?: string;
}) {
  const basePath =
    type === "novela"
      ? "novelas"
      : type === "channel"
        ? "livetv"
        : type === "movie"
          ? "filmes"
          : type === "anime"
            ? "animes"
            : type === "manga"
              ? "mangas"
              : type;

  return (
    <Link
      href={`/${basePath}/${item.slug}`}
      className="group flex flex-col gap-2"
    >
      <div
        className={`relative overflow-hidden bg-white dark:bg-zinc-800 shadow-md transition-shadow group-hover:shadow-xl group-hover:shadow-blue-500/10 ${
          type === "channel" ? "aspect-square rounded-2xl" : "aspect-[2/3]"
        }`}
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes={sizes}
            priority={priority}
            className={`transition-transform duration-300 group-hover:scale-110 ${
              type === "channel" ? "object-contain p-4" : "object-cover"
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400">
            Sem imagem
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <h3 className="line-clamp-2 text-sm font-medium text-[#f2f2f2] group-hover:text-blue-500">
        {item.title}
      </h3>
    </Link>
  );
}
