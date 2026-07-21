import React, { useMemo, useState } from "react";
import { ErrorLog, InterviewSession } from "../types";
import { STUDY_SCHEDULE, CEFR_LEVELS } from "../data/schedule";
import { buildPhraseSuggestions, buildReinforcementMaterials } from "../lib/errorReinforcement";
import {
  Trash2,
  Sparkles,
  AlertCircle,
  Search,
  CheckCircle,
  Video,
  GraduationCap,
  Lightbulb,
  BookMarked,
  MessageSquareQuote,
  Layers,
  Youtube,
  ExternalLink,
} from "lucide-react";

interface ProgressViewProps {
  completedSessions: string[];
  streakCount: number;
  errorLogs: ErrorLog[];
  onDeleteErrorLog: (id: string) => void;
  unlockedLevels: string[];
  interviewHistory?: InterviewSession[];
}

type ProgressTab = "notebook" | "suggestions" | "materials";

export const ProgressView: React.FC<ProgressViewProps> = ({
  completedSessions,
  streakCount,
  errorLogs,
  onDeleteErrorLog,
  unlockedLevels,
  interviewHistory = [],
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ProgressTab>("notebook");
  const [aiMaterialsByKey, setAiMaterialsByKey] = useState<
    Record<
      string,
      {
        loading?: boolean;
        error?: string;
        videos?: Array<{ title: string; url: string; reason: string }>;
        resources?: Array<{ title: string; url: string; reason: string; type?: string }>;
        practicePrompts?: string[];
      }
    >
  >({});

  const totalCompleted = completedSessions.length;
  const studyHours = Math.round(((totalCompleted * 30) / 60) * 10) / 10;

  const filteredErrors = errorLogs.filter(
    (err) =>
      err.errorText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      err.correctionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      err.sessionTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const phraseSuggestions = useMemo(
    () => buildPhraseSuggestions(filteredErrors.length ? filteredErrors : errorLogs),
    [filteredErrors, errorLogs]
  );

  const reinforcementMaterials = useMemo(
    () => buildReinforcementMaterials(filteredErrors.length ? filteredErrors : errorLogs),
    [filteredErrors, errorLogs]
  );

  const loadAiMaterials = async (mat: {
    sessionId: string;
    errorId: string;
    grammarTitle: string;
    grammarStructure: string;
    level?: string;
    topic?: string;
  }, relatedError?: ErrorLog) => {
    const key = mat.sessionId;
    setAiMaterialsByKey((prev) => ({
      ...prev,
      [key]: { ...prev[key], loading: true, error: undefined },
    }));

    try {
      const res = await fetch("/api/error-materials/suggest", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          errorText: relatedError?.errorText || "",
          correctionText: relatedError?.correctionText || "",
          grammarTitle: mat.grammarTitle,
          grammarStructure: mat.grammarStructure,
          level: mat.level || "A1",
          topic: mat.topic || "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Falha ao buscar materiais da IA.");

      setAiMaterialsByKey((prev) => ({
        ...prev,
        [key]: {
          loading: false,
          videos: data.videos || [],
          resources: data.resources || [],
          practicePrompts: data.practicePrompts || [],
        },
      }));
    } catch (err) {
      setAiMaterialsByKey((prev) => ({
        ...prev,
        [key]: {
          loading: false,
          error: err instanceof Error ? err.message : "Não foi possível carregar sugestões.",
        },
      }));
    }
  };

  const levelStats = CEFR_LEVELS.map((level) => {
    const levelSessions = STUDY_SCHEDULE.filter((s) => s.level === level.code);
    const completed = levelSessions.filter((s) => completedSessions.includes(s.id)).length;
    const total = levelSessions.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isUnlocked = unlockedLevels.includes(level.code);

    return {
      code: level.code,
      label: level.label,
      completed,
      total,
      percent,
      isUnlocked,
    };
  });

  const tabs: Array<{ id: ProgressTab; label: string; icon: React.ReactNode; count?: number }> = [
    { id: "notebook", label: "Caderno", icon: <AlertCircle size={13} />, count: errorLogs.length },
    {
      id: "suggestions",
      label: "Sugestões",
      icon: <MessageSquareQuote size={13} />,
      count: phraseSuggestions.length,
    },
    {
      id: "materials",
      label: "Materiais",
      icon: <BookMarked size={13} />,
      count: reinforcementMaterials.length,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tempo Praticado</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2.5xl font-black text-slate-800">{studyHours}</span>
            <span className="text-xs font-bold text-slate-500">horas</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            Equivale a {totalCompleted} sessões de conversação
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Consistência</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2.5xl font-black text-slate-800">{streakCount}</span>
            <span className="text-xs font-bold text-slate-500">
              {streakCount === 1 ? "dia de streak" : "dias de streak"}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Mantenha a prática para fixar pronúncia</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fases Desbloqueadas</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2.5xl font-black text-teal-600">{unlockedLevels.length}</span>
            <span className="text-xs font-bold text-slate-500">de 6 níveis</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            Próximo objetivo: CEFR {CEFR_LEVELS[unlockedLevels.length]?.code || "C2"}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Simulações de Entrevista
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2.5xl font-black text-slate-800">{interviewHistory.length}</span>
            <span className="text-xs font-bold text-slate-500">concluídas</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Preparação ativa para o mercado global</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <GraduationCap size={14} />
                Status por Fase CEFR
              </h3>
              <p className="text-[11px] text-slate-400">
                Progresso individual e estado de bloqueio de cada nível.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {levelStats.map((stat) => (
                <div key={stat.code} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-slate-700">
                      <span
                        className={`text-[10px] font-black w-6 h-5 rounded flex items-center justify-center text-white ${
                          stat.isUnlocked ? "bg-teal-500" : "bg-slate-300"
                        }`}
                      >
                        {stat.code}
                      </span>
                      <span className={stat.isUnlocked ? "text-slate-800" : "text-slate-400 font-medium"}>
                        {stat.label}
                      </span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {stat.isUnlocked
                        ? `${stat.completed}/${stat.total} aulas (${stat.percent}%)`
                        : "🔒 Bloqueado"}
                    </span>
                  </div>

                  {stat.isUnlocked && (
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-500 h-full transition-all duration-300"
                        style={{ width: `${stat.percent}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Video size={14} />
              Histórico de Entrevistas IA
            </h3>

            {interviewHistory.length === 0 ? (
              <div className="text-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                Nenhuma entrevista realizada ainda. Comece a simular no menu superior!
              </div>
            ) : (
              <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                {interviewHistory.map((inv, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-700 leading-tight">{inv.jobTitle}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        CEFR {inv.difficulty} • {inv.timestamp}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-sm text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg">
                        {inv.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <AlertCircle className="text-rose-500" size={18} />
                Caderno de Erros & Reforço
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                A Sarah monta este caderno automaticamente após suas sessões e entrevistas.
              </p>
            </div>
            <div className="rounded-2xl border border-teal-100 bg-teal-50/60 px-4 py-3 text-[11px] text-teal-900 leading-relaxed flex gap-2 items-start">
              <Sparkles size={14} className="text-teal-600 shrink-0 mt-0.5" />
              <span>
                Você não precisa anotar erros manualmente. Ao terminar a matéria (chat com a Sarah) ou uma
                entrevista, os desvios detectados pela IA entram aqui com sugestões e materiais de reforço.
              </span>
            </div>
          </div>

          <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-white text-teal-700 shadow-xs border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {typeof tab.count === "number" && tab.count > 0 && (
                  <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-md">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === "notebook" && (
            <>
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar termos, frases ou erros no caderno..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-2xl bg-slate-50/50 focus:outline-none focus:bg-white focus:border-slate-300"
                />
              </div>

              {filteredErrors.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3.5">
                  <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                    <Sparkles size={20} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-700">Nenhum erro catalogado ainda</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Complete uma sessão de estudo (conversa com a Sarah) ou uma entrevista. A IA
                      registra sozinha os desvios e libera sugestões + materiais.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredErrors.map((err) => (
                    <div
                      key={err.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-xs transition-all flex flex-col md:flex-row justify-between gap-4 items-start relative group"
                    >
                      <div className="space-y-2.5 grow">
                        <span className="inline-block text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {err.sessionTitle}
                        </span>
                        {err.source?.startsWith("ai") && (
                          <span className="inline-block text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-lg ml-2">
                            Detectado pela Sarah
                          </span>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                              <AlertCircle size={10} />
                              Incorreto:
                            </p>
                            <p className="text-xs font-semibold text-slate-600 font-mono italic">
                              "{err.errorText}"
                            </p>
                          </div>

                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle size={10} />
                              Ajustado / Correto:
                            </p>
                            <p className="text-xs font-bold text-slate-800 font-mono bg-teal-50/40 px-2.5 py-1 rounded-lg border border-teal-100/30">
                              {err.correctionText}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteErrorLog(err.id)}
                        className="text-slate-300 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-all self-end md:self-start cursor-pointer shrink-0"
                        title="Remover anotação"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "suggestions" && (
            <div className="space-y-4">
              {phraseSuggestions.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <Lightbulb className="mx-auto text-teal-500" size={22} />
                  <p className="text-sm font-bold text-slate-700">Nenhuma sugestão ainda</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Depois que a Sarah registrar erros na sessão, montamos frases de prática a partir do
                    que você errou e da correção.
                  </p>
                </div>
              ) : (
                phraseSuggestions.map((item) => (
                  <div
                    key={item.errorId}
                    className="rounded-2xl border border-slate-200 p-5 space-y-3 bg-slate-50/40"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                        Você errou
                      </span>
                      <p className="text-xs font-mono text-slate-600 italic">"{item.sourceError}"</p>
                    </div>

                    <div className="bg-white border border-teal-100 rounded-xl px-3.5 py-2.5">
                      <p className="text-[10px] font-bold text-teal-700 uppercase tracking-wider mb-1">
                        Modelo correto
                      </p>
                      <p className="text-xs font-bold text-slate-800 font-mono">"{item.correctModel}"</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <MessageSquareQuote size={11} />
                        Sugestões de frases para praticar
                      </p>
                      <ul className="space-y-1.5">
                        {item.practiceLines.map((line, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-slate-700 bg-white border border-slate-100 rounded-xl px-3 py-2.5 leading-relaxed"
                          >
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                      <Lightbulb size={13} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>{item.tip}</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "materials" && (
            <div className="space-y-4">
              {reinforcementMaterials.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <BookMarked className="mx-auto text-teal-500" size={22} />
                  <p className="text-sm font-bold text-slate-700">Sem materiais de reforço</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Depois que a Sarah registrar erros na sessão, liberamos a gramática da aula, vídeos no
                    YouTube e sugestões extras da IA.
                  </p>
                </div>
              ) : (
                reinforcementMaterials.map((mat) => {
                  const relatedError =
                    errorLogs.find((e) => e.id === mat.errorId) ||
                    errorLogs.find((e) => e.sessionId === mat.sessionId);
                  const aiPack = aiMaterialsByKey[mat.sessionId];

                  return (
                    <div
                      key={`${mat.sessionId}-${mat.errorId}`}
                      className="rounded-2xl border border-slate-200 p-5 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Layers size={11} />
                            Material para reforçar
                          </p>
                          <h4 className="text-sm font-bold text-slate-800 mt-1">{mat.sessionTitle}</h4>
                        </div>
                        {mat.level && (
                          <span className="text-[10px] font-black bg-teal-500 text-white px-2 py-1 rounded-lg">
                            {mat.level}
                          </span>
                        )}
                      </div>

                      <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-4 space-y-1.5">
                        <p className="text-xs font-extrabold text-teal-800">{mat.grammarTitle}</p>
                        <p className="text-[11px] font-mono text-teal-700">{mat.grammarStructure}</p>
                        <p className="text-xs text-slate-600 leading-relaxed">{mat.grammarExplanation}</p>
                        <p className="text-[11px] text-slate-500 italic">
                          Exemplo:{" "}
                          <span className="font-semibold text-slate-700">"{mat.grammarExample}"</span>
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Vídeos na internet
                        </p>
                        <div className="space-y-2">
                          {mat.videoLinks.map((video, idx) => (
                            <a
                              key={idx}
                              href={video.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 hover:border-teal-300 hover:bg-teal-50/30 transition-colors"
                            >
                              <Youtube size={16} className="text-rose-500 shrink-0 mt-0.5" />
                              <span className="min-w-0">
                                <span className="block text-xs font-bold text-slate-800">{video.title}</span>
                                <span className="block text-[11px] text-slate-500">{video.reason}</span>
                              </span>
                              <ExternalLink size={12} className="text-slate-400 shrink-0 mt-1" />
                            </a>
                          ))}
                        </div>
                      </div>

                      {mat.webLinks.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Links rápidos
                          </p>
                          {mat.webLinks.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 hover:bg-white transition-colors"
                            >
                              <BookMarked size={14} className="text-teal-600 shrink-0 mt-0.5" />
                              <span className="min-w-0">
                                <span className="block text-xs font-bold text-slate-800">{link.title}</span>
                                <span className="block text-[11px] text-slate-500">{link.reason}</span>
                              </span>
                              <ExternalLink size={12} className="text-slate-400 shrink-0 mt-1" />
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="rounded-2xl border border-dashed border-teal-200 bg-teal-50/30 p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={12} />
                            Sugestões da IA
                          </p>
                          <button
                            type="button"
                            onClick={() => void loadAiMaterials(mat, relatedError)}
                            disabled={aiPack?.loading}
                            className="text-[11px] font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
                          >
                            {aiPack?.loading ? "Gerando..." : aiPack?.videos ? "Atualizar IA" : "Pedir à Sarah"}
                          </button>
                        </div>

                        {aiPack?.error && (
                          <p className="text-[11px] text-rose-600">{aiPack.error}</p>
                        )}

                        {aiPack?.videos && aiPack.videos.length > 0 && (
                          <div className="space-y-2">
                            {aiPack.videos.map((video, idx) => (
                              <a
                                key={`ai-v-${idx}`}
                                href={video.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block rounded-xl bg-white border border-teal-100 px-3 py-2.5"
                              >
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                  <Youtube size={14} className="text-rose-500" />
                                  {video.title}
                                </span>
                                <span className="text-[11px] text-slate-500 block mt-0.5">{video.reason}</span>
                              </a>
                            ))}
                          </div>
                        )}

                        {aiPack?.resources && aiPack.resources.length > 0 && (
                          <div className="space-y-2">
                            {aiPack.resources.map((resource, idx) => (
                              <a
                                key={`ai-r-${idx}`}
                                href={resource.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block rounded-xl bg-white border border-slate-100 px-3 py-2.5"
                              >
                                <span className="text-xs font-bold text-slate-800">
                                  {resource.title}
                                  {resource.type ? ` · ${resource.type}` : ""}
                                </span>
                                <span className="text-[11px] text-slate-500 block mt-0.5">
                                  {resource.reason}
                                </span>
                              </a>
                            ))}
                          </div>
                        )}

                        {aiPack?.practicePrompts && aiPack.practicePrompts.length > 0 && (
                          <ul className="space-y-1.5">
                            {aiPack.practicePrompts.map((prompt, idx) => (
                              <li
                                key={`ai-p-${idx}`}
                                className="text-xs text-slate-700 bg-white border border-slate-100 rounded-xl px-3 py-2"
                              >
                                {prompt}
                              </li>
                            ))}
                          </ul>
                        )}

                        {!aiPack?.videos && !aiPack?.loading && (
                          <p className="text-[11px] text-slate-500">
                            Clique em “Pedir à Sarah” para receber vídeos e links personalizados com base no
                            seu erro.
                          </p>
                        )}
                      </div>

                      {mat.practiceCards.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Cartões de prática
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {mat.practiceCards.map((card, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1"
                              >
                                <p className="text-[11px] font-bold text-slate-700">{card.prompt}</p>
                                <p className="text-[10px] font-mono text-teal-700">
                                  Comece: {card.template}
                                </p>
                                <p className="text-[10px] text-slate-400 italic">{card.translation}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {mat.warmupPrompts.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Aquecimento oral
                          </p>
                          <ul className="space-y-1.5">
                            {mat.warmupPrompts.map((prompt, idx) => (
                              <li
                                key={idx}
                                className="text-xs text-slate-600 bg-white border border-slate-100 rounded-xl px-3 py-2"
                              >
                                {prompt}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
