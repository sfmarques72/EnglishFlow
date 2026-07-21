import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { generateWithModelFallback, isQuotaError } from "../gemini.ts";

type MaterialsBody = {
  errorText?: string;
  correctionText?: string;
  grammarTitle?: string;
  grammarStructure?: string;
  level?: string;
  topic?: string;
};

export function createErrorMaterialsRouter(ai: GoogleGenAI | null) {
  const router = Router();

  router.post("/suggest", async (req, res) => {
    try {
      const body = req.body as MaterialsBody;
      const errorText = (body.errorText || "").trim();
      const correctionText = (body.correctionText || "").trim();
      const grammarTitle = (body.grammarTitle || "").trim();
      const grammarStructure = (body.grammarStructure || "").trim();
      const level = (body.level || "A1").trim();
      const topic = (body.topic || "").trim();

      if (!errorText && !grammarTitle) {
        return res.status(400).json({ error: "Informe o erro ou o tópico gramatical." });
      }

      const fallback = buildFallbackMaterials({
        errorText,
        correctionText,
        grammarTitle,
        grammarStructure,
        level,
        topic,
      });

      if (!process.env.GEMINI_API_KEY || !ai) {
        return res.json({ ...fallback, mode: "fallback" });
      }

      const prompt = `Você é um tutor de inglês. Sugira materiais de reforço para um aluno BR.

Contexto:
- Nível: ${level}
- Tema: ${topic || "geral"}
- Gramática: ${grammarTitle || "n/d"}
- Estrutura: ${grammarStructure || "n/d"}
- Frase com erro: ${errorText || "n/d"}
- Correção/dica: ${correctionText || "n/d"}

Retorne APENAS JSON válido (sem markdown) neste formato:
{
  "videos": [
    { "title": "título curto do vídeo útil", "query": "busca youtube em inglês", "reason": "por que ajuda (1 frase em PT)" }
  ],
  "resources": [
    { "title": "nome do material", "type": "artigo|exercício|playlist|site", "query": "termo de busca", "reason": "por que ajuda (1 frase em PT)" }
  ],
  "practicePrompts": ["frase curta de prática 1", "frase 2", "frase 3"]
}

Regras:
- 2 ou 3 vídeos, 2 recursos, 3 practicePrompts.
- Queries em inglês, boas para YouTube/Google.
- Tom prático e claro.`;

      let response;
      try {
        response = await generateWithModelFallback(ai, {
          contents: prompt,
          config: {
            temperature: 0.6,
            responseMimeType: "application/json",
          },
        });
      } catch (error) {
        if (isQuotaError(error)) {
          return res.json({
            ...fallback,
            mode: "fallback",
            message: "Cota da Gemini esgotada — usando links locais.",
          });
        }
        throw error;
      }

      const raw = (response.text || "").trim();
      let parsed: any = null;
      try {
        parsed = JSON.parse(raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim());
      } catch {
        parsed = null;
      }

      if (!parsed) {
        return res.json({ ...fallback, mode: "fallback" });
      }

      const videos = Array.isArray(parsed.videos)
        ? parsed.videos.slice(0, 3).map((v: any) => ({
            title: String(v.title || "Vídeo de reforço"),
            query: String(v.query || grammarTitle || errorText || "english grammar"),
            reason: String(v.reason || "Reforço visual do tópico."),
            url: youtubeSearchUrl(String(v.query || grammarTitle || "english grammar")),
          }))
        : fallback.videos;

      const resources = Array.isArray(parsed.resources)
        ? parsed.resources.slice(0, 3).map((r: any) => ({
            title: String(r.title || "Material extra"),
            type: String(r.type || "site"),
            query: String(r.query || grammarTitle || "english practice"),
            reason: String(r.reason || "Prática adicional."),
            url: googleSearchUrl(String(r.query || grammarTitle || "english practice")),
          }))
        : fallback.resources;

      const practicePrompts = Array.isArray(parsed.practicePrompts)
        ? parsed.practicePrompts.map((p: any) => String(p)).filter(Boolean).slice(0, 4)
        : fallback.practicePrompts;

      return res.json({ videos, resources, practicePrompts, mode: "ai" });
    } catch (error: any) {
      console.error("Error materials API:", error);
      return res.status(500).json({ error: error.message || "Falha ao sugerir materiais." });
    }
  });

  return router;
}

function youtubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function googleSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function buildFallbackMaterials(input: {
  errorText: string;
  correctionText: string;
  grammarTitle: string;
  grammarStructure: string;
  level: string;
  topic: string;
}) {
  const topicQuery =
    input.grammarTitle ||
    input.grammarStructure ||
    input.topic ||
    "English grammar beginners";

  const videos = [
    {
      title: `${input.level} English: ${topicQuery}`,
      query: `${input.level} ${topicQuery} explanation`,
      reason: "Explicação visual do ponto gramatical da sua lição.",
      url: youtubeSearchUrl(`${input.level} ${topicQuery} explanation`),
    },
    {
      title: `Practice: ${topicQuery}`,
      query: `${topicQuery} english exercises spoken`,
      reason: "Vídeos com exemplos falados para fixar a estrutura.",
      url: youtubeSearchUrl(`${topicQuery} english exercises spoken`),
    },
  ];

  const resources = [
    {
      title: `Exercícios online — ${topicQuery}`,
      type: "exercício",
      query: `${topicQuery} english exercises worksheet`,
      reason: "Prática escrita rápida do mesmo tópico.",
      url: googleSearchUrl(`${topicQuery} english exercises worksheet`),
    },
    {
      title: `Guia rápido — ${topicQuery}`,
      type: "artigo",
      query: `${topicQuery} english grammar rules simple`,
      reason: "Leitura curta para revisar a regra com calma.",
      url: googleSearchUrl(`${topicQuery} english grammar rules simple`),
    },
  ];

  const practicePrompts = [
    input.correctionText
      ? `Reescreva corretamente: "${input.errorText || "..."}"`
      : `Crie 2 frases com: ${input.grammarStructure || topicQuery}`,
    `Fale em voz alta usando: ${input.grammarStructure || topicQuery}`,
    `Explique em 1 frase (em PT) o que você errou e como corrigir.`,
  ];

  return { videos, resources, practicePrompts };
}
