"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useTranslations } from "next-intl";

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com"
    ) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      const match = parsed.pathname.match(/^\/(?:embed|shorts|v|live)\/([^/?]+)/);
      if (match) return match[1];
    }
  } catch {
    return null;
  }

  return null;
}

interface YTPlayerLike {
  destroy: () => void;
  mute: () => void;
  unMute: () => void;
  playVideo: () => void;
}

interface YTApiLike {
  Player: new (
    el: HTMLElement,
    options: Record<string, unknown>,
  ) => YTPlayerLike;
}

let ytApiPromise: Promise<YTApiLike | null> | null = null;

function loadYouTubeAPI(): Promise<YTApiLike | null> {
  const w = window as unknown as {
    YT?: YTApiLike;
    onYouTubeIframeAPIReady?: () => void;
  };
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const previous = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve(w.YT ?? null);
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  }
  return ytApiPromise;
}

const coverStyle: React.CSSProperties = {
  width: "max(100%, 177.7778vh)",
  aspectRatio: "16 / 9",
};

interface TrailerHeroBackgroundProps {
  bannerUrl?: string | null;
  imageUrl?: string | null;
  title: string;
  trailerUrl?: string | null;
}

export default function TrailerHeroBackground({
  bannerUrl,
  imageUrl,
  title,
  trailerUrl,
}: TrailerHeroBackgroundProps) {
  const t = useTranslations("Buttons");
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayerLike | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setIsLargeScreen(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const src = bannerUrl || imageUrl;
  const youtubeId = trailerUrl ? extractYouTubeId(trailerUrl) : null;
  const videoFileUrl =
    trailerUrl && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trailerUrl)
      ? trailerUrl
      : null;
  const showVideo = isLargeScreen && (youtubeId || videoFileUrl);

  useEffect(() => {
    if (!isLargeScreen || !youtubeId || !playerHostRef.current) return;
    let cancelled = false;

    loadYouTubeAPI().then((YT) => {
      if (cancelled || !YT || !playerHostRef.current) return;
      playerRef.current = new YT.Player(playerHostRef.current, {
        width: "100%",
        height: "100%",
        videoId: youtubeId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          loop: 1,
          playlist: youtubeId,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady: (event: { target: YTPlayerLike }) => {
            event.target.mute();
            event.target.playVideo();
          },
          onStateChange: (event: { data: number }) => {
            if (event.data === 1) setVideoReady(true);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {}
      playerRef.current = null;
    };
  }, [isLargeScreen, youtubeId]);

  const handleToggleMute = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
      } else {
        playerRef.current.mute();
      }
      setIsMuted(!isMuted);
      return;
    }
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <>
      {src && (
        <>
          <Image
            src={src}
            alt=""
            fill
            sizes="100vw"
            className="object-cover blur-xl opacity-40 scale-105"
            priority
          />
          <Image
            src={src}
            alt={title}
            fill
            sizes="100vw"
            className="object-cover object-top opacity-100"
            priority
          />
        </>
      )}
      {showVideo && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 overflow-hidden transition-opacity duration-700 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
        >
          {youtubeId ? (
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={coverStyle}
            >
              <div
                ref={playerHostRef}
                className="h-full w-full [&>iframe]:pointer-events-none [&>iframe]:border-0 [&>iframe]:h-full [&>iframe]:w-full"
              />
            </div>
          ) : (
            <video
              ref={videoRef}
              src={videoFileUrl ?? undefined}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onCanPlay={() => setVideoReady(true)}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
          )}
        </div>
      )}
      {showVideo && videoReady && (
        <button
          type="button"
          onClick={handleToggleMute}
          aria-label={isMuted ? t("unmute") : t("mute")}
          title={isMuted ? t("unmute") : t("mute")}
          className="absolute top-8 right-6 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/90 text-white shadow-lg backdrop-blur-md transition hover:bg-zinc-800 active:scale-95"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      )}
    </>
  );
}
