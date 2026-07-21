import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleRegister } from "../../server/authHandlers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }
  try {
    return await handleRegister(req as any, res as any);
  } catch (error: any) {
    console.error("register error:", error);
    return res.status(500).json({ error: error?.message || "Falha ao criar conta." });
  }
}
