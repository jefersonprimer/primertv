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
  type: "anime" | "series" | "movie" | "manga" | "novela";
  priority?: boolean;
  sizes?: string;
}) {
  const basePath =
    type === "novela"
      ? "novelas"
      : type === "movie"
        ? "filmes"
        : type === "anime"
          ? "animes"
          : type === "manga"
            ? "mangas"
            : type;

  return (
    <Link href={`/${basePath}/${item.slug}`} className="flex flex-col gap-2">
      <div className="relative overflow-hidden aspect-2/3">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400">
            Sem imagem
          </div>
        )}
      </div>
      <h3 className="line-clamp-2 text-sm font-medium text-[#f2f2f2] hover:text-white">
        {item.title}
      </h3>
    </Link>
  );
}
