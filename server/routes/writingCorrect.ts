import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { generateWithModelFallback, isQuotaError, quotaErrorMessage } from "../gemini.ts";

type CorrectBody = {
  text?: string;
  level?: string;
  prompt?: string;
  template?: string;
  grammarStructure?: string;
  topic?: string;
  context?: "grammar-card" | "exam-writing" | "general";
};

export function createWritingCorrectRouter(ai: GoogleGenAI | null) {
  const router = Router();

  router.post("/correct", async (req, res) => {
    try {
      const body = req.body as CorrectBody;
      const text = (body.text || "").trim();
      if (!text || text.length < 3) {
        return res.status(400).json({ error: "Escreva uma frase antes de pedir a correção." });
      }

      const level = (body.level || "A1").trim();
      const prompt = (body.prompt || "").trim();
      const template = (body.template || "").trim();
      const grammarStructure = (body.grammarStructure || "").trim();
      const topic = (body.topic || "").trim();
      const context = body.context || "general";

      const fallback = buildLocalCorrection(text, { template, grammarStructure });

      if (!process.env.GEMINI_API_KEY || !ai) {
        return res.json({ ...fallback, mode: "fallback" });
      }

      const systemPrompt = `Você é Sarah, tutora de inglês para alunos brasileiros (nível ${level}).
Corrija a escrita do aluno com cuidado e clareza.

Contexto: ${context}
Tema: ${topic || "n/d"}
Prompt da atividade: ${prompt || "n/d"}
Modelo sugerido: ${template || "n/d"}
Estrutura gramatical alvo: ${grammarStructure || "n/d"}

Texto do aluno:
"""
${text}
"""

Retorne APENAS JSON válido (sem markdown):
{
  "isCorrect": true|false,
  "correctedText": "versão correta em inglês",
  "feedback": "explicação curta em português (1-3 frases), começando com 💡 se houver erro",
  "issues": ["erro curto 1", "erro curto 2"]
}

Regras:
- Se estiver correto (ou só erros minúsculos de pontuação), isCorrect=true e feedback positivo em PT.
- correctedText deve ser inglês natural e adequado ao nível ${level}.
- feedback SEMPRE em português.
- issues vazio se não houver problemas.
- Não invente conteúdo longo; preserve a intenção do aluno.`;

      let response;
      try {
        response = await generateWithModelFallback(ai, {
          contents: systemPrompt,
          config: {
            temperature: 0.35,
            responseMimeType: "application/json",
          },
        });
      } catch (error) {
        if (isQuotaError(error)) {
          return res.json({
            ...fallback,
            mode: "fallback",
            message: quotaErrorMessage(error),
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

      if (!parsed || typeof parsed.correctedText !== "string") {
        return res.json({ ...fallback, mode: "fallback" });
      }

      return res.json({
        isCorrect: Boolean(parsed.isCorrect),
        correctedText: String(parsed.correctedText).trim() || text,
        feedback: String(parsed.feedback || fallback.feedback).trim(),
        issues: Array.isArray(parsed.issues)
          ? parsed.issues.map((i: unknown) => String(i)).filter(Boolean).slice(0, 5)
          : fallback.issues,
        mode: "ai",
      });
    } catch (error: any) {
      console.error("Writing correct API:", error);
      return res.status(500).json({ error: error.message || "Falha ao corrigir a escrita." });
    }
  });

  return router;
}

function buildLocalCorrection(
  text: string,
  opts: { template?: string; grammarStructure?: string }
) {
  const issues: string[] = [];
  let corrected = text.trim();

  // Common beginner fixes
  corrected = corrected
    .replace(/\bi am go\b/gi, "I go")
    .replace(/\bi has\b/gi, "I have")
    .replace(/\bhe go\b/gi, "he goes")
    .replace(/\bshe go\b/gi, "she goes")
    .replace(/\bi yesterday go\b/gi, "Yesterday I went")
    .replace(/\bi have (\d+) years?\b/gi, "I am $1 years old")
    .replace(/\bi work as developer\b/gi, "I work as a developer")
    .replace(/\bi like study\b/gi, "I like studying");

  // Capitalize first letter
  if (corrected.length > 0) {
    corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
  }
  if (!/[.!?]$/.test(corrected)) {
    corrected += ".";
  }

  const isCorrect = corrected.replace(/[.!?]$/, "").toLowerCase() === text.replace(/[.!?]$/, "").trim().toLowerCase();

  if (!isCorrect) {
    if (/i have \d+ years/i.test(text)) issues.push("Idade usa 'I am … years old'");
    if (/like study\b/i.test(text)) issues.push("Após like use -ing: like studying");
    if (/as developer\b/i.test(text)) issues.push("Artigo 'a/an' antes de profissão");
  }

  return {
    isCorrect,
    correctedText: corrected,
    feedback: isCorrect
      ? "💡 Dica de Inglês: Excelente! Sua frase está correta."
      : `💡 Dica de Inglês: Versão ajustada: "${corrected}"${
          opts.grammarStructure ? ` Lembre da estrutura: ${opts.grammarStructure}.` : ""
        }`,
    issues,
  };
}
