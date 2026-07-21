import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleMe } from "../../server/authHandlers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Use GET." });
  }

  try {
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = "englishflow-dev-secret-change-me";
    }
    return await handleMe(req as any, res as any);
  } catch (error: any) {
    console.error("me error:", error);
    return res.status(500).json({
      error: error?.message || "Falha ao validar sessão.",
    });
  }
}
