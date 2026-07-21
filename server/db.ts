import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";

export type UserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
};

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "englishflow.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

export function findUserByEmail(email: string): UserRow | undefined {
  return db
    .prepare("SELECT id, email, name, password_hash, created_at FROM users WHERE email = ? COLLATE NOCASE")
    .get(email.trim()) as UserRow | undefined;
}

export function findUserById(id: string): UserRow | undefined {
  return db
    .prepare("SELECT id, email, name, password_hash, created_at FROM users WHERE id = ?")
    .get(id) as UserRow | undefined;
}

export function createUser(input: {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}): UserRow {
  db.prepare(
    "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(input.id, input.email.trim().toLowerCase(), input.name.trim(), input.passwordHash, input.createdAt);

  const user = findUserById(input.id);
  if (!user) {
    throw new Error("Failed to create user");
  }
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
