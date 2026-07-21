import React, { useCallback, useEffect, useState } from "react";
import { BookOpen, ArrowRight, Sparkles, RefreshCw, Award, ChevronRight, Loader2 } from "lucide-react";

interface PlacementViewProps {
  onApplyRecommendedLevel: (level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2") => void;
  onCancel: () => void;
}

interface PlacementQuestion {
  id: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export const PlacementView: React.FC<PlacementViewProps> = ({
  onApplyRecommendedLevel,
  onCancel,
}) => {
  const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const loadQuiz = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setShowResults(false);
    setCurrentIdx(0);
    setAnswers({});
    setQuestions([]);

    try {
      const res = await fetch("/api/placement/questions", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível carregar o teste.");
      }
      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("Nenhuma pergunta disponível no momento.");
      }
      setQuestions(data.questions);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Falha ao carregar o teste.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  const handleSelectOption = (optIdx: number) => {
    setAnswers({ ...answers, [currentIdx]: optIdx });
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const calculateResult = () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correct) {
        correctCount++;
      }
    });

    let recommended: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" = "A1";
    let desc = "";

    if (correctCount >= 9) {
      recommended = "C1";
      desc = "Excelente domínio! Suas estruturas avançadas indicam nível de fluência elevado. Recomendamos iniciar na Fase C1 para consolidar sua retórica.";
    } else if (correctCount >= 7) {
      recommended = "B2";
      desc = "Ótimo aproveitamento! Você domina estruturas intermediárias e consegue compreender hipóteses. Começar na Fase B2 é o ideal.";
    } else if (correctCount >= 5) {
      recommended = "B1";
      desc = "Bom nível! Você já se comunica bem no passado e no presente perfeito. Recomendamos iniciar no nível B1 (Intermediário).";
    } else if (correctCount >= 3) {
      recommended = "A2";
      desc = "Nível básico consolidado. Você entende perguntas cotidianas e frases no passado. Recomendamos iniciar no nível A2.";
    } else {
      recommended = "A1";
      desc = "Você está iniciando sua jornada. Recomendamos começar do absoluto zero na Fase A1 para estabelecer as fundações de frases.";
    }

    if (correctCount === questions.length && questions.length > 0) {
      recommended = "C2";
      desc = "Nível Proficiente! Você acertou todas as questões complexas de gramática, inversão e expressões idiomáticas. Fase C2 recomendada.";
    }

    return { correctCount, recommended, desc };
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200/80 p-10 shadow-sm flex items-center justify-center gap-2 text-sm font-semibold text-slate-500">
        <Loader2 size={18} className="animate-spin text-teal-500" />
        <span>Preparando perguntas aleatórias...</span>
      </div>
    );
  }

  if (loadError || questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm space-y-4 text-center">
        <p className="text-sm font-semibold text-rose-600">{loadError || "Não há perguntas disponíveis."}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onCancel}
            className="text-xs font-bold text-slate-400 hover:bg-slate-50 px-4 py-2 rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={loadQuiz}
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw size={12} />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const { correctCount, recommended, desc } = showResults
    ? calculateResult()
    : { correctCount: 0, recommended: "A1" as const, desc: "" };

  const currentQuestion = questions[currentIdx];
  const isOptionSelected = answers[currentIdx] !== undefined;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm animate-fade-in space-y-6">
      {!showResults ? (
        <div className="space-y-6">
          <div className="space-y-2 border-b border-slate-100 pb-4">
            <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
              <span className="text-teal-600 font-extrabold flex items-center gap-1">
                <BookOpen size={14} />
                Teste de Nivelamento Rápido
              </span>
              <span>Questão {currentIdx + 1} de {questions.length}</span>
            </div>

            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
              <div
                className="bg-teal-500 h-full transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                Foco: {currentQuestion.level}
              </span>
              <span className="text-xs text-slate-400 font-semibold">Preencha a lacuna com a opção mais adequada:</span>
            </div>

            <h3 className="text-sm font-black text-slate-800 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100/50">
              "{currentQuestion.question}"
            </h3>

            <div className="grid grid-cols-1 gap-3.5 pt-2">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = answers[currentIdx] === idx;
                return (
                  <button
                    key={`${currentQuestion.id}-${idx}`}
                    onClick={() => handleSelectOption(idx)}
                    className={`text-left text-xs p-4 rounded-xl border font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-teal-500/10 border-teal-500 text-teal-700 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center border-t border-slate-50">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className={`text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer ${
                currentIdx === 0 ? "opacity-30 cursor-not-allowed" : ""
              }`}
            >
              Anterior
            </button>

            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="text-xs font-bold text-slate-400 hover:bg-slate-50 px-4 py-2 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleNext}
                disabled={!isOptionSelected}
                className={`bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  !isOptionSelected ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <span>{currentIdx === questions.length - 1 ? "Ver Sugestão" : "Próxima"}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 text-center py-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center mx-auto shadow-md">
            <Award size={32} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-slate-800">Seu Nível Recomendado: {recommended}</h2>
            <p className="text-xs text-slate-400 font-semibold">
              Você acertou <strong className="text-slate-800">{correctCount}</strong> de {questions.length} perguntas do teste rápido.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl max-w-md mx-auto text-left space-y-3.5">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-teal-500 text-slate-950 font-black flex items-center justify-center text-sm">
                {recommended}
              </span>
              <div>
                <h4 className="font-bold text-xs text-slate-800">Fase Sugerida do CEFR</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase">De acordo com sua proficiência</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed border-t border-slate-200/50 pt-3">
              {desc}
            </p>

            <div className="text-[10px] bg-teal-50 border border-teal-100/50 text-teal-800 px-3 py-2 rounded-xl flex items-center gap-2">
              <Sparkles size={12} className="text-teal-500" />
              <span>Esta recomendação desbloqueia todos os níveis anteriores automaticamente!</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={loadQuiz}
              className="w-full sm:w-auto text-slate-400 hover:text-slate-600 font-bold text-xs px-5 py-3 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={12} />
              <span>Refazer Teste</span>
            </button>
            <button
              onClick={() => onApplyRecommendedLevel(recommended)}
              className="w-full sm:w-auto bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold px-8 py-3.5 rounded-xl text-xs transition-all shadow-md shadow-teal-500/15 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Aplicar {recommended} e Começar!</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
