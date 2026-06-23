export type AdminCollection =
  | "movies"
  | "series"
  | "animes"
  | "mangas"
  | "novelas"
  | "channels";

export type AdminFieldType = "text" | "textarea" | "number" | "datetime-local";

export type AdminField = {
  name: string;
  label: string;
  type: AdminFieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  step?: string;
};

export type AdminCollectionConfig = {
  label: string;
  itemLabel: string;
  publicPath: string;
  fields: AdminField[];
};

export const adminCollections: Record<AdminCollection, AdminCollectionConfig> = {
  movies: {
    label: "Filmes",
    itemLabel: "filme",
    publicPath: "/filmes",
    fields: [
      { name: "title", label: "Título", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      {
        name: "description",
        label: "Descrição",
        type: "textarea",
        placeholder: "Sinopse do filme",
      },
      { name: "imageUrl", label: "Imagem", type: "text" },
      { name: "bannerUrl", label: "Banner URL", type: "text" },
      {
        name: "genres",
        label: "Gêneros",
        type: "text",
        placeholder: "Ação, Drama, Suspense",
        helpText: "Separe por vírgula.",
      },
      { name: "videoUrl", label: "URL do vídeo", type: "text" },
    ],
  },
  series: {
    label: "Séries",
    itemLabel: "série",
    publicPath: "/series",
    fields: [
      { name: "title", label: "Título", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      {
        name: "description",
        label: "Descrição",
        type: "textarea",
        placeholder: "Sinopse da série",
      },
      { name: "imageUrl", label: "Imagem", type: "text" },
      { name: "bannerUrl", label: "Banner URL", type: "text" },
      { name: "logoUrl", label: "Logo URL", type: "text" },
      { name: "score", label: "Nota", type: "number", step: "0.1" },
      {
        name: "genres",
        label: "Gêneros",
        type: "text",
        placeholder: "Drama, Mistério",
        helpText: "Separe por vírgula.",
      },
    ],
  },
  animes: {
    label: "Animes",
    itemLabel: "anime",
    publicPath: "/animes",
    fields: [
      { name: "title", label: "Título", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      {
        name: "description",
        label: "Descrição",
        type: "textarea",
        placeholder: "Sinopse do anime",
      },
      { name: "imageUrl", label: "Imagem", type: "text" },
      { name: "logoUrl", label: "Logo URL", type: "text" },
      { name: "bannerUrl", label: "Banner URL", type: "text" },
      { name: "compactImageUrl", label: "Imagem Compacta URL", type: "text" },
      {
        name: "genres",
        label: "Gêneros",
        type: "text",
        placeholder: "Ação, Shounen",
        helpText: "Separe por vírgula.",
      },
      { name: "aired", label: "Exibição", type: "text" },
      { name: "rating", label: "Classificação", type: "text" },
      { name: "status", label: "Status", type: "text" },
    ],
  },
  mangas: {
    label: "Mangas",
    itemLabel: "manga",
    publicPath: "/mangas",
    fields: [
      { name: "title", label: "Título", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      {
        name: "description",
        label: "Descrição",
        type: "textarea",
        placeholder: "Sinopse do manga",
      },
      { name: "imageUrl", label: "Imagem", type: "text" },
      { name: "bannerUrl", label: "Banner URL", type: "text" },
      {
        name: "genres",
        label: "Gêneros",
        type: "text",
        placeholder: "Ação, Aventura",
        helpText: "Separe por vírgula.",
      },
      { name: "aired", label: "Publicação", type: "text" },
      { name: "rating", label: "Classificação", type: "text" },
      { name: "status", label: "Status", type: "text" },
    ],
  },
  novelas: {
    label: "Novelas",
    itemLabel: "novela",
    publicPath: "/novelas",
    fields: [
      { name: "title", label: "Título", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      {
        name: "description",
        label: "Descrição",
        type: "textarea",
        placeholder: "Sinopse da novela",
      },
      { name: "imageUrl", label: "Imagem", type: "text" },
      {
        name: "genres",
        label: "Gêneros",
        type: "text",
        placeholder: "Drama, Romance",
        helpText: "Separe por vírgula.",
      },
    ],
  },
  channels: {
    label: "Canais",
    itemLabel: "canal",
    publicPath: "/livetv",
    fields: [
      { name: "title", label: "Título", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      {
        name: "description",
        label: "Descrição",
        type: "textarea",
        placeholder: "Descrição do canal",
      },
      { name: "imageUrl", label: "Imagem", type: "text" },
      { name: "videoUrl", label: "URL do vídeo", type: "text" },
      { name: "embedUrl", label: "URL embed", type: "text" },
      {
        name: "position",
        label: "Posição",
        type: "number",
        helpText: "Menor número aparece primeiro.",
      },
    ],
  },
};

export function isAdminCollection(value: string): value is AdminCollection {
  return value in adminCollections;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function splitGenres(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((genre) => genre.trim())
    .filter(Boolean);
}

export function joinGenres(value: string[] | undefined | null) {
  return value?.join(", ") || "";
}

export function toDateTimeLocal(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hour}:${minute}`;
}
