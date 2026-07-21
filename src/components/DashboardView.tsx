import React from "react";
import { Session } from "../types";
import { Play, CheckCircle2, Award, Flame, Timer, Sparkles, BookOpen, Mic, Lock, Unlock, HelpCircle, Briefcase, ChevronRight, BarChart3, Star } from "lucide-react";
import { getSessionsForLevel } from "../data/schedule";

interface DashboardViewProps {
  completedSessions: string[];
  streakCount: number;
  nextSession: Session;
  onStartSession: (session: Session) => void;
  onViewChange: (view: string) => void;
  selectedLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  onLevelChange: (level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2") => void;
  unlockedLevels: string[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  completedSessions,
  streakCount,
  nextSession,
  onStartSession,
  onViewChange,
  selectedLevel,
  onLevelChange,
  unlockedLevels,
}) => {
  // Calculate completion statistics for the selected level
  const activeLevelSessions = getSessionsForLevel(selectedLevel);
  const totalSessions = activeLevelSessions.length;
  const completedCount = activeLevelSessions.filter(s => completedSessions.includes(s.id)).length;
  const progressPercent = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0;

  // Check if user is eligible to take the Phase Exam (requires at least 10 completed lessons)
  const isExamEligible = completedCount >= 10;

  // CEFR badges styling helper
  const getLevelGradient = (lvl: string) => {
    switch (lvl) {
      case "A1": return "from-emerald-500 to-teal-600";
      case "A2": return "from-teal-500 to-cyan-600";
      case "B1": return "from-cyan-500 to-sky-600";
      case "B2": return "from-sky-500 to-blue-600";
      case "C1": return "from-indigo-500 to-violet-600";
      case "C2": return "from-purple-500 to-fuchsia-600";
      default: return "from-slate-500 to-slate-600";
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      
      {/* 1. HERO BENTO BLOCK (Welcome + Onboarding) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Banner (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-md border border-slate-800 flex flex-col justify-between min-h-[300px]">
          <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
          
          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-teal-500/15 text-teal-300 border border-teal-500/25 rounded-full px-3.5 py-1 text-xs font-bold">
              <Sparkles size={12} className="animate-pulse" />
              <span>Plataforma Oficial de Conversação • Nível {selectedLevel}</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight max-w-xl">
              Pronto para falar inglês com naturalidade hoje?
            </h2>
            
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-lg">
              Estude 30 minutos diários em 4 blocos dinâmicos. Vá do básico (A1) até a fluência nativa (C2) destravando exames de proficiência e simulando entrevistas reais.
            </p>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">
            <button
              onClick={() => onStartSession(nextSession)}
              className="bg-teal-500 text-slate-950 hover:bg-teal-400 active:scale-98 font-black px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-teal-500/15 cursor-pointer flex items-center justify-center gap-2 text-xs text-center"
            >
              <Play size={14} className="fill-slate-950" />
              <span>Iniciar Sessão de Hoje • 30 Min</span>
            </button>

            <button
              onClick={() => onViewChange("placement")}
              className="bg-slate-800/80 text-white hover:bg-slate-800 border border-slate-700 font-bold px-4 py-3 rounded-xl transition-all text-xs text-center cursor-pointer flex items-center justify-center gap-1.5"
            >
              <HelpCircle size={14} className="text-teal-400" />
              <span>Fazer Teste de Nivelamento</span>
            </button>
          </div>
        </div>

        {/* Level & Streak Quick Stats Card (1 Col) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Sua Fase Atual
            </h3>

            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getLevelGradient(selectedLevel)} text-white flex items-center justify-center font-black text-xl shadow-md`}>
                {selectedLevel}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">CEFR {selectedLevel}</p>
                <p className="text-xs text-slate-400 font-medium">
                  {selectedLevel === "A1" && "Iniciante Absoluto"}
                  {selectedLevel === "A2" && "Iniciante Elemental"}
                  {selectedLevel === "B1" && "Intermediário"}
                  {selectedLevel === "B2" && "Intermediário Superior"}
                  {selectedLevel === "C1" && "Avançado Profissional"}
                  {selectedLevel === "C2" && "Fluente Completo"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="bg-amber-50 text-amber-600 border border-amber-200 rounded-xl px-3.5 py-1.5 flex items-center gap-1.5 text-xs font-bold">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-600" />
                <span>{streakCount} {streakCount === 1 ? "dia" : "dias"} de streak</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-4 text-[11px] text-slate-400 font-medium leading-relaxed">
            Consistência é chave! Praticar inglês pelo menos 3 vezes por semana reconfigura suas redes neurais de conversação.
          </div>
        </div>

      </div>

      {/* 2. CORE PROGRESS BENTO BOX (Progress Tracking & Exam Promo) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Progress gauge & lesson detail (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="text-teal-500" size={18} />
                Aproveitamento da Fase {selectedLevel}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                Você precisa completar no mínimo 10 lições da fase para habilitar o Exame de Proficiência.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xl font-black text-slate-800">{completedCount}</span>
              <span className="text-xs text-slate-400 font-bold"> / {totalSessions} aulas</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* Visual Bar progress */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-teal-500 h-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-bold uppercase">
                  <span>{progressPercent}% concluído</span>
                  {completedCount >= 10 ? (
                    <span className="text-teal-600">Prova Liberada!</span>
                  ) : (
                    <span>Faltam {Math.max(0, 10 - completedCount)} para a prova</span>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-2xl leading-relaxed">
                <span className="font-bold text-slate-700 block mb-1">Próxima Aula de Hoje:</span>
                <strong className="text-slate-800 font-bold">{nextSession.title}</strong> — {nextSession.topic}
              </div>
            </div>

            {/* Exam Call to action Block */}
            <div className={`p-5 rounded-2xl border text-xs flex flex-col justify-between h-full space-y-4 ${
              isExamEligible 
                ? "bg-teal-500/5 border-teal-500/20" 
                : "bg-slate-50/50 border-slate-200/80 text-slate-400"
            }`}>
              <div className="space-y-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest block ${isExamEligible ? "text-teal-600 animate-pulse" : "text-slate-400"}`}>
                  {isExamEligible ? "★ Exame Habilitado!" : "🔒 Exame Bloqueado"}
                </span>
                <p className="font-bold text-slate-700">Prova Oficial CEFR {selectedLevel}</p>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Avaliação oficial englobando Gramática, Compreensão Auditiva, Fala e Escrita. Exige nota mínima de 70% para desbloquear o nível superior.
                </p>
              </div>

              {isExamEligible ? (
                <button
                  onClick={() => onViewChange("exam")}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-2.5 rounded-xl text-center text-xs transition-all shadow-xs cursor-pointer block"
                >
                  Fazer Prova da Fase {selectedLevel}
                </button>
              ) : (
                <div className="bg-slate-100 text-slate-400 text-center py-2.5 rounded-xl font-bold text-[11px]">
                  Bloqueado (Conclua mais {Math.max(0, 10 - completedCount)} aulas)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Simulator links (1 Col) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Aceleradores de Fluência
            </h3>

            {/* Simulação link */}
            <div 
              onClick={() => onViewChange("interview")}
              className="border border-slate-200 hover:border-teal-300 rounded-2xl p-4 flex gap-3.5 items-center cursor-pointer transition-all hover:bg-slate-50 group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100/50">
                <Briefcase size={18} />
              </div>
              <div className="grow space-y-0.5">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <span>Simulador de Entrevista</span>
                  <ChevronRight size={12} className="text-slate-300 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">Chamadas reais de emprego para treinar conversação corporativa.</p>
              </div>
            </div>

            {/* Trilha link */}
            <div 
              onClick={() => onViewChange("journey")}
              className="border border-slate-200 hover:border-teal-300 rounded-2xl p-4 flex gap-3.5 items-center cursor-pointer transition-all hover:bg-slate-50 group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100/50">
                <BookOpen size={18} />
              </div>
              <div className="grow space-y-0.5">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <span>Trilha de Fases (CEFR Map)</span>
                  <ChevronRight size={12} className="text-slate-300 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">Veja o mapa completo da jornada de A1 a C2 e mude de fase.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] text-slate-500 font-medium leading-relaxed flex items-center gap-2">
            <Star size={12} className="text-teal-500 shrink-0 fill-current" />
            <span>Fases desbloqueadas: {unlockedLevels.join(" ➔ ")}</span>
          </div>
        </div>

      </div>

      {/* 3. METODOLOGIA BENTO BLOCK (The 4 Daily Study Blocks) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="space-y-1.5">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
            <Timer className="text-teal-500" size={16} />
            Metodologia do Cronograma de Estudos
          </h3>
          <p className="text-slate-500 text-xs leading-relaxed max-w-xl">
            Projetada cientificamente por poliglotas. 30 minutos de prática ativa de conversação geram 4x mais retenção do que aulas teóricas passivas tradicionais.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Bloco 1 */}
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/40 space-y-2.5">
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">1 • Aquecimento (5 Min)</span>
            <h4 className="text-xs font-bold text-slate-800">Falar em Voz Alta</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Repita prompts sonoros simples para calibrar o aparelho articulatório e afastar a timidez de falar inglês.
            </p>
          </div>

          {/* Bloco 2 */}
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/40 space-y-2.5">
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">2 • Estrutura (10 Min)</span>
            <h4 className="text-xs font-bold text-slate-800">Montagem de Frases</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Entenda uma estrutura gramatical ativa do dia e monte suas próprias frases aplicando variações instantaneamente.
            </p>
          </div>

          {/* Bloco 3 */}
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/40 space-y-2.5">
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">3 • Conversação (10 Min)</span>
            <h4 className="text-xs font-bold text-slate-800">Chat Interativo IA</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Converse com a tutora IA em inglês. O chat simula diálogos reais de forma acolhedora, fornecendo traduções e auxílio.
            </p>
          </div>

          {/* Bloco 4 */}
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/40 space-y-2.5">
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">4 • Gravação (5 Min)</span>
            <h4 className="text-xs font-bold text-slate-800">Autoavaliação de Áudio</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Grave uma fala contínua de 30s. Ouça sua própria pronúncia de fora e anote oportunidades de melhoria contínua.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
