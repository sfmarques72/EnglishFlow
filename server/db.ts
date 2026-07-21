import fs from "fs";
import path from "path";
import { createRequire } from "module";

export type UserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
};

type DbLike = {
  prepare: (sql: string) => {
    get: (...params: unknown[]) => unknown;
    run: (...params: unknown[]) => unknown;
    all: (...params: unknown[]) => unknown;
  };
  exec: (sql: string) => void;
};

const isVercel = Boolean(process.env.VERCEL);
const memoryUsers = new Map<string, UserRow>();
export let db: DbLike | null = null;

try {
  const require = createRequire(import.meta.url);
  const { DatabaseSync } = require("node:sqlite") as {
    DatabaseSync: new (path: string) => DbLike;
  };

  const dataDir = isVercel
    ? path.join("/tmp", "englishflow-data")
    : path.join(process.cwd(), "data");
  const dbPath = path.join(dataDir, "englishflow.db");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const sqlite = new DatabaseSync(dbPath);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  db = sqlite;

  const rows = db
    .prepare("SELECT id, email, name, password_hash, created_at FROM users")
    .all() as UserRow[];
  for (const row of rows) {
    memoryUsers.set(row.email.toLowerCase(), row);
    memoryUsers.set(`id:${row.id}`, row);
  }
} catch (err) {
  console.warn("[db] SQLite unavailable — using in-memory user store.", err);
  db = null;
}

export function findUserByEmail(email: string): UserRow | undefined {
  const key = email.trim().toLowerCase();
  const mem = memoryUsers.get(key);
  if (mem) return mem;
  if (!db) return undefined;

  try {
    const row = db
      .prepare(
        "SELECT id, email, name, password_hash, created_at FROM users WHERE email = ? COLLATE NOCASE"
      )
      .get(email.trim()) as UserRow | undefined;
    if (row) {
      memoryUsers.set(row.email.toLowerCase(), row);
      memoryUsers.set(`id:${row.id}`, row);
    }
    return row;
  } catch {
    return undefined;
  }
}

export function findUserById(id: string): UserRow | undefined {
  const mem = memoryUsers.get(`id:${id}`);
  if (mem) return mem;
  if (!db) return undefined;

  try {
    const row = db
      .prepare("SELECT id, email, name, password_hash, created_at FROM users WHERE id = ?")
      .get(id) as UserRow | undefined;
    if (row) {
      memoryUsers.set(row.email.toLowerCase(), row);
      memoryUsers.set(`id:${row.id}`, row);
    }
    return row;
  } catch {
    return undefined;
  }
}

export function createUser(input: {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}): UserRow {
  const email = input.email.trim().toLowerCase();
  const user: UserRow = {
    id: input.id,
    email,
    name: input.name.trim(),
    password_hash: input.passwordHash,
    created_at: input.createdAt,
  };

  if (db) {
    try {
      db.prepare(
        "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)"
      ).run(user.id, email, user.name, user.password_hash, user.created_at);
    } catch (err: any) {
      console.warn("SQLite insert warning:", err?.message || err);
    }
  }

  memoryUsers.set(email, user);
  memoryUsers.set(`id:${user.id}`, user);
  return user;
}

export function toPublicUser(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.created_at,
  };
}
