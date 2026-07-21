import type { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";

type ServerlessHandler = (req: VercelRequest, res: VercelResponse) => unknown;

let cached: ServerlessHandler | null = null;

async function getHandler(): Promise<ServerlessHandler> {
  if (cached) return cached;

  const { createApp } = await import("../server/app");
  const app = await createApp({
    // On Vercel this single function serves /api/* and the SPA fallback.
    serveFrontend: true,
  });

  cached = serverless(app) as ServerlessHandler;
  return cached;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const run = await getHandler();
    return await run(req, res);
  } catch (error: any) {
    console.error("Vercel API boot error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: error?.message || "Falha ao iniciar a API no Vercel.",
      });
    }
  }
}
