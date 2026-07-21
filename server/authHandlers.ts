import type { Request, Response } from "express";
import {
  clearAuthCookie,
  hashPassword,
  newUserId,
  getUserFromRequest,
  setAuthCookie,
  signToken,
  validateLoginInput,
  validateRegisterInput,
  verifyPassword,
} from "./auth";
import { createUser, findUserByEmail, toPublicUser } from "./db";

/** Used by Express router and by Vercel per-route serverless functions. */
export async function handleRegister(req: Request, res: Response) {
  const parsed = validateRegisterInput(req.body);
  if (parsed.ok === false) {
    return res.status(400).json({ error: parsed.error });
  }

  const { email, password, name } = parsed;

  if (findUserByEmail(email)) {
    return res.status(409).json({ error: "Já existe uma conta com este e-mail." });
  }

  const user = createUser({
    id: newUserId(),
    email,
    name,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  });

  const token = signToken(user);
  setAuthCookie(res, token);
  return res.status(201).json({ user: toPublicUser(user), token });
}

export async function handleLogin(req: Request, res: Response) {
  const parsed = validateLoginInput(req.body);
  if (parsed.ok === false) {
    return res.status(400).json({ error: parsed.error });
  }

  const { email, password } = parsed;
  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: "E-mail ou senha incorretos." });
  }

  const token = signToken(user);
  setAuthCookie(res, token);
  return res.json({ user: toPublicUser(user), token });
}

export async function handleLogout(_req: Request, res: Response) {
  clearAuthCookie(res);
  return res.json({ ok: true });
}

export async function handleMe(req: Request, res: Response) {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Não autenticado. Faça login para continuar." });
  }
  return res.json({ user });
}
