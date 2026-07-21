export type WritingCorrectionResult = {
  isCorrect: boolean;
  correctedText: string;
  feedback: string;
  issues?: string[];
  mode?: string;
  message?: string;
  error?: string;
};

export async function requestWritingCorrection(input: {
  text: string;
  level?: string;
  prompt?: string;
  template?: string;
  grammarStructure?: string;
  topic?: string;
  context?: "grammar-card" | "exam-writing" | "general";
}): Promise<WritingCorrectionResult> {
  const res = await fetch("/api/writing/correct", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await res.json().catch(() => ({}))) as WritingCorrectionResult;
  if (!res.ok) {
    throw new Error(data.error || "Falha ao corrigir a escrita.");
  }
  return data;
}
