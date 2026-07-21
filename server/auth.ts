import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { findUserById, toPublicUser, type UserRow } from "./db.ts";

export const AUTH_COOKIE = "englishflow_token";
const JWT_EXPIRES_IN = "7d";
const BCRYPT_ROUNDS = 10;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  createdAt?: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  return bcrypt.compareSync(password, passwordHash);
}

export function signToken(user: UserRow): string {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.created_at,
  };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function setAuthCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
  const parts = [
    `${AUTH_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    `Max-Age=${7 * 24 * 60 * 60}`,
    "SameSite=Lax",
  ];
  if (isProd) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

export function clearAuthCookie(res: Response) {
  const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
  const parts = [
    `${AUTH_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "Max-Age=0",
    "SameSite=Lax",
  ];
  if (isProd) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

export function newUserId(): string {
  return randomUUID();
}

function parseCookieHeader(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
  }
  return out;
}

function readToken(req: Request): string | null {
  const fromParser = req.cookies?.[AUTH_COOKIE];
  if (typeof fromParser === "string" && fromParser.length > 0) {
    return fromParser;
  }

  const fromHeader = parseCookieHeader(
    typeof req.headers.cookie === "string" ? req.headers.cookie : undefined
  )[AUTH_COOKIE];
  if (typeof fromHeader === "string" && fromHeader.length > 0) {
    return fromHeader;
  }

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim();
  }

  return null;
}

export function getUserFromRequest(req: Request): AuthUser | null {
  const token = readToken(req);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;
    // Prefer JWT profile so /me works on Vercel without re-hitting an empty ephemeral DB
    if (payload.email && payload.name && payload.sub) {
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        createdAt: payload.createdAt || new Date().toISOString(),
      };
    }
    const user = findUserById(payload.sub);
    if (!user) return null;
    return toPublicUser(user);
  } catch {
    return null;
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  req.user = getUserFromRequest(req) ?? undefined;
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Não autenticado. Faça login para continuar." });
  }
  req.user = user;
  next();
}

export function validateRegisterInput(body: unknown): {
  ok: true;
  email: string;
  password: string;
  name: string;
} | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Dados inválidos." };
  }

  const { email, password, name } = body as Record<string, unknown>;

  if (typeof email !== "string" || !email.trim()) {
    return { ok: false, error: "Informe um e-mail válido." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return { ok: false, error: "Informe um e-mail válido." };
  }
  if (typeof password !== "string" || password.length < 6) {
    return { ok: false, error: "A senha deve ter pelo menos 6 caracteres." };
  }
  if (typeof name !== "string" || name.trim().length < 2) {
    return { ok: false, error: "Informe seu nome (mínimo 2 caracteres)." };
  }

  return {
    ok: true,
    email: email.trim().toLowerCase(),
    password,
    name: name.trim(),
  };
}

export function validateLoginInput(body: unknown): {
  ok: true;
  email: string;
  password: string;
} | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Dados inválidos." };
  }

  const { email, password } = body as Record<string, unknown>;

  if (typeof email !== "string" || !email.trim()) {
    return { ok: false, error: "Informe seu e-mail." };
  }
  if (typeof password !== "string" || !password) {
    return { ok: false, error: "Informe sua senha." };
  }

  return {
    ok: true,
    email: email.trim().toLowerCase(),
    password,
  };
}
