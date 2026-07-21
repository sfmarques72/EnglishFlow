import React, { useState, useEffect } from "react";
import { Session } from "../types";
import { STUDY_SCHEDULE, CEFR_LEVELS, getSessionsForLevel } from "../data/schedule";
import { Check, Play, BookOpen, Clock, CalendarDays, Eye, Lock, Unlock, Award, Sparkles, CheckCircle2 } from "lucide-react";

interface ScheduleViewProps {
  completedSessions: string[];
  nextSession: Session;
  onStartSession: (session: Session) => void;
  selectedLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  onLevelChange: (level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2") => void;
  unlockedLevels: string[];
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  completedSessions,
  nextSession,
  onStartSession,
  selectedLevel,
  onLevelChange,
  unlockedLevels,
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string>(nextSession.id);
  
  const levelSessions = getSessionsForLevel(selectedLevel);
  const selectedSession = levelSessions.find(s => s.id === selectedSessionId) || levelSessions[0] || nextSession;

  // Auto-sync selectedSessionId if level changed and current selected id belongs to another level
  useEffect(() => {
    if (selectedSession && selectedSession.level !== selectedLevel) {
      const firstOfLevel = levelSessions[0];
      if (firstOfLevel) {
        setSelectedSessionId(firstOfLevel.id);
      }
    }
  }, [selectedLevel, levelSessions, selectedSession]);

  // Group sessions by week dynamically
  const weeks = Array.from(new Set(levelSessions.map(s => s.week))).sort((a, b) => a - b);

  const handleLevelChangeAndResetSelection = (levelCode: "A1" | "A2" | "B1" | "B2" | "C1" | "C2") => {
    onLevelChange(levelCode);
    const firstOfLevel = getSessionsForLevel(levelCode)[0];
    if (firstOfLevel) {
      setSelectedSessionId(firstOfLevel.id);
    }
  };

  // Helper to check progress percent of a level
  const getLevelProgress = (lvl: "A1" | "A2" | "B1" | "B2" | "C1" | "C2") => {
    const sessions = getSessionsForLevel(lvl);
    const total = sessions.length;
    const completed = sessions.filter(s => completedSessions.includes(s.id)).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="text-teal-500" size={22} />
            Cronograma de Estudos — Fase {selectedLevel}
          </h2>
          <p className="text-slate-500 text-sm">
            Estude de forma estruturada: 3 sessões por semana durante 4 semanas. {getLevelProgress(selectedLevel)}% da Fase {selectedLevel} concluído.
          </p>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-500">
            <div className="w-3.5 h-3.5 rounded bg-teal-500 flex items-center justify-center text-white">
              <Check size={10} strokeWidth={3} />
            </div>
            <span>Concluído</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-500">
            <div className="w-3.5 h-3.5 rounded border border-slate-200 bg-white"></div>
            <span>Pendente</span>
          </div>
        </div>
      </div>

      {/* Level Selection Tabs in Schedule (Scales across all 6 levels) */}
      <div className="bg-slate-100 p-2.5 rounded-2xl border border-slate-200 text-xs space-y-2">
        <div className="flex items-center gap-2 px-1 text-slate-600 font-bold">
          <Award size={14} className="text-teal-500" />
          <span>Fases da Jornada CEFR:</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {CEFR_LEVELS.map((level) => {
            const code = level.code as "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
            const unlocked = unlockedLevels.includes(code);
            const isActive = selectedLevel === code;
            const progress = getLevelProgress(code);

            return (
              <button
                key={code}
                onClick={() => {
                  if (unlocked) {
                    handleLevelChangeAndResetSelection(code);
                  } else {
                    alert(
                      `Nível ${code} Bloqueado! 🔒\n\nConclua pelo menos 80% (mínimo de 10 aulas) do nível anterior e seja aprovado na Prova de Fase para desbloquear.`
                    );
                  }
                }}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-center transition-all cursor-pointer relative ${
                  isActive
                    ? "bg-teal-500 text-slate-950 border-teal-600 font-black shadow-xs"
                    : unlocked
                    ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
                    : "bg-slate-200/50 border-slate-100 text-slate-400 opacity-60 cursor-not-allowed"
                }`}
              >
                {!unlocked && <Lock size={10} className="absolute top-1.5 right-1.5 text-slate-400" />}
                {unlocked && progress === 100 && (
                  <CheckCircle2 size={10} className="absolute top-1.5 right-1.5 text-emerald-600 fill-white" />
                )}
                <span className="text-sm font-black tracking-tight">{code}</span>
                <span className="text-[9px] truncate max-w-[80px] opacity-80">{level.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 2 Cols: The Weeks Schedule Grid (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {weeks.map((weekNum) => {
            const weekSessions = levelSessions.filter(s => s.week === weekNum);
            return (
              <div key={weekNum} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-slate-800 border-b border-slate-100 pb-3">
                  Semana {weekNum} • <span className="text-slate-500 font-medium text-sm">
                    {selectedLevel === "A1" && (
                      weekNum === 1 ? "Fundamentos & Saudações" :
                      weekNum === 2 ? "Dia a Dia & Alimentação" :
                      weekNum === 3 ? "Família & Preferências" : "Preços & Sentimentos"
                    )}
                    {selectedLevel === "A2" && (
                      weekNum === 1 ? "Passado & Viagens" :
                      weekNum === 2 ? "Clima & Previsões" :
                      weekNum === 3 ? "Saúde & Conselhos" : "Regras & Planos de Carreira"
                    )}
                    {selectedLevel === "B1" && (
                      weekNum === 1 ? "Experiências & Conquistas" :
                      weekNum === 2 ? "Hábitos de Vida" :
                      weekNum === 3 ? "Regras & Obrigações" : "Processos & Causa-Efeito"
                    )}
                    {selectedLevel === "B2" && (
                      weekNum === 1 ? "Cenários Hipotéticos" :
                      weekNum === 2 ? "Discurso Indireto" :
                      weekNum === 3 ? "Vocabulário Corporativo" : "Argumentação & Debates"
                    )}
                    {selectedLevel === "C1" && (
                      weekNum === 1 ? "Arrependimentos & Hipóteses" :
                      weekNum === 2 ? "Diplomacia & Eufemismos" :
                      weekNum === 3 ? "Retórica & Persuasão" : "Negociação de Contratos"
                    )}
                    {selectedLevel === "C2" && (
                      weekNum === 1 ? "Nuances & Metáforas" :
                      weekNum === 2 ? "Ética & Filosofia" :
                      weekNum === 3 ? "Liderança de Pensamento" : "Fusões, Aquisições & Visão de Futuro"
                    )}
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {weekSessions.map((session) => {
                    const isCompleted = completedSessions.includes(session.id);
                    const isNext = nextSession.id === session.id;
                    const isSelected = selectedSessionId === session.id;

                    return (
                      <div
                        key={session.id}
                        onClick={() => setSelectedSessionId(session.id)}
                        className={`group relative rounded-2xl p-4.5 border text-left cursor-pointer transition-all ${
                          isSelected
                            ? "bg-teal-50/40 border-teal-500 shadow-xs animate-pulse-subtle"
                            : isNext
                            ? "border-teal-500/50 bg-slate-50/20 hover:bg-slate-50/50 hover:border-slate-300"
                            : "border-slate-200 bg-white hover:bg-slate-50/50 hover:border-slate-300"
                        }`}
                      >
                        {/* Completed Check Badge */}
                        {isCompleted && (
                          <div className="absolute top-3.5 right-3.5 bg-teal-500 text-white p-1 rounded-full shadow-xs">
                            <Check size={10} strokeWidth={3} />
                          </div>
                        )}

                        {/* Recommendation Banner */}
                        {isNext && !isCompleted && (
                          <span className="absolute -top-2.5 left-4 bg-teal-500 text-white text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-xs">
                            Sugerida
                          </span>
                        )}

                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Dia {session.day}
                          </p>
                          <h4 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-teal-600 transition-colors">
                            {session.title}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium truncate">
                            {session.topic}
                          </p>

                          <div className="pt-2 flex items-center justify-between">
                            <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100/50 truncate max-w-[120px]">
                              {session.grammarStructure.split(' / ')[0]}
                            </span>
                            <span className="text-[10px] text-slate-400 group-hover:text-teal-600 transition-colors flex items-center gap-0.5 font-medium shrink-0">
                              <Eye size={10} />
                              <span>Ver</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 1 Col: Selected Session Preview Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl space-y-6 lg:sticky lg:top-24">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">
                Semana {selectedSession.week} • Dia {selectedSession.day}
              </span>
              <span className="text-xs bg-white/10 text-white px-2.5 py-1 rounded-full flex items-center gap-1 font-medium border border-white/5">
                <Clock size={12} />
                <span>30 min</span>
              </span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white leading-tight">
              {selectedSession.title}
            </h3>
            <p className="text-slate-400 text-xs">
              Tema de Conversa: <strong className="text-teal-300 font-semibold">{selectedSession.topic}</strong>
            </p>
          </div>

          <hr className="border-slate-800" />

          {/* Grammar Focus block */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={12} className="text-teal-400" />
              Foco Estrutural
            </h4>
            <div className="bg-slate-800/60 rounded-2xl p-4.5 border border-slate-850 space-y-2">
              <p className="text-sm font-bold text-teal-300">{selectedSession.grammarTitle}</p>
              <code className="block text-xs text-indigo-300 font-mono bg-indigo-950/50 p-2 rounded border border-indigo-900/30 overflow-x-auto">
                {selectedSession.grammarStructure}
              </code>
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                {selectedSession.grammarExplanation}
              </p>
            </div>
          </div>

          {/* Completed / Action footer */}
          <div className="space-y-3 pt-2">
            {completedSessions.includes(selectedSession.id) ? (
              <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold justify-center bg-teal-500/10 p-3 rounded-2xl border border-teal-500/20">
                <Check size={14} strokeWidth={2.5} />
                <span>Sessão concluída!</span>
              </div>
            ) : null}

            <button
              onClick={() => onStartSession(selectedSession)}
              className="w-full bg-teal-500 hover:bg-teal-400 active:scale-98 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-md shadow-teal-500/10 cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              <Play size={14} className="fill-slate-950 text-slate-950" />
              <span>{completedSessions.includes(selectedSession.id) ? "Refazer Lição" : "Iniciar Aula Agora"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
