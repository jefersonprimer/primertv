import { NextResponse } from "next/server";
import { getAnimeDetailsBySlug } from "@/lib/media-details";
import { getSession } from "@/lib/auth";
import { getAnimeWatchHistory } from "@/lib/history";
import { isInWatchlist } from "@/lib/watchlist";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Slug é obrigatório" }, { status: 400 });
    }

    const anime = await getAnimeDetailsBySlug(slug);

    if (!anime) {
      return NextResponse.json({ error: "Anime não encontrado" }, { status: 404 });
    }

    // Identificar qual é o primeiro episódio padrão (Temporada 1, Ep 1)
    let firstEpisode = null;
    if (anime.seasons && anime.seasons.length > 0) {
      const season1 = anime.seasons.find((s) => s.number === 1) || anime.seasons[0];
      if (season1.episodes && season1.episodes.length > 0) {
        const ep1 = season1.episodes.find((e) => e.number === 1) || season1.episodes[0];
        firstEpisode = {
          id: ep1.id,
          number: ep1.number,
          seasonNumber: season1.number,
          title: ep1.title,
          publicId: ep1.publicId,
          slug: ep1.slug,
        };
      }
    }

    let nextEpisode = firstEpisode;
    let hasHistory = false;
    let inWatchlist = false;

    // Verificar usuário autenticado
    const session = await getSession();
    const userId = session?.user?.id;

    if (userId && anime.id) {
      inWatchlist = await isInWatchlist("ANIME", anime.id);

      const history = await getAnimeWatchHistory(userId);
      const animeHistory = history.filter(
        (h) => h.episode.season.anime.id === anime.id
      );

      if (animeHistory.length > 0) {
        hasHistory = true;
        const lastWatched = animeHistory[0]; // mais recente devido ao ORDER BY watchedAt DESC
        const currentEpNumber = lastWatched.episode.number;
        const currentSeasonNumber = lastWatched.episode.season.number;

        let foundNext = null;

        // Procurar na mesma temporada
        const currentSeasonObj = anime.seasons.find((s) => s.number === currentSeasonNumber);
        if (currentSeasonObj) {
          const nextInSeason = currentSeasonObj.episodes.find(
            (e) => e.number === currentEpNumber + 1
          );
          if (nextInSeason) {
            foundNext = {
              id: nextInSeason.id,
              number: nextInSeason.number,
              seasonNumber: currentSeasonNumber,
              title: nextInSeason.title,
              publicId: nextInSeason.publicId,
              slug: nextInSeason.slug,
            };
          }
        }

        // Se não achou na mesma temporada, procurar na próxima temporada
        if (!foundNext) {
          const nextSeasonObj = anime.seasons.find((s) => s.number === currentSeasonNumber + 1);
          if (nextSeasonObj && nextSeasonObj.episodes.length > 0) {
            const firstOfNextSeason = nextSeasonObj.episodes[0];
            foundNext = {
              id: firstOfNextSeason.id,
              number: firstOfNextSeason.number,
              seasonNumber: nextSeasonObj.number,
              title: firstOfNextSeason.title,
              publicId: firstOfNextSeason.publicId,
              slug: firstOfNextSeason.slug,
            };
          }
        }

        if (foundNext) {
          nextEpisode = foundNext;
        } else {
          nextEpisode = {
            id: lastWatched.episode.id,
            number: lastWatched.episode.number,
            seasonNumber: lastWatched.episode.season.number,
            title: lastWatched.episode.title,
            publicId: lastWatched.episode.publicId,
            slug: lastWatched.episode.slug,
          };
        }
      }
    }

    return NextResponse.json({
      id: anime.id,
      slug: anime.slug,
      title: anime.title,
      description: anime.description,
      imageUrl: anime.imageUrl,
      bannerUrl: anime.bannerUrl,
      genres: anime.genres,
      year: anime.year,
      score: anime.score,
      rating: anime.rating,
      isDubbed: anime.isDubbed,
      isSubtitled: anime.isSubtitled,
      nextEpisode,
      firstEpisode,
      hasHistory,
      inWatchlist,
      isLoggedIn: Boolean(userId),
    });
  } catch (error) {
    console.error("Erro na rota preview do anime:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao carregar preview" },
      { status: 500 }
    );
  }
}
