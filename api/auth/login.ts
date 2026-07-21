import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleLogin } from "../../server/authHandlers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  try {
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = "englishflow-dev-secret-change-me";
    }
    return await handleLogin(req as any, res as any);
  } catch (error: any) {
    console.error("login error:", error);
    return res.status(500).json({
      error: error?.message || "Falha ao entrar.",
    });
  }
}
