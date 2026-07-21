export interface SessionBlock {
  id: "warmup" | "audioSummary" | "grammar" | "chat" | "recording";
  title: string;
  duration: number; // in minutes
  description: string;
}

export interface Session {
  id: string; // e.g., "A1-w1-d1"
  week: number;
  day: number;
  title: string;
  topic: string;
  grammarTitle: string;
  grammarStructure: string;
  grammarExplanation: string;
  grammarExample: string;
  warmupPrompts: string[];
  grammarCards: Array<{
    id: string;
    prompt: string;
    translation: string;
    template: string;
  }>;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  correction?: string | null;
}

export interface ErrorLog {
  id: string;
  sessionId: string;
  sessionTitle: string;
  errorText: string;
  correctionText: string;
  timestamp: string;
  source?: "ai-session" | "ai-interview" | "manual";
}

export interface ExamResult {
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  passed: boolean;
  score: number; // 0 - 100
  scores: {
    grammar: number;
    listening: number;
    speaking: number;
    writing: number;
  };
  notes: string;
  weakPoints: string[];
  suggestedRevisionWeeks: number[];
  timestamp: string;
}

export interface InterviewSession {
  jobTitle: string;
  duration: number; // minutes
  difficulty: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  score?: number;
  scores?: {
    fluency: number;
    grammar: number;
    vocabulary: number;
    clarity: number;
  };
  transcript?: Array<{ sender: "interviewer" | "candidate"; text: string; correction?: string }>;
  feedback?: string;
  timestamp: string;
}

export interface ReadingBookMeta {
  id: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  title: string;
  author: string;
  minutes: number;
  coverHue: number;
  summary: string;
  gutenbergId: number;
  sourceLabel: string;
}

/** @deprecated use ReadingBookMeta — pages agora vêm da API Gutenberg */
export interface ReadingBook extends ReadingBookMeta {
  pages?: string[];
}

export interface AppState {
  completedSessions: string[]; // list of completed session IDs
  streakCount: number;
  lastStudyDate: string | null; // "YYYY-MM-DD"
  errorLogs: ErrorLog[];
  userGrammarSentences: { [sessionId: string]: { [cardId: string]: string } };
  selectedLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  unlockedLevels: string[]; // e.g., ["A1"]
  completedExams: { [level: string]: ExamResult };
  interviewHistory: InterviewSession[];
  placementTestResult?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null;
}
