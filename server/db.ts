import fs from "fs";
import path from "path";

export type UserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
};

type StoreFile = {
  users: UserRow[];
  placementLog: Array<{ user_id: string | null; question_ids: string; created_at: string }>;
};

const isVercel = Boolean(process.env.VERCEL);
const dataDir = isVercel ? "/tmp" : path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "englishflow-store.json");

const memoryUsers = new Map<string, UserRow>();
let placementLog: StoreFile["placementLog"] = [];

function ensureDir() {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  } catch {
    // ignore
  }
}

function readStore(): StoreFile {
  try {
    if (!fs.existsSync(storePath)) return { users: [], placementLog: [] };
    const raw = fs.readFileSync(storePath, "utf8");
    const parsed = JSON.parse(raw) as StoreFile;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      placementLog: Array.isArray(parsed.placementLog) ? parsed.placementLog : [],
    };
  } catch {
    return { users: [], placementLog: [] };
  }
}

function writeStore() {
  try {
    ensureDir();
    const users = [...memoryUsers.values()].filter((u, i, arr) => {
      // Map has email + id: keys; keep unique by id
      return arr.findIndex((x) => x.id === u.id) === i;
    });
    // Deduplicate properly
    const byId = new Map<string, UserRow>();
    for (const u of memoryUsers.values()) byId.set(u.id, u);
    const payload: StoreFile = {
      users: [...byId.values()],
      placementLog: placementLog.slice(-50),
    };
    fs.writeFileSync(storePath, JSON.stringify(payload), "utf8");
  } catch (err) {
    console.warn("[db] failed to persist store:", err);
  }
}

function hydrate() {
  const store = readStore();
  placementLog = store.placementLog;
  for (const row of store.users) {
    memoryUsers.set(row.email.toLowerCase(), row);
    memoryUsers.set(`id:${row.id}`, row);
  }
}

hydrate();

/** Compatibility shim for placement module (old sqlite API). */
export const db = {
  exec(_sql: string) {
    // no-op — schema is JSON now
  },
  prepare(sql: string) {
    return {
      get(...params: unknown[]) {
        if (sql.includes("WHERE email")) {
          return findUserByEmail(String(params[0] || ""));
        }
        if (sql.includes("WHERE id")) {
          return findUserById(String(params[0] || ""));
        }
        return undefined;
      },
      run(...params: unknown[]) {
        if (sql.includes("INSERT INTO users")) {
          // handled by createUser
          return;
        }
        if (sql.includes("INSERT INTO placement_quiz_log")) {
          placementLog.push({
            user_id: (params[0] as string | null) ?? null,
            question_ids: String(params[1] || "[]"),
            created_at: String(params[2] || new Date().toISOString()),
          });
          writeStore();
        }
      },
      all(...params: unknown[]) {
        if (sql.includes("placement_quiz_log")) {
          const limit = Number(params[0] || 1);
          return placementLog
            .slice()
            .reverse()
            .slice(0, limit)
            .map((row) => ({ question_ids: row.question_ids }));
        }
        if (sql.includes("FROM users")) {
          const byId = new Map<string, UserRow>();
          for (const u of memoryUsers.values()) byId.set(u.id, u);
          return [...byId.values()];
        }
        return [];
      },
    };
  },
};

export function findUserByEmail(email: string): UserRow | undefined {
  return memoryUsers.get(email.trim().toLowerCase());
}

export function findUserById(id: string): UserRow | undefined {
  return memoryUsers.get(`id:${id}`);
}

export function createUser(input: {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}): UserRow {
  const email = input.email.trim().toLowerCase();
  if (findUserByEmail(email)) {
    throw new Error("Já existe uma conta com este e-mail.");
  }

  const user: UserRow = {
    id: input.id,
    email,
    name: input.name.trim(),
    password_hash: input.passwordHash,
    created_at: input.createdAt,
  };

  memoryUsers.set(email, user);
  memoryUsers.set(`id:${user.id}`, user);
  writeStore();
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
