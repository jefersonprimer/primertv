const genreKeys: Record<string, string> = {
  Action: "action",
  Adventure: "adventure",
  Comedy: "comedy",
  Drama: "drama",
  Fantasy: "fantasy",
  Music: "music",
  Romance: "romance",
  "Sci-Fi": "sciFi",
  Seinen: "seinen",
  Shojo: "shojo",
  Shonen: "shonen",
  "Slice of life": "sliceOfLife",
  Sports: "sports",
  Supernatural: "supernatural",
  Thriller: "thriller",
};

export function translateGenre(
  genre: string,
  translate: (key: string) => string,
): string {
  const key = genreKeys[genre];
  return key ? translate(key) : genre;
}
