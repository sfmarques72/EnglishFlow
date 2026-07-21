import fs from "node:fs";
import path from "node:path";
import { Router } from "express";

type BookMeta = {
  id: string;
  title: string;
  author: string;
  gutenbergId: number;
  level: string;
};

/** Mirror of catalog ids used by the API (keep in sync with src/data/reading.ts). */
const BOOK_CATALOG: BookMeta[] = [
  { id: "aesops-fables", title: "Aesop's Fables", author: "Aesop", gutenbergId: 21, level: "A1" },
  { id: "blue-fairy-book", title: "The Blue Fairy Book", author: "Andrew Lang", gutenbergId: 503, level: "A1" },
  { id: "grimms-fairy-tales", title: "Grimm's Fairy Tales", author: "Jacob & Wilhelm Grimm", gutenbergId: 2591, level: "A1" },
  { id: "anderson-fairy", title: "Andersen's Fairy Tales", author: "Hans Christian Andersen", gutenbergId: 1597, level: "A1" },
  { id: "wizard-of-oz", title: "The Wonderful Wizard of Oz", author: "L. Frank Baum", gutenbergId: 55, level: "A2" },
  { id: "alice-wonderland", title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", gutenbergId: 11, level: "A2" },
  { id: "peter-pan", title: "Peter Pan", author: "J. M. Barrie", gutenbergId: 16, level: "A2" },
  { id: "tom-sawyer", title: "The Adventures of Tom Sawyer", author: "Mark Twain", gutenbergId: 74, level: "B1" },
  { id: "black-beauty", title: "Black Beauty", author: "Anna Sewell", gutenbergId: 271, level: "B1" },
  { id: "call-of-the-wild", title: "The Call of the Wild", author: "Jack London", gutenbergId: 215, level: "B1" },
  { id: "sherlock-holmes", title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle", gutenbergId: 1661, level: "B2" },
  { id: "christmas-carol", title: "A Christmas Carol", author: "Charles Dickens", gutenbergId: 46, level: "B2" },
  { id: "treasure-island", title: "Treasure Island", author: "Robert Louis Stevenson", gutenbergId: 120, level: "B2" },
  { id: "pride-prejudice", title: "Pride and Prejudice", author: "Jane Austen", gutenbergId: 1342, level: "C1" },
  { id: "jane-eyre", title: "Jane Eyre", author: "Charlotte Brontë", gutenbergId: 1260, level: "C1" },
  { id: "dracula", title: "Dracula", author: "Bram Stoker", gutenbergId: 345, level: "C1" },
  { id: "frankenstein", title: "Frankenstein", author: "Mary Shelley", gutenbergId: 84, level: "C2" },
  { id: "great-expectations", title: "Great Expectations", author: "Charles Dickens", gutenbergId: 1400, level: "C2" },
  { id: "moby-dick", title: "Moby-Dick", author: "Herman Melville", gutenbergId: 2701, level: "C2" },
];

const CACHE_DIR = path.join(process.cwd(), "data", "books-cache");
const CHARS_PER_PAGE = 1100;

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function cachePath(bookId: string) {
  return path.join(CACHE_DIR, `${bookId}.json`);
}

function stripGutenbergBoilerplate(raw: string): string {
  let text = raw.replace(/^\uFEFF/, "");

  const startMarkers = [
    / \*\*\* START OF (?:THE |THIS )?PROJECT GUTENBERG EBOOK[\s\S]*?\*\*\*/i,
    /\*\*\* START OF (?:THE |THIS )?PROJECT GUTENBERG EBOOK[\s\S]*?\*\*\*/i,
  ];
  for (const re of startMarkers) {
    const m = text.match(re);
    if (m && m.index != null) {
      text = text.slice(m.index + m[0].length);
      break;
    }
  }

  const endMarkers = [
    / \*\*\* END OF (?:THE |THIS )?PROJECT GUTENBERG EBOOK/i,
    /\*\*\* END OF (?:THE |THIS )?PROJECT GUTENBERG EBOOK/i,
    /End of (?:the )?Project Gutenberg/i,
  ];
  for (const re of endMarkers) {
    const m = text.match(re);
    if (m && m.index != null) {
      text = text.slice(0, m.index);
      break;
    }
  }

  return text.replace(/\r\n/g, "\n").trim();
}

function paginateText(text: string, charsPerPage = CHARS_PER_PAGE): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0);

  const pages: string[] = [];
  let buffer = "";

  for (const para of paragraphs) {
    // Skip very short license/noise leftovers
    if (para.length < 40 && /gutenberg|copyright|ebook/i.test(para)) continue;

    if (!buffer) {
      buffer = para;
      continue;
    }

    if (buffer.length + 2 + para.length <= charsPerPage) {
      buffer = `${buffer}\n\n${para}`;
    } else {
      pages.push(buffer);
      // If a single paragraph is huge, hard-split it
      if (para.length > charsPerPage * 1.5) {
        let rest = para;
        while (rest.length > charsPerPage) {
          let cut = rest.lastIndexOf(" ", charsPerPage);
          if (cut < charsPerPage * 0.5) cut = charsPerPage;
          pages.push(rest.slice(0, cut).trim());
          rest = rest.slice(cut).trim();
        }
        buffer = rest;
      } else {
        buffer = para;
      }
    }
  }

  if (buffer.trim()) pages.push(buffer.trim());
  return pages.length ? pages : ["(Empty text)"];
}

async function fetchGutenbergText(gutenbergId: number): Promise<string> {
  const urls = [
    `https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.txt`,
    `https://www.gutenberg.org/files/${gutenbergId}/${gutenbergId}-0.txt`,
    `https://www.gutenberg.org/files/${gutenbergId}/${gutenbergId}.txt`,
  ];

  let lastError: unknown;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "EnglishFlowReader/1.0 (educational; local study app)",
        },
      });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} for ${url}`);
        continue;
      }
      const text = await res.text();
      if (text.length < 500) {
        lastError = new Error(`Text too short from ${url}`);
        continue;
      }
      return text;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Não foi possível baixar o livro do Project Gutenberg.");
}

async function loadBookPages(meta: BookMeta): Promise<{ pages: string[]; pageCount: number }> {
  ensureCacheDir();
  const file = cachePath(meta.id);

  if (fs.existsSync(file)) {
    try {
      const cached = JSON.parse(fs.readFileSync(file, "utf8")) as { pages: string[] };
      if (Array.isArray(cached.pages) && cached.pages.length > 0) {
        return { pages: cached.pages, pageCount: cached.pages.length };
      }
    } catch {
      // rebuild cache
    }
  }

  const raw = await fetchGutenbergText(meta.gutenbergId);
  const cleaned = stripGutenbergBoilerplate(raw);
  const pages = paginateText(cleaned);

  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        id: meta.id,
        title: meta.title,
        author: meta.author,
        gutenbergId: meta.gutenbergId,
        pageCount: pages.length,
        cachedAt: new Date().toISOString(),
        pages,
      },
      null,
      0
    ),
    "utf8"
  );

  return { pages, pageCount: pages.length };
}

export function createReadingRouter() {
  const router = Router();

  router.get("/books", (_req, res) => {
    res.json({
      books: BOOK_CATALOG.map(({ id, title, author, level, gutenbergId }) => ({
        id,
        title,
        author,
        level,
        gutenbergId,
      })),
    });
  });

  router.get("/books/:bookId", async (req, res) => {
    try {
      const meta = BOOK_CATALOG.find((b) => b.id === req.params.bookId);
      if (!meta) {
        return res.status(404).json({ error: "Livro não encontrado no catálogo." });
      }

      const { pages, pageCount } = await loadBookPages(meta);
      return res.json({
        id: meta.id,
        title: meta.title,
        author: meta.author,
        level: meta.level,
        gutenbergId: meta.gutenbergId,
        pageCount,
        pages,
        source: "Project Gutenberg",
      });
    } catch (error: any) {
      console.error("Reading book load error:", error);
      return res.status(502).json({
        error:
          error?.message ||
          "Falha ao carregar o livro. Verifique a internet e tente de novo.",
      });
    }
  });

  return router;
}
