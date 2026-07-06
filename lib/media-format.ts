export type MediaFormat = "SUB" | "DUB" | "SUB_DUB" | "NONE";

/**
 * Determina se a mídia é Legendada, Dublada, Ambos ou Nenhum com base em seus arrays de áudio e legendas.
 */
export function getMediaFormat(
  audio: string[] = [],
  subtitles: string[] = []
): MediaFormat {
  if (!audio || audio.length === 0) {
    return subtitles && subtitles.length > 0 ? "SUB" : "NONE";
  }

  // Regex para identificar Português no áudio (ex: "Portugues", "Portugues(Brasil)", "pt-BR", "Português")
  const ptAudioRegex = /portugues|português|pt[-_]br|dub/i;
  const hasPtAudio = audio.some((lang) => ptAudioRegex.test(lang));

  // Qualquer presença de legendas indica que é legendado (sub)
  const hasSubtitles = subtitles && subtitles.length > 0;

  const isDubbed = hasPtAudio;
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
