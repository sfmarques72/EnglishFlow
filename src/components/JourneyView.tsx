import React, { useState } from "react";
import { Lock, Unlock, CheckCircle2, Award, ArrowRight, Calendar, Play, Sparkles, BookOpen } from "lucide-react";
import { CEFR_LEVELS, getSessionsForLevel } from "../data/schedule";
import { Session } from "../types";

interface JourneyViewProps {
  unlockedLevels: string[];
  selectedLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  onLevelChange: (level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2") => void;
  completedSessions: string[];
  onStartSession: (session: Session) => void;
  onNavigateToExam: (level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2") => void;
}

export const JourneyView: React.FC<JourneyViewProps> = ({
  unlockedLevels,
  selectedLevel,
  onLevelChange,
  completedSessions,
  onStartSession,
  onNavigateToExam,
}) => {
  const [hoveredLevel, setHoveredLevel] = useState<string | null>(null);
  const [selectedPreviewLevel, setSelectedPreviewLevel] = useState<"A1" | "A2" | "B1" | "B2" | "C1" | "C2">(selectedLevel);

  // Get completions of a level
  const getLevelStats = (levelCode: "A1" | "A2" | "B1" | "B2" | "C1" | "C2") => {
    const sessions = getSessionsForLevel(levelCode);
    const total = sessions.length;
    const completed = sessions.filter(s => completedSessions.includes(s.id)).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  };

  const handleNodeClick = (levelCode: "A1" | "A2" | "B1" | "B2" | "C1" | "C2") => {
    setSelectedPreviewLevel(levelCode);
  };

  const activePreviewSessions = getSessionsForLevel(selectedPreviewLevel);
  const previewStats = getLevelStats(selectedPreviewLevel);
  const isUnlocked = unlockedLevels.includes(selectedPreviewLevel);
  const isCurrentActive = selectedLevel === selectedPreviewLevel;

  // Render a visual CEFR badge
  const getCEFRBadge = (code: string) => {
    switch (code) {
      case "A1":
        return "bg-gradient-to-br from-emerald-500 to-teal-600 text-white";
      case "A2":
        return "bg-gradient-to-br from-teal-500 to-cyan-600 text-white";
      case "B1":
        return "bg-gradient-to-br from-cyan-500 to-sky-600 text-white";
      case "B2":
        return "bg-gradient-to-br from-sky-500 to-blue-600 text-white";
      case "C1":
        return "bg-gradient-to-br from-indigo-500 to-violet-600 text-white";
      case "C2":
        return "bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white";
      default:
        return "bg-slate-500 text-white";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Intro section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Award className="text-teal-500" size={24} />
            Mapa da Jornada de Fluência
          </h2>
          <p className="text-slate-500 text-sm">
            Avance pelos níveis do CEFR. Conclua as 12 sessões de cada fase e faça a prova para destravar o próximo nível!
          </p>
        </div>
        <div className="text-xs bg-teal-50 border border-teal-200 text-teal-800 px-4 py-2.5 rounded-2xl flex items-center gap-2">
          <Sparkles size={14} className="text-teal-500 animate-bounce" />
          <div>
            <span className="font-bold">Fases Desbloqueadas:</span>{" "}
            {unlockedLevels.join(" → ")}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Vertical CEFR Journey Map (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 relative">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Sua Trilha CEFR
          </h3>

          <div className="relative pl-6 space-y-8">
            {/* The connector vertical line */}
            <div className="absolute left-[33px] top-4 bottom-4 w-1 bg-slate-100 rounded-full" />

            {CEFR_LEVELS.map((level, idx) => {
              const code = level.code as "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
              const unlocked = unlockedLevels.includes(code);
              const stats = getLevelStats(code);
              const isSelected = selectedPreviewLevel === code;
              const isCurrent = selectedLevel === code;
              const examReady = stats.completed >= 10 && !unlockedLevels.includes(CEFR_LEVELS[idx + 1]?.code);

              return (
                <div 
                  key={code}
                  className={`relative flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all ${
                    isSelected 
                      ? "bg-teal-50/50 border border-teal-100" 
                      : "hover:bg-slate-50/70 border border-transparent"
                  }`}
                  onClick={() => handleNodeClick(code)}
                >
                  {/* Visual Node Pin */}
                  <div className="relative z-10 flex items-center justify-center">
                    {unlocked ? (
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md transition-transform ${getCEFRBadge(code)} ${isSelected ? "scale-110 ring-4 ring-teal-500/20" : ""}`}>
                        {code}
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border-2 border-slate-200 text-slate-400 flex items-center justify-center shadow-inner">
                        <Lock size={16} />
                      </div>
                    )}

                    {/* Status Badge overlays */}
                    {unlocked && stats.percent === 100 && (
                      <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white">
                        <CheckCircle2 size={10} className="fill-emerald-500 text-white" />
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute -bottom-1.5 -right-1.5 bg-teal-500 text-slate-950 font-extrabold text-[8px] uppercase px-1 py-0.5 rounded-md border border-white tracking-wider animate-pulse">
                        ATUAL
                      </div>
                    )}
                  </div>

                  {/* Level text description */}
                  <div className="grow space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-bold ${unlocked ? "text-slate-800" : "text-slate-400"}`}>
                        {level.label}
                      </h4>
                      {unlocked && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {stats.percent}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{level.desc}</p>
                    
                    {/* Status hint */}
                    {examReady && unlocked && (
                      <div className="text-[10px] font-bold text-amber-600 animate-pulse flex items-center gap-1 mt-1">
                        <Sparkles size={10} />
                        Pronto para a Prova da Fase!
                      </div>
                    )}
                  </div>

                  <ArrowRight size={14} className={`text-slate-300 ${isSelected ? "text-teal-500 translate-x-1" : ""} transition-all`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Level Preview Card & Active Sessions list (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Phase Header */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg ${getCEFRBadge(selectedPreviewLevel)}`}>
                  {selectedPreviewLevel}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Fase {selectedPreviewLevel} — {CEFR_LEVELS.find(l => l.code === selectedPreviewLevel)?.label}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isUnlocked ? "Fase Desbloqueada" : "Fase Bloqueada (Requer aprovação em exame)"}
                  </p>
                </div>
              </div>

              {isUnlocked ? (
                isCurrentActive ? (
                  <span className="bg-teal-500/10 text-teal-700 border border-teal-500/20 px-3.5 py-1.5 rounded-xl text-xs font-bold">
                    Fase Selecionada Atualmente
                  </span>
                ) : (
                  <button
                    onClick={() => onLevelChange(selectedPreviewLevel)}
                    className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer shadow-sm shadow-teal-500/15"
                  >
                    Estudar Esta Fase
                  </button>
                )
              ) : (
                <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200/80 px-3.5 py-2 rounded-xl text-xs font-bold">
                  <Lock size={12} />
                  <span>Bloqueado</span>
                </div>
              )}
            </div>

            {/* Level Description and Progress */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Foco Pedagógico</span>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {selectedPreviewLevel === "A1" && "Introduções, rotina diária, família, alimentação básica e estruturas essenciais no presente simples."}
                  {selectedPreviewLevel === "A2" && "Ações passadas, viagens, direções, conselhos de saúde, previsões climáticas e planos simples para o futuro."}
                  {selectedPreviewLevel === "B1" && "Experiências de vida, passado profissional, hábitos de longo prazo, regras sociais e descrições de processos."}
                  {selectedPreviewLevel === "B2" && "Cenários hipotéticos complexos, tempos verbais compostos, discurso indireto, Phrasal verbs e preparação técnica."}
                  {selectedPreviewLevel === "C1" && "Arrependimentos profundos, hipóteses avançadas de causa-efeito, linguagem diplomática corporativa e retórica de persuasão."}
                  {selectedPreviewLevel === "C2" && "Metáforas refinadas de alta abstração, debates éticos, liderança de ideias, nuances sutis de ironia e adaptação cultural completa."}
                </p>
              </div>

              <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progresso da Fase</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-slate-800">{previewStats.completed}</span>
                    <span className="text-xs text-slate-400 font-bold">/ {previewStats.total} Concluídas</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-teal-500 h-full transition-all duration-500" 
                      style={{ width: `${previewStats.percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                    <span>{previewStats.percent}% completo</span>
                    {previewStats.completed >= 10 && (
                      <span className="text-teal-600">Prova Liberada!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Locked phase warning block */}
            {!isUnlocked && (
              <div className="bg-amber-50/60 border border-amber-200/60 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-800">
                <Lock size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Como desbloquear a Fase {selectedPreviewLevel}?</p>
                  <p className="text-slate-600">
                    Você precisa atingir pelo menos <strong>80% de aproveitamento</strong> na fase anterior e ser aprovado na correspondente <strong>Prova de Fase</strong> com nota mínima de 70%. Estude com afinco e complete as sessões recomendadas!
                  </p>
                </div>
              </div>
            )}

            {/* Exam action if unlocked */}
            {isUnlocked && previewStats.completed >= 10 && (
              <div className="bg-teal-500/5 border border-teal-500/20 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-teal-500" />
                    Cronograma Concluído! Pronto para o Exame?
                  </h4>
                  <p className="text-xs text-slate-600">
                    Você concluiu {previewStats.completed} de 12 aulas. Já pode realizar a Prova Oficial de Fase para validar suas habilidades e expandir sua fluência!
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToExam(selectedPreviewLevel)}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-teal-500/10 cursor-pointer text-center shrink-0"
                >
                  Fazer Prova da Fase {selectedPreviewLevel}
                </button>
              </div>
            )}
          </div>

          {/* Session Schedule Preview for selected Level */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar size={12} />
              Lista de Sessões — Fase {selectedPreviewLevel}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-96 overflow-y-auto pr-1">
              {activePreviewSessions.map((session) => {
                const isCompleted = completedSessions.includes(session.id);
                return (
                  <div 
                    key={session.id}
                    className={`border rounded-2xl p-3.5 flex flex-col justify-between gap-3 text-xs ${
                      isCompleted 
                        ? "bg-slate-50/50 border-slate-200" 
                        : "bg-white border-slate-200 hover:border-teal-300"
                    } transition-colors`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          Semana {session.week} • Dia {session.day}
                        </span>
                        {isCompleted && (
                          <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-md px-1.5 py-0.5 text-[9px] font-bold">
                            Concluído
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-700 leading-tight">
                        {session.title}
                      </h4>
                      <p className="text-slate-400 text-[11px] font-medium leading-snug">
                        {session.topic}
                      </p>
                    </div>

                    {isUnlocked && (
                      <button
                        onClick={() => onStartSession(session)}
                        className={`w-full py-1.5 rounded-xl font-bold transition-all text-[11px] flex items-center justify-center gap-1 ${
                          isCompleted
                            ? "bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-100 border border-transparent"
                            : "bg-teal-50 text-teal-700 hover:bg-teal-500 hover:text-slate-950 border border-teal-100"
                        } cursor-pointer`}
                      >
                        <Play size={10} className="fill-current" />
                        <span>{isCompleted ? "Rever Sessão" : "Iniciar Aula"}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
