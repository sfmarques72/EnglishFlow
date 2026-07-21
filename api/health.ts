import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    service: "englishflow",
    vercel: Boolean(process.env.VERCEL),
    hasJwt: Boolean(process.env.JWT_SECRET),
    hasGemini: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
}
