import { db } from "../db.ts";
import {
  PLACEMENT_QUESTION_BANK,
  type CefrLevel,
  type PlacementQuestion,
} from "./questions.ts";

const QUIZ_SIZE_BY_LEVEL: Record<CefrLevel, number> = {
  A1: 1,
  A2: 1,
  B1: 2,
  B2: 2,
  C1: 2,
  C2: 2,
};

if (db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS placement_quiz_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      question_ids TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function getRecentlyUsedQuestionIds(limitQuizzes = 1): Set<string> {
  if (!db) return new Set();

  const rows = db
    .prepare(
      `SELECT question_ids FROM placement_quiz_log
       ORDER BY id DESC
       LIMIT ?`
    )
    .all(limitQuizzes) as Array<{ question_ids: string }>;

  const used = new Set<string>();
  for (const row of rows) {
    try {
      const ids = JSON.parse(row.question_ids) as string[];
      for (const id of ids) used.add(id);
    } catch {
      // ignore malformed rows
    }
  }
  return used;
}

function pickFromPool(pool: PlacementQuestion[], count: number): PlacementQuestion[] {
  return shuffleInPlace([...pool]).slice(0, count);
}

function shuffleOptions(question: PlacementQuestion): PlacementQuestion {
  const indexed = question.options.map((text, index) => ({ text, index }));
  shuffleInPlace(indexed);
  const correctText = question.options[question.correct];
  const options = indexed.map((item) => item.text);
  const correct = options.indexOf(correctText);
  return {
    ...question,
    options,
    correct,
  };
}

export function buildPlacementQuiz(userId?: string): PlacementQuestion[] {
  const excluded = getRecentlyUsedQuestionIds(1);
  const selected: PlacementQuestion[] = [];

  (Object.keys(QUIZ_SIZE_BY_LEVEL) as CefrLevel[]).forEach((level) => {
    const needed = QUIZ_SIZE_BY_LEVEL[level];
    const levelPool = PLACEMENT_QUESTION_BANK.filter((q) => q.level === level);
    const fresh = levelPool.filter((q) => !excluded.has(q.id));
    const pool = fresh.length >= needed ? fresh : levelPool;
    selected.push(...pickFromPool(pool, needed));
  });

  const quiz = shuffleInPlace(selected).map(shuffleOptions);

  if (db) {
    db.prepare(
      `INSERT INTO placement_quiz_log (user_id, question_ids, created_at)
       VALUES (?, ?, ?)`
    ).run(
      userId ?? null,
      JSON.stringify(quiz.map((q) => q.id)),
      new Date().toISOString()
    );
  }

  return quiz;
}
