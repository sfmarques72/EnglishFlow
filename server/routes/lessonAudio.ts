import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import {
  buildLessonSummaryPrompt,
  buildTtsPrompt,
  pcmToWavBuffer,
  type LessonSummaryInput,
} from "../lessonAudio.ts";
import { generateWithModelFallback, isQuotaError, quotaErrorMessage } from "../gemini.ts";

export function createLessonAudioRouter(ai: GoogleGenAI | null) {
  const router = Router();

  router.post("/summary", async (req, res) => {
    try {
      const body = req.body as Partial<LessonSummaryInput>;
      const required = [
        "title",
        "topic",
        "level",
        "grammarTitle",
        "grammarStructure",
        "grammarExplanation",
        "grammarExample",
      ] as const;

      for (const key of required) {
        if (typeof body[key] !== "string" || !body[key]!.trim()) {
          return res.status(400).json({ error: `Campo obrigatório ausente: ${key}` });
        }
      }

      const input = body as LessonSummaryInput;

      if (!process.env.GEMINI_API_KEY || !ai) {
        const fallbackScript = buildFallbackScript(input);
        return res.json({
          script: fallbackScript,
          audioBase64: null,
          mimeType: null,
          mode: "text-only",
          message: "Áudio indisponível sem GEMINI_API_KEY. Roteiro gerado localmente.",
        });
      }

      // 1) Generate casual spoken script
      let script = "";
      try {
        const scriptResponse = await generateWithModelFallback(ai, {
          contents: buildLessonSummaryPrompt(input),
          config: {
            temperature: 0.85,
          },
        });
        script = (scriptResponse.text || "").trim();
      } catch (error) {
        if (isQuotaError(error)) {
          script = buildFallbackScript(input);
        } else {
          throw error;
        }
      }
      if (!script) {
        script = buildFallbackScript(input);
      }

      // 2) TTS with Gemini
      let audioBase64: string | null = null;
      let mimeType: string | null = null;
      let mode: "audio" | "text-only" = "text-only";
      let message: string | undefined;

      try {
        const ttsModels = [
          "gemini-2.5-flash-preview-tts",
          "gemini-3.1-flash-tts-preview",
        ];

        let pcmBase64: string | undefined;
        let lastTtsError: unknown;

        for (const model of ttsModels) {
          try {
            const ttsResponse = await ai.models.generateContent({
              model,
              contents: [{ parts: [{ text: buildTtsPrompt(script) }] }],
              config: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: "Puck" },
                  },
                },
              },
            });

            pcmBase64 =
              ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (pcmBase64) break;
          } catch (err) {
            lastTtsError = err;
            console.warn(`TTS model ${model} failed, trying next...`, err);
          }
        }

        if (pcmBase64) {
          const pcm = Buffer.from(pcmBase64, "base64");
          const wav = pcmToWavBuffer(pcm, 24000, 1);
          audioBase64 = wav.toString("base64");
          mimeType = "audio/wav";
          mode = "audio";
        } else {
          message = "TTS não retornou áudio. Você ainda pode ler o roteiro.";
          if (lastTtsError) {
            console.error("All TTS models failed:", lastTtsError);
          }
        }
      } catch (ttsError: any) {
        console.error("Lesson TTS error:", ttsError);
        message =
          ttsError?.message ||
          "Falha no TTS. O roteiro textual ainda está disponível.";
      }

      return res.json({ script, audioBase64, mimeType, mode, message });
    } catch (error: any) {
      console.error("Lesson summary error:", error);
      if (isQuotaError(error)) {
        return res.status(429).json({ error: quotaErrorMessage(error) });
      }
      return res.status(500).json({
        error: error.message || "Falha ao gerar o resumo em áudio da lição.",
      });
    }
  });

  return router;
}

function buildFallbackScript(input: LessonSummaryInput): string {
  return `E aí! Bora de leve com a lição de hoje: ${input.title}. O tema é ${input.topic}. A gente vai treinar ${input.grammarTitle}, tipo assim: ${input.grammarStructure}. Em português bem direto: ${input.grammarExplanation} Um exemplo clássico em inglês: ${input.grammarExample}. Sem pressão, ouve com calma, depois monta suas frases e manda ver no chat. Fechou? Vamos nessa.`;
}
