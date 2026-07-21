import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../server/app";

let handlerPromise: Promise<(req: VercelRequest, res: VercelResponse) => void> | null =
  null;

async function getHandler() {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      const app = await createApp({ serveFrontend: false });
      return (req: VercelRequest, res: VercelResponse) => {
        app(req as any, res as any);
      };
    })();
  }
  return handlerPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const run = await getHandler();
    return run(req, res);
  } catch (error: any) {
    console.error("API handler boot error:", error);
    return res.status(500).json({
      error: error?.message || "Falha ao iniciar a API no Vercel.",
    });
  }
}
