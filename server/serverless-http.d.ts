declare module "serverless-http" {
  import type { Express } from "express";
  import type { IncomingMessage, ServerResponse } from "http";

  type Handler = (req: IncomingMessage, res: ServerResponse) => unknown;

  export default function serverless(
    app: Express,
    options?: Record<string, unknown>
  ): Handler;
}
