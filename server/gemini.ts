import { GoogleGenAI } from "@google/genai";

/** Prefer models with higher free-tier daily quotas than gemini-3.6-flash (often ~20 RPD). */
export const TEXT_MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
] as const;

export function isQuotaError(error: unknown): boolean {
  const err = error as { status?: number; code?: number | string; message?: string };
  const message = String(err?.message || error || "");
  return (
    err?.status === 429 ||
    err?.code === 429 ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("exceeded your current quota") ||
    message.includes("Quota exceeded")
  );
}

export function quotaErrorMessage(error: unknown): string {
  const message = String((error as { message?: string })?.message || error || "");
  const retryMatch = message.match(/retry in ([\d.]+)s/i);
  const wait = retryMatch ? Math.ceil(Number(retryMatch[1])) : null;

  return wait
    ? `Cota gratuita da Gemini esgotada neste momento. Tente de novo em ~${wait}s, ou aguarde o reset diário / ative billing no Google AI Studio.`
    : "Cota gratuita da Gemini esgotada. Aguarde alguns minutos, o reset diário, ou ative um plano pago em https://aistudio.google.com/";
}

type GenerateArgs = Parameters<GoogleGenAI["models"]["generateContent"]>[0];

export async function generateWithModelFallback(
  ai: GoogleGenAI,
  args: Omit<GenerateArgs, "model"> & { model?: string },
  models: readonly string[] = TEXT_MODEL_CANDIDATES
) {
  let lastError: unknown;

  for (const model of models) {
    try {
      return await ai.models.generateContent({
        ...args,
        model,
      });
    } catch (error) {
      lastError = error;
      if (isQuotaError(error) || /not found|NOT_FOUND|404/i.test(String((error as Error)?.message || ""))) {
        console.warn(`[gemini] modelo ${model} falhou, tentando próximo…`, (error as Error)?.message);
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}
