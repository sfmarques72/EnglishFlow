import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleMe } from "../../server/authHandlers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Use GET." });
  }
  try {
    return await handleMe(req as any, res as any);
  } catch (error: any) {
    console.error("me error:", error);
    return res.status(500).json({ error: error?.message || "Falha ao validar sessão." });
  }
}
