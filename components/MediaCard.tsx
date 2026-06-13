import Image from "next/image";
import Link from "next/link";

export function MediaCard({ item, type }: { item: any; type: "anime" | "series" | "movie" | "manga" | "novela" | "channel" }) {
  const basePath = type === "novela" ? "novelas" : type === "channel" ? "channels" : type;

  return (
    <Link href={`/${basePath}/${item.id}`} className="group flex flex-col gap-2">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800 shadow-md transition-shadow group-hover:shadow-xl group-hover:shadow-blue-500/10">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 250px"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400">
            Sem imagem
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <h3 className="line-clamp-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-500">
        {item.title}
      </h3>
    </Link>
  );
}
