"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Edit2, Trash2 } from "lucide-react";
import {
  AdminCollection,
  adminCollections,
  type AdminField,
} from "@/lib/admin";
import { AdminMediaForm } from "./AdminMediaForm";
import { AdminCrudForm } from "./AdminCrudForm";
import {
  saveSeason,
  deleteSeason,
  saveEpisode,
  deleteEpisode,
  saveChapter,
  deleteChapter,
} from "@/app/admin/actions";

type AdminMediaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialCollection?: AdminCollection | null;
  item?: Record<string, unknown> | null;
  redirectTo?: string;
};

interface EpisodeData {
  id: string;
  number: number;
  title: string | null;
  videoUrl: string | null;
  imageUrl?: string | null;
  customPlayers?: string[];
}

interface SeasonData {
  id: string;
  number: number;
  episodes: EpisodeData[];
}

interface ChapterData {
  id: string;
  number: number;
  title: string | null;
  pages: string[];
}

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
    label: "Páginas (URLs)",
    type: "textarea",
    placeholder: "Cole as URLs separadas por linha ou vírgula",
    helpText: "Cada linha vira uma página do capítulo.",
  },
];

export function AdminMediaModal({
  isOpen,
  onClose,
  initialCollection = null,
  item = null,
  redirectTo,
}: AdminMediaModalProps) {
  const [selectedCollection, setSelectedCollection] =
    useState<AdminCollection | null>(initialCollection);
  const [activeTab, setActiveTab] = useState<"info" | "structure">("info");

  // Structure management states
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [editingSeason, setEditingSeason] = useState<SeasonData | null>(null);
  const [isAddingSeason, setIsAddingSeason] = useState(false);

  const [editingEpisode, setEditingEpisode] = useState<EpisodeData | null>(
    null,
  );
  const [isAddingEpisode, setIsAddingEpisode] = useState(false);

  const [editingChapter, setEditingChapter] = useState<ChapterData | null>(
    null,
  );
  const [isAddingChapter, setIsAddingChapter] = useState(false);

  const seasons = (item?.seasons as SeasonData[]) || [];
  const chapters = (item?.chapters as ChapterData[]) || [];

  const effectiveSeasonId = selectedSeasonId ?? seasons[0]?.id ?? null;
  const currentSeason =
    seasons.find((s) => s.id === effectiveSeasonId) || null;

  if (!isOpen) return null;

  const config = selectedCollection
    ? adminCollections[selectedCollection]
    : null;

  const handleClose = () => {
    if (!initialCollection) {
      setSelectedCollection(null);
    }
    setActiveTab("info");
    setSelectedSeasonId(null);
    setEditingSeason(null);
    setIsAddingSeason(false);
    setEditingEpisode(null);
    setIsAddingEpisode(false);
    setEditingChapter(null);
    setIsAddingChapter(false);
    onClose();
  };

  const handleSelectSeason = (seasonId: string) => {
    setSelectedSeasonId(seasonId);
    setEditingSeason(null);
    setIsAddingSeason(false);
    setEditingEpisode(null);
    setIsAddingEpisode(false);
  };

  // Form Configurations
  const seasonHiddenFields = [
    { name: "collection", value: selectedCollection || "" },
    { name: "parentId", value: String(item?.id || "") },
    { name: "parentSlug", value: String(item?.slug || "") },
    { name: "id", value: editingSeason?.id || "" },
    { name: "redirectTo", value: "public" },
  ];

  const seasonDefaults = editingSeason
    ? { number: String(editingSeason.number) }
    : undefined;

  const episodeHiddenFields = [
    { name: "collection", value: selectedCollection || "" },
    { name: "parentId", value: String(item?.id || "") },
    { name: "parentSlug", value: String(item?.slug || "") },
    { name: "seasonId", value: effectiveSeasonId || "" },
    { name: "id", value: editingEpisode?.id || "" },
    { name: "redirectTo", value: "public" },
  ];

  const episodeFormFields: AdminField[] =
    selectedCollection === "animes"
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
            placeholder:
              "Insira as URLs dos players (ex: https://streamtape.com/e/...), uma por linha.",
          },
        ]
      : episodeFields;

  const episodeDefaults = editingEpisode
    ? {
        number: String(editingEpisode.number),
        title: editingEpisode.title || "",
        videoUrl: editingEpisode.videoUrl || "",
        imageUrl: editingEpisode.imageUrl || "",
        customPlayers: editingEpisode.customPlayers?.join("\n") || "",
      }
    : undefined;

  const chapterHiddenFields = [
    { name: "collection", value: "mangas" },
    { name: "parentId", value: String(item?.id || "") },
    { name: "parentSlug", value: String(item?.slug || "") },
    { name: "id", value: editingChapter?.id || "" },
    { name: "redirectTo", value: "public" },
  ];

  const chapterDefaults = editingChapter
    ? {
        number: String(editingChapter.number),
        title: editingChapter.title || "",
        pages: editingChapter.pages.join("\n"),
      }
    : undefined;

  const hasStructure =
    selectedCollection &&
    ["animes", "series", "novelas", "mangas"].includes(selectedCollection);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 p-6 shadow-2xl md:p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200 transition z-20"
        >
          <X size={20} />
        </button>

        {/* Tab Headers */}
        {item && hasStructure && (
          <div className="mb-6 flex gap-6 border-b border-zinc-100 pb-2 dark:border-zinc-800 pr-12">
            <button
              onClick={() => setActiveTab("info")}
              className={`pb-2 text-sm font-bold border-b-2 transition-colors ${
                activeTab === "info"
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              Informações Gerais
            </button>
            <button
              onClick={() => setActiveTab("structure")}
              className={`pb-2 text-sm font-bold border-b-2 transition-colors ${
                activeTab === "structure"
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {selectedCollection === "mangas"
                ? "Capítulos"
                : "Temporadas e Episódios"}
            </button>
          </div>
        )}

        {!selectedCollection ? (
          <div>
            <div className="mb-6 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <h2 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">
                Adicionar Nova Mídia
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Selecione qual tipo de mídia você deseja cadastrar no sistema.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {(
                Object.entries(adminCollections) as Array<
                  [AdminCollection, (typeof adminCollections)[AdminCollection]]
                >
              ).map(([colKey, colConfig]) => (
                <button
                  key={colKey}
                  onClick={() => setSelectedCollection(colKey)}
                  className="flex flex-col items-start rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-5 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-zinc-950 transition text-left group active:scale-98"
                >
                  <span className="text-lg font-bold text-zinc-950 dark:text-zinc-50 mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {colConfig.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : activeTab === "info" ? (
          <div>
            {!initialCollection && (
              <button
                onClick={() => setSelectedCollection(null)}
                className="mb-6 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1"
              >
                ← Alterar tipo de mídia
              </button>
            )}

            <AdminMediaForm
              collection={selectedCollection}
              config={config!}
              item={item}
              redirectTo={redirectTo}
              onCancel={handleClose}
              className="w-full bg-transparent border-0 p-0 shadow-none dark:bg-transparent"
            />
          </div>
        ) : (
          /* Tab Structure - Season / Episode / Chapter Management */
          <div className="grid gap-6 md:grid-cols-[280px_1fr] mt-2">
            {/* Left Column: List selection */}
            <div className="flex flex-col gap-4 border-r border-zinc-100 pr-4 dark:border-zinc-800">
              {selectedCollection === "mangas" ? (
                /* Chapter list navigation */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Capítulos ({chapters.length})
                    </h3>
                    <button
                      onClick={() => {
                        setEditingChapter(null);
                        setIsAddingChapter(true);
                      }}
                      className="rounded-full bg-blue-50 p-1 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 transition"
                      title="Novo capítulo"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {chapters.length === 0 ? (
                    <p className="text-xs text-zinc-500">Nenhum capítulo.</p>
                  ) : (
                    <div className="flex flex-col gap-1 max-h-[50vh] overflow-y-auto pr-1">
                      {chapters.map((chap) => {
                        const active = editingChapter?.id === chap.id;
                        return (
                          <button
                            key={chap.id}
                            onClick={() => {
                              setEditingChapter(chap);
                              setIsAddingChapter(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                              active
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                            }`}
                          >
                            <span>Capítulo {chap.number}</span>
                            <Edit2 size={12} className="opacity-60" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Seasons and Episodes Navigation */
                <div className="space-y-6">
                  {/* Season selector header */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Temporadas ({seasons.length})
                      </h3>
                      <button
                        onClick={() => {
                          setEditingSeason(null);
                          setIsAddingSeason(true);
                        }}
                        className="rounded-full bg-blue-50 p-1 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 transition"
                        title="Nova temporada"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    {seasons.length === 0 ? (
                      <p className="text-xs text-zinc-500">
                        Nenhuma temporada.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-[20vh] overflow-y-auto pr-1">
                        {seasons.map((season) => {
                          const active = season.id === selectedSeasonId;
                          return (
                            <button
                              key={season.id}
                              onClick={() => handleSelectSeason(season.id)}
                              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                                active
                                  ? "bg-blue-600 text-white"
                                  : "bg-zinc-50 border border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
                              }`}
                            >
                              <span>T{season.number}</span>
                              <Edit2
                                size={10}
                                className="cursor-pointer opacity-70 hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectSeason(season.id);
                                  setEditingSeason(season);
                                  setIsAddingSeason(false);
                                }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Episode selector header */}
                  {currentSeason && (
                    <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                          Episódios (T{currentSeason.number})
                        </h3>
                        <button
                          onClick={() => {
                            setEditingEpisode(null);
                            setIsAddingEpisode(true);
                          }}
                          className="rounded-full bg-blue-50 p-1 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 transition"
                          title="Novo episódio"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      {currentSeason.episodes.length === 0 ? (
                        <p className="text-xs text-zinc-500">
                          Nenhum episódio cadastrado.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-1 max-h-[35vh] overflow-y-auto pr-1">
                          {currentSeason.episodes.map((ep) => {
                            const active = editingEpisode?.id === ep.id;
                            return (
                              <button
                                key={ep.id}
                                onClick={() => {
                                  setEditingEpisode(ep);
                                  setIsAddingEpisode(false);
                                }}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                                  active
                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                                }`}
                              >
                                <span className="truncate">
                                  EP {ep.number}{" "}
                                  {ep.title ? `- ${ep.title}` : ""}
                                </span>
                                <Edit2
                                  size={10}
                                  className="opacity-60 flex-shrink-0 ml-1"
                                />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Dynamic Form Display */}
            <div className="flex flex-col gap-6">
              {selectedCollection === "mangas" ? (
                /* Chapter Management Forms */
                isAddingChapter ? (
                  <div className="space-y-4">
                    <AdminCrudForm
                      title="Novo Capítulo"
                      description="Adicione um novo capítulo com suas páginas (uma URL por linha)."
                      action={saveChapter}
                      submitLabel="Criar capítulo"
                      fields={chapterFields}
                      hiddenFields={chapterHiddenFields}
                      emptyHint="Após salvar, a página recarregará para refletir as alterações."
                    />
                  </div>
                ) : editingChapter ? (
                  <div className="space-y-4">
                    <AdminCrudForm
                      title={`Editar Capítulo ${editingChapter.number}`}
                      description="Atualize os dados e URLs do capítulo."
                      action={saveChapter}
                      submitLabel="Atualizar capítulo"
                      fields={chapterFields}
                      hiddenFields={chapterHiddenFields}
                      defaults={chapterDefaults}
                    />
                    <form
                      action={deleteChapter}
                      className="flex justify-end pt-2"
                    >
                      <input
                        type="hidden"
                        name="parentId"
                        value={String(item?.id || "")}
                      />
                      <input
                        type="hidden"
                        name="parentSlug"
                        value={String(item?.slug || "")}
                      />
                      <input
                        type="hidden"
                        name="id"
                        value={editingChapter.id}
                      />
                      <input type="hidden" name="redirectTo" value="public" />
                      <button
                        type="submit"
                        className="rounded-full border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-50 dark:border-red-950 dark:text-red-300 dark:hover:bg-red-950/30 flex items-center gap-1.5"
                      >
                        <Trash2 size={14} /> Excluir Capítulo
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-500 text-sm">
                  Selecione um capítulo ao lado para editar ou clique no
                  &quot;+&quot; para adicionar.
                  </div>
                )
              ) : /* Anime / Series / Novel Structure Forms */
              isAddingSeason ? (
                <AdminCrudForm
                  title="Nova Temporada"
                  description="Adicione uma nova temporada ao catálogo."
                  action={saveSeason}
                  submitLabel="Criar temporada"
                  fields={seasonFields}
                  hiddenFields={seasonHiddenFields}
                />
              ) : editingSeason ? (
                <div className="space-y-4">
                  <AdminCrudForm
                    title={`Editar Temporada ${editingSeason.number}`}
                    description="Modifique as propriedades da temporada."
                    action={saveSeason}
                    submitLabel="Atualizar temporada"
                    fields={seasonFields}
                    hiddenFields={seasonHiddenFields}
                    defaults={seasonDefaults}
                  />
                  <form action={deleteSeason} className="flex justify-end pt-2">
                    <input
                      type="hidden"
                      name="collection"
                      value={selectedCollection || ""}
                    />
                    <input
                      type="hidden"
                      name="parentId"
                      value={String(item?.id || "")}
                    />
                    <input
                      type="hidden"
                      name="parentSlug"
                      value={String(item?.slug || "")}
                    />
                    <input type="hidden" name="id" value={editingSeason.id} />
                    <input type="hidden" name="redirectTo" value="public" />
                    <button
                      type="submit"
                      className="rounded-full border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-50 dark:border-red-950 dark:text-red-300 dark:hover:bg-red-950/30 flex items-center gap-1.5"
                    >
                      <Trash2 size={14} /> Excluir Temporada
                    </button>
                  </form>
                </div>
              ) : isAddingEpisode ? (
                <AdminCrudForm
                  title="Novo Episódio"
                  description={`Cadastre um novo episódio para a Temporada ${currentSeason?.number || ""}.`}
                  action={saveEpisode}
                  submitLabel="Criar episódio"
                  fields={episodeFormFields}
                  hiddenFields={episodeHiddenFields}
                />
              ) : editingEpisode ? (
                <div className="space-y-4">
                  <AdminCrudForm
                    title={`Editar Episódio ${editingEpisode.number}`}
                    description={`Atualize os links e players do episódio da Temporada ${currentSeason?.number || ""}.`}
                    action={saveEpisode}
                    submitLabel="Atualizar episódio"
                    fields={episodeFormFields}
                    hiddenFields={episodeHiddenFields}
                    defaults={episodeDefaults}
                  />
                  <form
                    action={deleteEpisode}
                    className="flex justify-end pt-2"
                  >
                    <input
                      type="hidden"
                      name="collection"
                      value={selectedCollection || ""}
                    />
                    <input
                      type="hidden"
                      name="parentId"
                      value={String(item?.id || "")}
                    />
                    <input
                      type="hidden"
                      name="parentSlug"
                      value={String(item?.slug || "")}
                    />
                    <input
                      type="hidden"
                      name="seasonId"
                      value={effectiveSeasonId || ""}
                    />
                    <input type="hidden" name="id" value={editingEpisode.id} />
                    <input type="hidden" name="redirectTo" value="public" />
                    <button
                      type="submit"
                      className="rounded-full border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-50 dark:border-red-950 dark:text-red-300 dark:hover:bg-red-950/30 flex items-center gap-1.5"
                    >
                      <Trash2 size={14} /> Excluir Episódio
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-500 text-sm p-6 text-center">
                  Selecione uma temporada ou episódio ao lado para editar, ou
                  clique nos botões &quot;+&quot; correspondentes para adicionar novos
                  registros.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
