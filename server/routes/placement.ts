import { Router } from "express";
import { optionalAuth } from "../auth.ts";
import { buildPlacementQuiz } from "../placement/select.ts";

export const placementRouter = Router();

placementRouter.get("/questions", optionalAuth, (_req, res) => {
  try {
    const questions = buildPlacementQuiz(_req.user?.id);
    return res.json({ questions });
  } catch (error: any) {
    console.error("Placement quiz error:", error);
    return res.status(500).json({ error: error.message || "Falha ao montar o teste." });
  }
});
