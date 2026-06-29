import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminCrudForm } from "@/components/admin/AdminCrudForm";
import { AdminMediaForm } from "@/components/admin/AdminMediaForm";
import {
  adminCollections,
  isAdminCollection,
  type AdminField,
} from "@/lib/admin";
import {
  getCollectionDetail,
  getCollectionItem,
  getCollectionItems,
  requireAdmin,
  type AdminEpisodeItem,
  type AdminSeasonItem,
} from "../data";
import {
  deleteChapter,
  deleteEpisode,
  deleteSeason,
  saveChapter,
  saveEpisode,
  saveSeason,
} from "../actions";

type PageProps = {
  params: Promise<{ collection: string }>;
  searchParams: Promise<{
    id?: string;
    saved?: string;
    seasonId?: string;
    episodeId?: string;
    chapterId?: string;
  }>;
};

const seasonFields: AdminField[] = [
  {
    name: "number",
    label: "Número da temporada",
    type: "number",
    required: true,
    step: "1",
  },
];

const episodeFields: AdminField[] = [
  {
    name: "number",
    label: "Número do episódio",
    type: "number",
    required: true,
    step: "1",
  },
  {
    name: "title",
    label: "Título",
    type: "text",
    placeholder: "Opcional",
  },
  {
    name: "videoUrl",
    label: "URL do vídeo",
    type: "text",
    placeholder: "https://...",
  },
];

const chapterFields: AdminField[] = [
  {
    name: "number",
    label: "Número do capítulo",
    type: "number",
    required: true,
    step: "0.1",
  },
  {
    name: "title",
    label: "Título",
    type: "text",
    placeholder: "Opcional",
  },
  {
    name: "pages",
    label: "Páginas",
    type: "textarea",
    placeholder: "Cole as URLs separadas por linha ou vírgula",
    helpText: "Cada linha vira uma página do capítulo.",
  },
];

function findEpisode(
  seasons: AdminSeasonItem[],
  episodeId?: string,
): { episode: AdminEpisodeItem | null; season: AdminSeasonItem | null } {
  if (!episodeId) return { episode: null, season: null };

  for (const season of seasons) {
    const episode = season.episodes.find((item) => item.id === episodeId);
    if (episode) {
      return { episode, season };
    }
  }

  return { episode: null, season: null };
}

export default async function AdminCollectionPage({
  params,
  searchParams,
}: PageProps) {
  await requireAdmin();

  const { collection } = await params;
  if (!isAdminCollection(collection)) {
    notFound();
  }

  const query = await searchParams;
  const { id, saved, seasonId, episodeId, chapterId } = query;
  const config = adminCollections[collection];
  const items = await getCollectionItems(collection);
  const selectedItem = id ? await getCollectionItem(collection, id) : null;
  const detail = id ? await getCollectionDetail(collection, id) : null;

  const seasons = detail?.seasons || [];
  const chapters = detail?.chapters || [];
  const activeSeason =
    seasons.find((season) => season.id === seasonId) ||
    findEpisode(seasons, episodeId).season ||
    seasons[0] ||
    null;
  const seasonFormSeason = seasonId ? activeSeason : null;
  const selectedEpisode =
    activeSeason?.episodes.find((episode) => episode.id === episodeId) ||
    findEpisode(seasons, episodeId).episode ||
    null;
  const chapterFormChapter =
    chapterId ? chapters.find((chapter) => chapter.id === chapterId) || null : null;

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 md:px-8 xl:grid-cols-[1.3fr_0.7fr]">
      <section className="flex flex-col gap-6">
        <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Link
                href="/admin"
                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                ← Voltar ao painel
              </Link>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
                {config.label}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Liste os itens existentes, abra um registro para editar e use
                os formulários abaixo para criar temporadas, episódios ou
                capítulos manualmente.
              </p>
            </div>
            <Link
              href={`/admin/${collection}`}
              className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-blue-900 dark:hover:text-blue-300"
            >
              Novo {config.itemLabel}
            </Link>
          </div>

          {saved && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-300">
              Item salvo com sucesso.
            </div>
          )}
        </div>

        <div className="grid gap-3">
          {items.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              Nenhum item cadastrado ainda.
            </div>
          ) : (
            items.map((item) => {
              const active = item.id === id;

              return (
                <Link
                  key={item.id}
                  href={`/admin/${collection}?id=${item.id}`}
                  className={`rounded-[28px] border p-5 transition ${
                    active
                      ? "border-blue-300 bg-blue-50 shadow-sm dark:border-blue-900 dark:bg-blue-950/20"
                      : "border-zinc-200 bg-white hover:border-blue-200 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                        {item.title}
                      </h2>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        /{item.slug}
                      </p>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                      Editar
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>

      <aside className="flex flex-col gap-4">
        <AdminMediaForm
          collection={collection}
          config={config}
          item={selectedItem || undefined}
        />

        {detail && (collection === "animes" || collection === "series" || collection === "novelas") && (
          <div className="flex flex-col gap-4 rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                Estrutura
              </p>
              <h3 className="mt-2 text-xl font-bold text-zinc-950 dark:text-zinc-50">
                Temporadas e episódios
              </h3>
            </div>

            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
                Temporadas
              </h4>
              <Link
                href={`/admin/${collection}?id=${id}`}
                className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-blue-900 dark:hover:text-blue-300"
              >
                Nova temporada
              </Link>
            </div>

            {seasons.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Nenhuma temporada cadastrada.
              </p>
            ) : (
              <div className="space-y-2">
                {seasons.map((season) => {
                  const active = season.id === activeSeason?.id;
                  return (
                    <Link
                      key={season.id}
                      href={`/admin/${collection}?id=${id}&seasonId=${season.id}`}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition ${
                        active
                          ? "border-blue-300 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20"
                          : "border-zinc-200 bg-zinc-50 hover:border-blue-200 dark:border-zinc-800 dark:bg-zinc-900"
                      }`}
                    >
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        Temporada {season.number}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {season.episodes.length} episódios
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}

            <AdminCrudForm
              title={seasonFormSeason ? `Editar temporada ${seasonFormSeason.number}` : "Nova temporada"}
              description="Crie ou atualize a temporada do catálogo selecionado."
              action={saveSeason}
              submitLabel={seasonFormSeason ? "Atualizar temporada" : "Criar temporada"}
              fields={seasonFields}
              hiddenFields={[
                { name: "collection", value: collection },
                { name: "parentId", value: id || "" },
                { name: "parentSlug", value: detail.slug },
                { name: "id", value: seasonFormSeason?.id || "" },
              ]}
              defaults={
                seasonFormSeason
                  ? {
                      number: String(seasonFormSeason.number),
                    }
                  : {}
              }
              emptyHint="Use a temporada selecionada ou crie uma nova."
            />

            {seasonFormSeason && (
              <form action={deleteSeason} className="flex items-center justify-end">
                <input type="hidden" name="collection" value={collection} />
                <input type="hidden" name="parentId" value={id || ""} />
                <input type="hidden" name="parentSlug" value={detail.slug} />
                <input type="hidden" name="id" value={seasonFormSeason.id} />
                <button
                  type="submit"
                  className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-950 dark:text-red-300 dark:hover:bg-red-950/30"
                >
                  Excluir temporada
                </button>
              </form>
            )}

            {activeSeason && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
                    Episódios da temporada
                  </h4>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {activeSeason.episodes.length} itens
                  </span>
                </div>

                {activeSeason.episodes.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Nenhum episódio cadastrado.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeSeason.episodes.map((episode) => {
                      const active = episode.id === selectedEpisode?.id;
                      return (
                        <Link
                          key={episode.id}
                          href={`/admin/${collection}?id=${id}&seasonId=${activeSeason.id}&episodeId=${episode.id}`}
                          className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition ${
                            active
                              ? "border-blue-300 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20"
                              : "border-zinc-200 bg-zinc-50 hover:border-blue-200 dark:border-zinc-800 dark:bg-zinc-900"
                          }`}
                        >
                          <div>
                            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                              Episódio {episode.number}
                            </span>
                            {episode.title && (
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {episode.title}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            Editar
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeSeason && (
              <AdminCrudForm
                title={selectedEpisode ? `Editar episódio ${selectedEpisode.number}` : "Novo episódio"}
                description="Salve um episódio manualmente nesta temporada."
                action={saveEpisode}
                submitLabel={selectedEpisode ? "Atualizar episódio" : "Criar episódio"}
                fields={
                  collection === "animes"
                    ? [
                        ...episodeFields,
                        {
                          name: "imageUrl",
                          label: "URL da Imagem do Episódio",
                          type: "text",
                          placeholder: "https://...",
                        },
                        {
                          name: "customPlayers",
                          label: "Players Adicionais (uma URL por linha)",
                          type: "textarea",
                          placeholder: "Insira as URLs dos players (ex: https://streamtape.com/e/...), uma por linha.",
                        },
                      ]
                    : episodeFields
                }
                hiddenFields={[
                  { name: "collection", value: collection },
                  { name: "parentId", value: id || "" },
                  { name: "parentSlug", value: detail.slug },
                  { name: "seasonId", value: activeSeason.id },
                  { name: "id", value: selectedEpisode?.id || "" },
                ]}
                defaults={
                  selectedEpisode
                    ? {
                        number: String(selectedEpisode.number),
                        title: selectedEpisode.title || "",
                        videoUrl: selectedEpisode.videoUrl || "",
                        imageUrl: (selectedEpisode as any).imageUrl || "",
                        customPlayers: (selectedEpisode as any).customPlayers?.join("\n") || "",
                      }
                    : {}
                }
                emptyHint="A edição acompanha a temporada selecionada."
              />
            )}

            {activeSeason && selectedEpisode && (
              <form
                action={deleteEpisode}
                className="flex items-center justify-end"
              >
                <input type="hidden" name="collection" value={collection} />
                <input type="hidden" name="parentId" value={id || ""} />
                <input type="hidden" name="parentSlug" value={detail.slug} />
                <input type="hidden" name="seasonId" value={activeSeason.id} />
                <input type="hidden" name="id" value={selectedEpisode.id} />
                <button
                  type="submit"
                  className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-950 dark:text-red-300 dark:hover:bg-red-950/30"
                >
                  Excluir episódio
                </button>
              </form>
            )}
          </div>
        )}

        {detail && collection === "mangas" && (
          <div className="flex flex-col gap-4 rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                Estrutura
              </p>
              <h3 className="mt-2 text-xl font-bold text-zinc-950 dark:text-zinc-50">
                Capítulos
              </h3>
            </div>

            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
                Lista
              </h4>
              <Link
                href={`/admin/mangas?id=${id}`}
                className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-blue-900 dark:hover:text-blue-300"
              >
                Novo capítulo
              </Link>
            </div>

            {chapters.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Nenhum capítulo cadastrado.
              </p>
            ) : (
              <div className="space-y-2">
                {chapters.map((chapter) => {
                  const active = chapter.id === chapterFormChapter?.id;
                  return (
                    <Link
                      key={chapter.id}
                      href={`/admin/mangas?id=${id}&chapterId=${chapter.id}`}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition ${
                        active
                          ? "border-blue-300 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20"
                          : "border-zinc-200 bg-zinc-50 hover:border-blue-200 dark:border-zinc-800 dark:bg-zinc-900"
                      }`}
                    >
                      <div>
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          Capítulo {chapter.number}
                        </span>
                        {chapter.title && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {chapter.title}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {chapter.pages.length} páginas
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}

            <AdminCrudForm
              title={chapterFormChapter ? `Editar capítulo ${chapterFormChapter.number}` : "Novo capítulo"}
              description="Cadastre ou atualize um capítulo do manga selecionado."
              action={saveChapter}
              submitLabel={chapterFormChapter ? "Atualizar capítulo" : "Criar capítulo"}
              fields={chapterFields}
              hiddenFields={[
                { name: "collection", value: "mangas" },
                { name: "parentId", value: id || "" },
                { name: "parentSlug", value: detail.slug },
                { name: "id", value: chapterFormChapter?.id || "" },
              ]}
              defaults={
                chapterFormChapter
                  ? {
                      number: String(chapterFormChapter.number),
                      title: chapterFormChapter.title || "",
                      pages: chapterFormChapter.pages.join("\n"),
                    }
                  : {}
              }
              emptyHint="As páginas aceitam várias URLs separadas por linha."
            />

            {chapterFormChapter && (
              <form
                action={deleteChapter}
                className="flex items-center justify-end"
              >
                <input type="hidden" name="parentId" value={id || ""} />
                <input type="hidden" name="parentSlug" value={detail.slug} />
                <input type="hidden" name="id" value={chapterFormChapter.id} />
                <button
                  type="submit"
                  className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-950 dark:text-red-300 dark:hover:bg-red-950/30"
                >
                  Excluir capítulo
                </button>
              </form>
            )}
          </div>
        )}
      </aside>
    </main>
  );
}
