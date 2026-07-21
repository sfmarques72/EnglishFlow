import { ChatMessage, ErrorLog, InterviewSession, Session } from "../types";

function isPositiveOnlyFeedback(correction: string): boolean {
  const lower = correction.toLowerCase();
  const positiveSignals = [
    "100% correta",
    "frase está correta",
    "está perfeita",
    "nenhum erro",
    "sem erros",
    "excelente esforço",
    "continue assim",
    "muito bem!",
  ];
  const hasFixHint =
    lower.includes("tente") ||
    lower.includes("use ") ||
    lower.includes("lembre") ||
    lower.includes("em vez") ||
    lower.includes("correto seria") ||
    lower.includes("diga") ||
    lower.includes("→") ||
    /\b(was|were|went|didn't|don't|a |an |the )\b/i.test(correction);

  if (hasFixHint) return false;
  return positiveSignals.some((s) => lower.includes(s));
}

export function extractErrorsFromChat(
  messages: ChatMessage[],
  session: Session
): Omit<ErrorLog, "id" | "timestamp">[] {
  const out: Omit<ErrorLog, "id" | "timestamp">[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== "assistant" || !msg.correction?.trim()) continue;
    if (isPositiveOnlyFeedback(msg.correction)) continue;

    const prev = messages[i - 1];
    if (!prev || prev.role !== "user" || !prev.content.trim()) continue;

    out.push({
      sessionId: session.id,
      sessionTitle: `${session.title} (${session.level} · S${session.week}D${session.day})`,
      errorText: prev.content.trim(),
      correctionText: msg.correction.trim(),
      source: "ai-session",
    });
  }

  return out;
}

export function extractErrorsFromInterview(
  interview: InterviewSession
): Omit<ErrorLog, "id" | "timestamp">[] {
  const transcript = interview.transcript || [];
  const out: Omit<ErrorLog, "id" | "timestamp">[] = [];

  for (const line of transcript) {
    if (line.sender !== "candidate" || !line.correction?.trim()) continue;
    out.push({
      sessionId: `interview-${interview.jobTitle}-${interview.timestamp}`,
      sessionTitle: `Entrevista: ${interview.jobTitle} (${interview.difficulty})`,
      errorText: line.text.trim(),
      correctionText: line.correction.trim(),
      source: "ai-interview",
    });
  }

  return out;
}

export function mergeErrorLogs(
  existing: ErrorLog[],
  incoming: Omit<ErrorLog, "id" | "timestamp">[]
): ErrorLog[] {
  const next = [...existing];
  const now = new Date().toLocaleDateString("pt-BR");

  for (const item of incoming) {
    const duplicate = next.some(
      (e) =>
        e.errorText.trim().toLowerCase() === item.errorText.trim().toLowerCase() &&
        e.sessionId === item.sessionId
    );
    if (duplicate) continue;
    next.unshift({
      ...item,
      id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: now,
    });
  }

  return next;
}
