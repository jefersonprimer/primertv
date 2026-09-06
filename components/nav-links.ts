export const MAIN_NAV_LINKS = [
  { href: "/animes", key: "animes", label: "Animes" },
  { href: "/series", key: "series", label: "Séries" },
  { href: "/movies", key: "movies", label: "Filmes" },
  { href: "/livetv", key: "livetv", label: "Live Tv" },
] as const;

export const EXPLORE_NAV_LINKS = [
  { href: "/mangas", key: "mangas", label: "Mangas" },
  { href: "/novelas", key: "novelas", label: "Novelas" },
  { href: "/seasons", key: "seasons", label: "Temporadas" },
  { href: "/calendar", key: "calendar", label: "Calendário" },
  { href: "/popular", key: "popular", label: "Populares" },
  { href: "/new", key: "new", label: "Novidades" },
] as const;

export const NAV_LINKS = [...MAIN_NAV_LINKS, ...EXPLORE_NAV_LINKS] as const;
