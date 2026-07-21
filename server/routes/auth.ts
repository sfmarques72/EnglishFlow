import { Router } from "express";
import {
  clearAuthCookie,
  hashPassword,
  newUserId,
  requireAuth,
  setAuthCookie,
  signToken,
  validateLoginInput,
  validateRegisterInput,
  verifyPassword,
} from "../auth.ts";
import { createUser, findUserByEmail, toPublicUser } from "../db.ts";

export const authRouter = Router();

authRouter.post("/register", (req, res) => {
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
});

authRouter.post("/login", (req, res) => {
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
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  return res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req, res) => {
  return res.json({ user: req.user });
});
