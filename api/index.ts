import dotenv from "dotenv";
import type { VercelRequest, VercelResponse } from "@vercel/node";

dotenv.config({ path: ".env.local" });
dotenv.config();

let appPromise: Promise<import("express").Express> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = import("../server/app.ts").then(({ createApp }) =>
      createApp({ serveFrontend: false })
    );
  }
  return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  return app(req as any, res as any);
}
