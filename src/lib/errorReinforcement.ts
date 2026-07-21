import { ErrorLog, Session } from "../types";
import { STUDY_SCHEDULE, getSessionsForLevel } from "../data/schedule";

export type PhraseSuggestion = {
  errorId: string;
  sourceError: string;
  correctModel: string;
  practiceLines: string[];
  tip: string;
};

export type ReinforcementMaterial = {
  errorId: string;
  sessionId: string;
  sessionTitle: string;
  level?: string;
  topic?: string;
  grammarTitle: string;
  grammarStructure: string;
  grammarExplanation: string;
  grammarExample: string;
  practiceCards: Array<{ prompt: string; template: string; translation: string }>;
  warmupPrompts: string[];
  videoLinks: Array<{ title: string; url: string; reason: string }>;
  webLinks: Array<{ title: string; url: string; reason: string }>;
};

function cleanCorrection(text: string): string {
  return text
    .replace(/💡.*$/u, "")
    .replace(/\(.*?\)/g, "")
    .replace(/^Dica de Inglês:\s*/i, "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

function findSessionForError(error: ErrorLog): Session | undefined {
  const direct = STUDY_SCHEDULE.find((s) => s.id === error.sessionId);
  if (direct) return direct;

  const levelMatch = error.sessionTitle.match(/\b(A1|A2|B1|B2|C1|C2)\b/);
  if (levelMatch) {
    const level = levelMatch[1] as Session["level"];
    const levelSessions = getSessionsForLevel(level);
    const byId = levelSessions.find((s) => s.id === error.sessionId);
    if (byId) return byId;
    return levelSessions[0];
  }

  return STUDY_SCHEDULE[0];
}

function buildPracticeLines(errorText: string, correction: string): string[] {
  const model = cleanCorrection(correction) || correction.trim();
  const lines = [
    `Repita em voz alta: "${model}"`,
    `Reescreva de memória (sem olhar): comece com a mesma ideia de "${errorText.slice(0, 40)}${errorText.length > 40 ? "…" : ""}"`,
  ];

  const lower = `${errorText} ${correction}`.toLowerCase();

  if (lower.includes("went") || lower.includes("yesterday") || lower.includes("past")) {
    lines.push('Varie no passado: "Yesterday I ___ to the park." → went');
  } else if (lower.includes("have") && lower.includes("years")) {
    lines.push('Pratique idade com To Be: "I am 25 years old." / "She is 30 years old."');
  } else if (lower.includes("a developer") || lower.includes("as a ")) {
    lines.push('Artigo com profissão: "I work as a teacher." / "She is an engineer."');
  } else if (lower.includes("like") && (lower.includes("study") || lower.includes("studying"))) {
    lines.push('Depois de like: "I like studying English." ou "I like to study English."');
  } else if (lower.includes("there is") || lower.includes("there are")) {
    lines.push('Troque singular/plural: "There is a book." / "There are two books."');
  } else {
    lines.push(`Crie uma frase nova usando a mesma estrutura correta de: "${model}"`);
  }

  return lines.slice(0, 3);
}

function tipForError(errorText: string, correction: string): string {
  const lower = `${errorText} ${correction}`.toLowerCase();
  if (lower.includes("went") || lower.includes("past simple")) {
    return "No passado simples, verbos irregulares mudam de forma (go → went).";
  }
  if (lower.includes("years old") || lower.includes("i am")) {
    return "Em inglês, idade usa o verbo to be (I am…), não to have.";
  }
  if (lower.includes("as a") || lower.includes("article")) {
    return "Antes de profissões no singular, use a/an (a developer, an artist).";
  }
  if (lower.includes("like")) {
    return "Após like/love/hate, use gerúndio (-ing) ou to + verbo.";
  }
  return "Compare o erro com o ajuste e diga a frase correta 3 vezes em voz alta.";
}

export function buildPhraseSuggestions(errors: ErrorLog[]): PhraseSuggestion[] {
  return errors.map((err) => ({
    errorId: err.id,
    sourceError: err.errorText,
    correctModel: cleanCorrection(err.correctionText) || err.correctionText,
    practiceLines: buildPracticeLines(err.errorText, err.correctionText),
    tip: tipForError(err.errorText, err.correctionText),
  }));
}

export function buildReinforcementMaterials(errors: ErrorLog[]): ReinforcementMaterial[] {
  const seen = new Set<string>();
  const materials: ReinforcementMaterial[] = [];

  for (const err of errors) {
    const session = findSessionForError(err);
    if (!session) continue;

    const key = session.id;
    if (seen.has(key)) continue;
    seen.add(key);

    const grammarQuery = `${session.level} ${session.grammarTitle} english`;
    const topicQuery = `${session.topic} english conversation ${session.level}`;

    materials.push({
      errorId: err.id,
      sessionId: session.id,
      sessionTitle: `${session.title} (${session.level} · S${session.week}D${session.day})`,
      level: session.level,
      topic: session.topic,
      grammarTitle: session.grammarTitle,
      grammarStructure: session.grammarStructure,
      grammarExplanation: session.grammarExplanation,
      grammarExample: session.grammarExample,
      practiceCards: session.grammarCards.slice(0, 3).map((c) => ({
        prompt: c.prompt,
        template: c.template,
        translation: c.translation,
      })),
      warmupPrompts: session.warmupPrompts.slice(0, 2),
      videoLinks: [
        {
          title: `YouTube: ${session.grammarTitle}`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(grammarQuery)}`,
          reason: "Vídeos explicando a gramática desta aula.",
        },
        {
          title: `YouTube: conversação — ${session.topic}`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topicQuery)}`,
          reason: "Prática falada no mesmo tema da lição.",
        },
      ],
      webLinks: [
        {
          title: `Exercícios: ${session.grammarTitle}`,
          url: `https://www.google.com/search?q=${encodeURIComponent(`${session.grammarTitle} english exercises`)}`,
          reason: "Atividades online para reforçar a estrutura.",
        },
      ],
    });
  }

  return materials;
}
