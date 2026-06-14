"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Maximize, Minimize, Layout, Menu } from "lucide-react";

interface MangaReaderProps {
  pages: string[];
  chapterNumber: number;
  chapterTitle?: string | null;
  mangaTitle: string;
  mangaId: string;
  prevChapterUrl?: string | null;
  nextChapterUrl?: string | null;
}

export default function MangaReader({
  pages,
  chapterNumber,
  chapterTitle,
  mangaTitle,
  mangaId,
  prevChapterUrl,
  nextChapterUrl,
}: MangaReaderProps) {
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isWide, setIsWide] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const readerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Toggle Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen: ${e.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case "f":
          toggleFullscreen();
          break;
        case "m":
          setShowControls((prev) => !prev);
          break;
        case "w":
          setIsWide((prev) => !prev);
          break;
        case "arrowright":
          if (nextChapterUrl) {
            router.push(nextChapterUrl);
          }
          break;
        case "arrowleft":
          if (prevChapterUrl) {
            router.push(prevChapterUrl);
          }
          break;
        case "arrowdown":
          e.preventDefault();
          window.scrollBy({ top: 300, behavior: "smooth" });
          break;
        case "arrowup":
          e.preventDefault();
          window.scrollBy({ top: -300, behavior: "smooth" });
          break;
        case "escape":
          if (isFullscreen) setIsFullscreen(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleFullscreen, isFullscreen, nextChapterUrl, prevChapterUrl, router]);

  // Track progress based on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      
      let current = 1;
      for (let i = 0; i < pageRefs.current.length; i++) {
        const el = pageRefs.current[i];
        if (el && el.offsetTop <= scrollPosition) {
          current = i + 1;
        } else {
          break;
        }
      }
      setCurrentPage(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div ref={readerRef} className="min-h-screen bg-black text-zinc-100">
      {/* Overlay Controls */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-zinc-900/90 p-4 backdrop-blur-md transition-transform duration-300 ${
          showControls ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/mangas/${mangaId}`}
              className="rounded-full p-2 hover:bg-zinc-800 transition-colors"
              title="Voltar"
            >
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-blue-500 uppercase tracking-wider">
                {mangaTitle}
              </span>
              <h1 className="text-sm md:text-lg font-bold line-clamp-1">
                Capítulo {chapterNumber} {chapterTitle && `- ${chapterTitle}`}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-1 text-sm font-medium">
              <span>{currentPage}</span>
              <span className="text-zinc-500">/</span>
              <span>{pages.length}</span>
            </div>

            <button
              onClick={() => setIsWide(!isWide)}
              className={`p-2 rounded-lg hover:bg-zinc-800 transition-colors ${isWide ? "text-blue-500" : ""}`}
              title="Alternar Largura (W)"
            >
              <Layout className="h-5 w-5" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setShowControls(!showControls)}
              className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
              title="Esconder Menu (M)"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-blue-600 z-[60] transition-all duration-200"
        style={{ width: `${(currentPage / pages.length) * 100}%` }}
      />

      {/* Main Content */}
      <main 
        className={`mx-auto transition-all duration-300 ${
          isWide ? "max-w-none" : "max-w-4xl"
        } ${showControls ? "pt-24" : "pt-0"}`}
        onClick={() => setShowControls(!showControls)}
      >
        {pages.length === 0 ? (
          <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center p-4">
            <p className="text-zinc-400">Este capítulo ainda não tem páginas processadas.</p>
            <Link
              href={`/mangas/${mangaId}`}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium hover:bg-blue-700 text-white transition-colors"
            >
              Voltar para a obra
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {pages.map((url, index) => (
              <div
                key={index}
                ref={(el) => { pageRefs.current[index] = el; }}
                className="relative w-full flex justify-center bg-black min-h-[50vh]"
              >
                <img
                  src={url}
                  alt={`Página ${index + 1}`}
                  className="h-auto w-full object-contain select-none pointer-events-none"
                  loading={index < 3 ? "eager" : "lazy"}
                />
                {/* Click detection overlay */}
                <div className="absolute inset-0 flex">
                  <div 
                    className="w-1/3 h-full cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.scrollBy({ top: -window.innerHeight * 0.8, behavior: "smooth" });
                    }}
                  />
                  <div className="w-1/3 h-full cursor-pointer" />
                  <div 
                    className="w-1/3 h-full cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="mt-8 border-t border-zinc-800 bg-zinc-900 p-12 text-center text-zinc-500">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-bold text-zinc-100">Fim do Capítulo {chapterNumber}</h3>
            <p>O que você quer ler agora?</p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            {prevChapterUrl && (
              <Link
                href={prevChapterUrl}
                className="flex items-center gap-2 rounded-xl bg-zinc-800 px-8 py-3 font-bold text-zinc-100 hover:bg-zinc-700 transition-all hover:scale-105"
              >
                <ChevronLeft className="h-5 w-5" /> Capítulo Anterior
              </Link>
            )}
            {nextChapterUrl && (
              <Link
                href={nextChapterUrl}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-bold text-white hover:bg-blue-700 transition-all hover:scale-105 shadow-lg shadow-blue-900/20"
              >
                Próximo Capítulo <ChevronRight className="h-5 w-5" />
              </Link>
            )}
          </div>

          <Link
            href={`/mangas/${mangaId}`}
            className="text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors"
          >
            Voltar para a lista de capítulos
          </Link>
        </div>
      </footer>

      {/* Floating Action Buttons (Mobile) */}
      {!showControls && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 md:hidden">
           <button
              onClick={(e) => { e.stopPropagation(); setShowControls(true); }}
              className="p-4 rounded-full bg-blue-600 text-white shadow-xl"
            >
              <Menu className="h-6 w-6" />
            </button>
        </div>
      )}
    </div>
  );
}
