"use server";

import { prisma } from "@/lib/prisma";
import {
  AdminCollection,
  adminCollections,
  slugify,
  splitGenres,
  splitAwards,
} from "@/lib/admin";
import { isAdminEmail } from "@/lib/auth";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type FormState = {
  error?: string;
};

type CollectionWithChildren = "animes" | "series" | "novelas";
type EpisodeCollection = "animes" | "series" | "novelas";
type ChapterCollection = "mangas";

function requireAdminSession() {
  return getSession().then((session) => {
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      redirect("/login");
    }
    return session;
  });
}

function getPublicPath(collection: AdminCollection, slug: string) {
  return `${adminCollections[collection].publicPath}/${slug}`;
}

function getListPath(collection: AdminCollection) {
  return adminCollections[collection].publicPath;
}

function readString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(formData: FormData, name: string) {
  const value = readString(formData, name);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readCommonData(formData: FormData) {
  return {
    title: readString(formData, "title"),
    slug: readString(formData, "slug"),
    description: readString(formData, "description") || null,
    imageUrl: readString(formData, "imageUrl") || null,
    genres: splitGenres(formData.get("genres")),
  };
}

function revalidatePublicRoutes(collection: AdminCollection, slug: string, oldSlug?: string) {
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath(getListPath(collection));
  revalidatePath(getPublicPath(collection, slug));

  if (oldSlug && oldSlug !== slug) {
    revalidatePath(getPublicPath(collection, oldSlug));
  }
}

export async function saveMedia(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminSession();

  const collection = readString(formData, "collection") as AdminCollection;
  const id = readString(formData, "id");

  if (!collection || !(collection in adminCollections)) {
    return { error: "Coleção inválida." };
  }

  const existing =
    id && id.length > 0 ? await getExistingRecord(collection, id) : null;

  if (id && !existing) {
    return { error: "Item não encontrado para edição." };
  }

  const common = readCommonData(formData);
  if (!common.title || !common.slug) {
    return { error: "Título e slug são obrigatórios." };
  }

  const finalSlug = common.slug || slugify(common.title);
  const oldSlug = existing?.slug;
  let savedId = id;

  try {
    switch (collection) {
      case "movies": {
        const videoUrl = readString(formData, "videoUrl") || null;
        const payload = {
          ...common,
          slug: finalSlug,
          bannerUrl: readString(formData, "bannerUrl") || null,
          videoUrl,
        };

        if (existing) {
          await prisma.movie.update({
            where: { id },
            data: payload,
          });
          savedId = id;
        } else {
          const created = await prisma.movie.create({ data: payload });
          savedId = created.id;
        }

        break;
      }
      case "series": {
        const payload = {
          ...common,
          slug: finalSlug,
          bannerUrl: readString(formData, "bannerUrl") || null,
          logoUrl: readString(formData, "logoUrl") || null,
          score: readNumber(formData, "score"),
        };

        if (existing) {
          await prisma.series.update({
            where: { id },
            data: payload,
          });
          savedId = id;
        } else {
          const created = await prisma.series.create({ data: payload });
          savedId = created.id;
        }

        break;
      }
      case "animes": {
        const payload = {
          ...common,
          slug: finalSlug,
          logoUrl: readString(formData, "logoUrl") || null,
          bannerUrl: readString(formData, "bannerUrl") || null,
          compactImageUrl: readString(formData, "compactImageUrl") || null,
          aired: readString(formData, "aired") || null,
          rating: readString(formData, "rating") || null,
          status: readString(formData, "status") || null,
          awards: splitAwards(formData.get("awards")),
          audio: splitGenres(formData.get("audio")),
          subtitles: splitGenres(formData.get("subtitles")),
        };

        if (existing) {
          await prisma.anime.update({
            where: { id },
            data: payload,
          });
          savedId = id;
        } else {
          const created = await prisma.anime.create({ data: payload });
          savedId = created.id;
        }

        break;
      }
      case "mangas": {
        const payload = {
          ...common,
          slug: finalSlug,
          bannerUrl: readString(formData, "bannerUrl") || null,
          aired: readString(formData, "aired") || null,
          rating: readString(formData, "rating") || null,
          status: readString(formData, "status") || null,
        };

        if (existing) {
          await prisma.manga.update({
            where: { id },
            data: payload,
          });
          savedId = id;
        } else {
          const created = await prisma.manga.create({ data: payload });
          savedId = created.id;
        }

        break;
      }
      case "novelas": {
        const payload = {
          ...common,
          slug: finalSlug,
        };

        if (existing) {
          await prisma.novela.update({
            where: { id },
            data: payload,
          });
          savedId = id;
        } else {
          const created = await prisma.novela.create({ data: payload });
          savedId = created.id;
        }

        break;
      }
      case "channels": {
        const payload = {
          ...common,
          slug: finalSlug,
          videoUrl: readString(formData, "videoUrl") || null,
          embedUrl: readString(formData, "embedUrl") || null,
          position: readNumber(formData, "position") ?? 0,
        };

        if (existing) {
          await prisma.channel.update({
            where: { id },
            data: payload,
          });
          savedId = id;
        } else {
          const created = await prisma.channel.create({ data: payload });
          savedId = created.id;
        }

        break;
      }
    }
  } catch (error) {
    console.error(error);
    return { error: "Não foi possível salvar o item." };
  }

  revalidatePublicRoutes(collection, finalSlug, oldSlug || undefined);
  const redirectTo = readString(formData, "redirectTo");
  if (redirectTo === "public") {
    redirect(getPublicPath(collection, finalSlug));
  } else if (redirectTo) {
    redirect(redirectTo.replace("[slug]", finalSlug));
  } else {
    redirect(`/admin/${collection}?id=${savedId}&saved=1`);
  }
}

async function getExistingRecord(collection: AdminCollection, id: string) {
  switch (collection) {
    case "movies":
      return prisma.movie.findUnique({ where: { id } });
    case "series":
      return prisma.series.findUnique({ where: { id } });
    case "animes":
      return prisma.anime.findUnique({ where: { id } });
    case "mangas":
      return prisma.manga.findUnique({ where: { id } });
    case "novelas":
      return prisma.novela.findUnique({ where: { id } });
    case "channels":
      return prisma.channel.findUnique({ where: { id } });
  }
}

function readId(formData: FormData, name: string) {
  return readString(formData, name);
}

function readPages(formData: FormData) {
  const raw = readString(formData, "pages");
  return raw
    ? raw
        .split(/\r?\n|,/)
        .map((page) => page.trim())
        .filter(Boolean)
    : [];
}

function childPublicPath(collection: EpisodeCollection, parentSlug: string, childId: string) {
  return `${adminCollections[collection].publicPath}/${parentSlug}/episode/${childId}`;
}

function chapterPublicPath(parentSlug: string, chapterId: string) {
  return `${adminCollections.mangas.publicPath}/${parentSlug}/chapter/${chapterId}`;
}

function seasonParentPath(collection: AdminCollection, slug: string) {
  return `${adminCollections[collection].publicPath}/${slug}`;
}

function getSeasonModel(collection: CollectionWithChildren): any {
  return collection === "animes"
    ? prisma.season
    : collection === "series"
      ? prisma.seriesSeason
      : prisma.novelaSeason;
}

function getEpisodeModel(collection: EpisodeCollection): any {
  return collection === "animes"
    ? prisma.episode
    : collection === "series"
      ? prisma.seriesEpisode
      : prisma.novelaEpisode;
}

export async function saveSeason(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminSession();

  const collection = readString(formData, "collection") as CollectionWithChildren;
  const parentId = readId(formData, "parentId");
  const parentSlug = readString(formData, "parentSlug");
  const id = readId(formData, "id");
  const number = readNumber(formData, "number");

  if (!collection || !["animes", "series", "novelas"].includes(collection)) {
    return { error: "Coleção inválida." };
  }

  if (!parentId || !parentSlug || number == null) {
    return { error: "Parent, slug e número são obrigatórios." };
  }

  const model = getSeasonModel(collection);
  const existing = id ? await model.findUnique({ where: { id } }) : null;
  let savedId = id;

  try {
    if (existing) {
      await model.update({
        where: { id },
        data: { number },
      });
      savedId = id;
    } else {
      const created =
        collection === "animes"
          ? await prisma.season.create({
              data: { number, animeId: parentId },
            })
          : collection === "series"
            ? await prisma.seriesSeason.create({
                data: { number, seriesId: parentId },
              })
            : await prisma.novelaSeason.create({
                data: { number, novelaId: parentId },
              });
      savedId = created.id;
    }
  } catch (error) {
    console.error(error);
    return { error: "Não foi possível salvar a temporada." };
  }

  revalidatePath(seasonParentPath(collection, parentSlug));
  const redirectTo = readString(formData, "redirectTo");
  if (redirectTo === "public") {
    redirect(seasonParentPath(collection, parentSlug));
  } else if (redirectTo) {
    redirect(redirectTo.replace("[slug]", parentSlug));
  } else {
    redirect(`/admin/${collection}?id=${parentId}&seasonId=${savedId}&saved=1`);
  }
}

export async function deleteSeason(
  formData: FormData,
): Promise<void> {
  await requireAdminSession();

  const collection = readString(formData, "collection") as CollectionWithChildren;
  const parentId = readId(formData, "parentId");
  const parentSlug = readString(formData, "parentSlug");
  const id = readId(formData, "id");

  if (!collection || !parentId || !parentSlug || !id) {
    return;
  }

  const model = getSeasonModel(collection);

  try {
    await model.delete({ where: { id } });
  } catch (error) {
    console.error(error);
    return;
  }

  revalidatePath(seasonParentPath(collection, parentSlug));
  const redirectTo = readString(formData, "redirectTo");
  if (redirectTo === "public") {
    redirect(seasonParentPath(collection, parentSlug));
  } else if (redirectTo) {
    redirect(redirectTo.replace("[slug]", parentSlug));
  } else {
    redirect(`/admin/${collection}?id=${parentId}&saved=1`);
  }
}

export async function saveEpisode(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminSession();

  const collection = readString(formData, "collection") as EpisodeCollection;
  const parentId = readId(formData, "parentId");
  const parentSlug = readString(formData, "parentSlug");
  const seasonId = readId(formData, "seasonId");
  const id = readId(formData, "id");
  const number = readNumber(formData, "number");
  const title = readString(formData, "title") || null;
  const videoUrl = readString(formData, "videoUrl") || null;
  const imageUrl = readString(formData, "imageUrl") || null;

  if (!collection || !["animes", "series", "novelas"].includes(collection)) {
    return { error: "Coleção inválida." };
  }

  if (!parentId || !parentSlug || !seasonId || number == null) {
    return { error: "Temporada e número são obrigatórios." };
  }

  const model = getEpisodeModel(collection);
  const existing = id ? await model.findUnique({ where: { id } }) : null;
  let savedId = id;

  const customPlayersRaw = readString(formData, "customPlayers") || "";
  const customPlayers = customPlayersRaw
    ? customPlayersRaw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  try {
    if (existing) {
      const updateData: any = { number, title, videoUrl };
      if (collection === "animes") {
        updateData.customPlayers = customPlayers;
        updateData.imageUrl = imageUrl;
      }
      await model.update({
        where: { id },
        data: updateData,
      });
      savedId = id;
    } else {
      const created =
        collection === "animes"
          ? await prisma.episode.create({
              data: { number, title, videoUrl, imageUrl, seasonId, customPlayers },
            })
          : collection === "series"
            ? await prisma.seriesEpisode.create({
                data: { number, title, videoUrl, seasonId },
              })
            : await prisma.novelaEpisode.create({
                data: { number, title, videoUrl, seasonId },
              });
      savedId = created.id;
    }
  } catch (error) {
    console.error(error);
    return { error: "Não foi possível salvar o episódio." };
  }

  revalidatePath(seasonParentPath(collection, parentSlug));
  revalidatePath(childPublicPath(collection, parentSlug, savedId));
  const redirectTo = readString(formData, "redirectTo");
  if (redirectTo === "public") {
    redirect(seasonParentPath(collection, parentSlug));
  } else if (redirectTo) {
    redirect(redirectTo.replace("[slug]", parentSlug));
  } else {
    redirect(`/admin/${collection}?id=${parentId}&seasonId=${seasonId}&episodeId=${savedId}&saved=1`);
  }
}

export async function deleteEpisode(
  formData: FormData,
): Promise<void> {
  await requireAdminSession();

  const collection = readString(formData, "collection") as EpisodeCollection;
  const parentId = readId(formData, "parentId");
  const parentSlug = readString(formData, "parentSlug");
  const seasonId = readId(formData, "seasonId");
  const id = readId(formData, "id");

  if (!collection || !parentId || !parentSlug || !seasonId || !id) {
    return;
  }

  const model = getEpisodeModel(collection);

  try {
    await model.delete({ where: { id } });
  } catch (error) {
    console.error(error);
    return;
  }

  revalidatePath(seasonParentPath(collection, parentSlug));
  const redirectTo = readString(formData, "redirectTo");
  if (redirectTo === "public") {
    redirect(seasonParentPath(collection, parentSlug));
  } else if (redirectTo) {
    redirect(redirectTo.replace("[slug]", parentSlug));
  } else {
    redirect(`/admin/${collection}?id=${parentId}&seasonId=${seasonId}&saved=1`);
  }
}

export async function saveChapter(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminSession();

  const collection = readString(formData, "collection") as ChapterCollection;
  const parentId = readId(formData, "parentId");
  const parentSlug = readString(formData, "parentSlug");
  const id = readId(formData, "id");
  const number = readNumber(formData, "number");
  const title = readString(formData, "title") || null;
  const pages = readPages(formData);

  if (collection !== "mangas") {
    return { error: "Coleção inválida." };
  }

  if (!parentId || !parentSlug || number == null) {
    return { error: "Número do capítulo é obrigatório." };
  }

  const existing = id ? await prisma.chapter.findUnique({ where: { id } }) : null;
  let savedId = id;

  try {
    if (existing) {
      await prisma.chapter.update({
        where: { id },
        data: { number, title, pages },
      });
      savedId = id;
    } else {
      const created = await prisma.chapter.create({
        data: {
          number,
          title,
          pages,
          mangaId: parentId,
        },
      });
      savedId = created.id;
    }
  } catch (error) {
    console.error(error);
    return { error: "Não foi possível salvar o capítulo." };
  }

  revalidatePath(seasonParentPath("mangas", parentSlug));
  revalidatePath(chapterPublicPath(parentSlug, savedId));
  const redirectTo = readString(formData, "redirectTo");
  if (redirectTo === "public") {
    redirect(seasonParentPath("mangas", parentSlug));
  } else if (redirectTo) {
    redirect(redirectTo.replace("[slug]", parentSlug));
  } else {
    redirect(`/admin/mangas?id=${parentId}&chapterId=${savedId}&saved=1`);
  }
}

export async function deleteChapter(
  formData: FormData,
): Promise<void> {
  await requireAdminSession();

  const parentId = readId(formData, "parentId");
  const parentSlug = readString(formData, "parentSlug");
  const id = readId(formData, "id");

  if (!parentId || !parentSlug || !id) {
    return;
  }

  try {
    await prisma.chapter.delete({ where: { id } });
  } catch (error) {
    console.error(error);
    return;
  }

  revalidatePath(seasonParentPath("mangas", parentSlug));
  const redirectTo = readString(formData, "redirectTo");
  if (redirectTo === "public") {
    redirect(seasonParentPath("mangas", parentSlug));
  } else if (redirectTo) {
    redirect(redirectTo.replace("[slug]", parentSlug));
  } else {
    redirect(`/admin/mangas?id=${parentId}&saved=1`);
  }
}
