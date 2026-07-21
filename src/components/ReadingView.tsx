import React, { useEffect, useState } from "react";
import { BookOpen, Clock, X, ChevronLeft, ChevronRight, Library, Loader2, ExternalLink } from "lucide-react";
import { ReadingBookMeta } from "../types";
import { getBooksForLevel } from "../data/reading";

interface ReadingViewProps {
  selectedLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
}

type LoadedBook = {
  id: string;
  title: string;
  author: string;
  pageCount: number;
  pages: string[];
  gutenbergId?: number;
};

export const ReadingView: React.FC<ReadingViewProps> = ({ selectedLevel }) => {
  const books = getBooksForLevel(selectedLevel);
  const [activeMeta, setActiveMeta] = useState<ReadingBookMeta | null>(null);
  const [loaded, setLoaded] = useState<LoadedBook | null>(null);
  const [loadingBook, setLoadingBook] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageJump, setPageJump] = useState("");

  useEffect(() => {
    setActiveMeta(null);
    setLoaded(null);
    setLoadError(null);
    setPageIndex(0);
  }, [selectedLevel]);

  useEffect(() => {
    if (!loaded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeBook();
        return;
      }
      if (e.key === "ArrowRight") {
        setPageIndex((p) => Math.min(loaded.pageCount - 1, p + 1));
      }
      if (e.key === "ArrowLeft") {
        setPageIndex((p) => Math.max(0, p - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loaded]);

  const openBook = async (book: ReadingBookMeta) => {
    setActiveMeta(book);
    setLoaded(null);
    setLoadError(null);
    setPageIndex(0);
    setLoadingBook(true);

    try {
      const res = await fetch(`/api/reading/books/${book.id}`, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível carregar o livro.");
      }
      if (!Array.isArray(data.pages) || data.pages.length === 0) {
        throw new Error("O livro veio vazio. Tente novamente.");
      }
      setLoaded({
        id: data.id,
        title: data.title || book.title,
        author: data.author || book.author,
        pageCount: data.pageCount || data.pages.length,
        pages: data.pages,
        gutenbergId: data.gutenbergId || book.gutenbergId,
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Falha ao baixar o livro.");
    } finally {
      setLoadingBook(false);
    }
  };

  const closeBook = () => {
    setActiveMeta(null);
    setLoaded(null);
    setLoadError(null);
    setLoadingBook(false);
    setPageIndex(0);
    setPageJump("");
  };

  const goToTypedPage = () => {
    if (!loaded) return;
    const n = Number.parseInt(pageJump, 10);
    if (!Number.isFinite(n)) return;
    const idx = Math.min(loaded.pageCount, Math.max(1, n)) - 1;
    setPageIndex(idx);
    setPageJump("");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Library size={12} />
          Sessão de Leitura
        </p>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
          Livros reais em inglês · nível {selectedLevel}
        </h2>
        <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
          Clássicos de domínio público (Project Gutenberg), com o texto completo dividido em muitas
          páginas. Em A1 você só vê livros deste nível.
        </p>
      </div>

      {books.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-14 text-center space-y-2">
          <BookOpen className="mx-auto text-slate-300" size={28} />
          <p className="text-sm font-bold text-slate-700">Nenhum livro neste nível ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {books.map((book) => (
            <button
              key={book.id}
              type="button"
              onClick={() => void openBook(book)}
              className="text-left rounded-3xl border border-slate-200 bg-white p-5 shadow-xs hover:border-teal-300 hover:shadow-md transition-all cursor-pointer group space-y-4"
            >
              <div
                className="h-36 rounded-2xl flex items-end p-4 text-white relative overflow-hidden"
                style={{
                  background: `linear-gradient(145deg, hsl(${book.coverHue} 42% 38%), hsl(${book.coverHue} 55% 22%))`,
                }}
              >
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%)]" />
                <div className="relative space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/15 px-2 py-0.5 rounded-md">
                    {book.level} · real book
                  </span>
                  <h3 className="text-base font-extrabold leading-snug">{book.title}</h3>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  {book.author}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{book.summary}</p>
                <p className="text-[11px] font-bold text-teal-700 flex items-center gap-1">
                  <Clock size={12} />
                  ~{book.minutes} min · texto completo
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeMeta && (
        <div
          className="fixed inset-0 z-[80] bg-slate-950/55 backdrop-blur-[2px] flex items-center justify-center p-4 md:p-8"
          onClick={closeBook}
          role="dialog"
          aria-modal="true"
          aria-label={`Lendo ${activeMeta.title}`}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] bg-white rounded-[28px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-100 bg-gradient-to-r from-teal-50/80 to-white">
              <div className="min-w-0 space-y-1">
                <p className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                  Leitura · {activeMeta.level} · Project Gutenberg
                </p>
                <h3 className="text-lg font-extrabold text-slate-900 truncate">
                  {loaded?.title || activeMeta.title}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {loaded
                    ? `Página ${pageIndex + 1} de ${loaded.pageCount}`
                    : loadingBook
                      ? "Baixando livro completo…"
                      : activeMeta.author}
                </p>
              </div>
              <button
                type="button"
                onClick={closeBook}
                className="shrink-0 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                title="Fechar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grow overflow-y-auto px-7 md:px-10 py-8 bg-gradient-to-b from-slate-50/50 to-white min-h-[280px]">
              {loadingBook && (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <Loader2 className="animate-spin text-teal-600" size={28} />
                  <p className="text-sm font-bold text-slate-700">Carregando livro real…</p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Na primeira abertura baixamos o texto completo do Project Gutenberg e dividimos em
                    páginas. Depois fica em cache no servidor.
                  </p>
                </div>
              )}

              {loadError && (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 space-y-2">
                  <p className="font-bold">Não deu para abrir o livro</p>
                  <p className="text-xs">{loadError}</p>
                  <button
                    type="button"
                    onClick={() => activeMeta && void openBook(activeMeta)}
                    className="text-xs font-bold underline cursor-pointer"
                  >
                    Tentar de novo
                  </button>
                </div>
              )}

              {loaded && !loadingBook && (
                <p className="text-[16px] md:text-[17px] leading-[1.85] text-slate-800 font-medium whitespace-pre-wrap">
                  {loaded.pages[pageIndex]}
                </p>
              )}
            </div>

            {loaded && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                    disabled={pageIndex === 0}
                    className={`flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border ${
                      pageIndex === 0
                        ? "text-slate-300 border-slate-100 cursor-not-allowed"
                        : "text-slate-700 border-slate-200 hover:bg-white cursor-pointer"
                    }`}
                  >
                    <ChevronLeft size={14} />
                    Anterior
                  </button>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={loaded.pageCount}
                      value={pageJump}
                      onChange={(e) => setPageJump(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") goToTypedPage();
                      }}
                      placeholder={`${pageIndex + 1}`}
                      className="w-16 text-center text-xs border border-slate-200 rounded-lg py-1.5 bg-white"
                    />
                    <button
                      type="button"
                      onClick={goToTypedPage}
                      className="text-[10px] font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
                    >
                      Ir
                    </button>
                    <span className="text-[10px] text-slate-400 font-bold">/ {loaded.pageCount}</span>
                  </div>

                  {pageIndex < loaded.pageCount - 1 ? (
                    <button
                      type="button"
                      onClick={() => setPageIndex((p) => Math.min(loaded.pageCount - 1, p + 1))}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                    >
                      Próxima
                      <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={closeBook}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl bg-teal-500 text-slate-950 hover:bg-teal-400 cursor-pointer"
                    >
                      Concluir
                    </button>
                  )}
                </div>

                {loaded.gutenbergId && (
                  <a
                    href={`https://www.gutenberg.org/ebooks/${loaded.gutenbergId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-teal-700"
                  >
                    Fonte: Project Gutenberg #{loaded.gutenbergId}
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
