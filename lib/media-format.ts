export type MediaFormat = "SUB" | "DUB" | "SUB_DUB" | "NONE";

/**
 * Considera dublado quando existe uma faixa de áudio em qualquer idioma além do japonês.
 * A presença de legendas define se também está disponível legendado.
 */
export function getMediaFormat(
  audio: string[] = [],
  subtitles: string[] = []
): MediaFormat {
  if (!audio || audio.length === 0) {
    return subtitles && subtitles.length > 0 ? "SUB" : "NONE";
  }

  // Japonês é a faixa original; qualquer outro idioma conta como dublagem.
  // Suporta nomes em inglês/português e códigos comuns como ja, ja-JP e ja_JP.
  const japaneseAudioRegex = /(^|[^a-z])(ja|japanese|japon[eê]s)([^a-z]|$)/i;
  const hasDubbedAudio = audio.some((lang) => !japaneseAudioRegex.test(lang));

  // Qualquer presença de legendas indica que é legendado (sub)
  const hasSubtitles = subtitles && subtitles.length > 0;

  const isDubbed = hasDubbedAudio;
  const isSubtitled = hasSubtitles;

  if (isDubbed && isSubtitled) {
    return "SUB_DUB";
  }
  if (isDubbed) {
    return "DUB";
  }
  if (isSubtitled) {
    return "SUB";
  }

  return "NONE";
}

/**
 * Retorna o texto formatado para exibição do badge.
 */
export function getMediaFormatLabel(format: MediaFormat): string {
  const labels: Record<MediaFormat, string> = {
    SUB: "LEG",
    DUB: "DUB",
    SUB_DUB: "SUB | DUB",
    NONE: "",
  };
  return labels[format];
}
