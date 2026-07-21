import React, { useState, useEffect, useRef } from "react";
import { Session, ChatMessage, ErrorLog } from "../types";
import { extractErrorsFromChat } from "../lib/extractSessionErrors";
import { requestWritingCorrection } from "../lib/writingCorrectApi";
import { 
  Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Check, 
  HelpCircle, Volume2, Mic, Square, Trash2, Send, Sparkles, 
  AlertCircle, CheckCircle2, User, HelpCircle as HelpIcon, ArrowRight
} from "lucide-react";

interface ActiveSessionViewProps {
  session: Session;
  onFinishSession: (errorLogs?: Omit<ErrorLog, "id" | "timestamp">[]) => void;
  onCloseSession: () => void;
  userSentences: { [cardId: string]: string };
  onSaveSentence: (cardId: string, text: string) => void;
}

export const ActiveSessionView: React.FC<ActiveSessionViewProps> = ({
  session,
  onFinishSession,
  onCloseSession,
  userSentences,
  onSaveSentence,
}) => {
  // Navigation & Step control
  const blocks = [
    { id: "warmup", title: "Aquecimento", desc: "Solte a voz!" },
    { id: "audioSummary", title: "Resumo Áudio", desc: "Podcast da lição" },
    { id: "grammar", title: "Gramática do Dia", desc: "Monte frases" },
    { id: "chat", title: "Conversa com Sarah", desc: "Chat com IA" },
    { id: "recording", title: "Gravação", desc: "Feche a lição" }
  ] as const;

  type BlockId = typeof blocks[number]["id"];
  const [activeBlock, setActiveBlock] = useState<BlockId>("warmup");

  // Timer States (30 minutes = 1800 seconds)
  const [timeLeft, setTimeLeft] = useState(1800);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Block 1 state: checked prompts
  const [checkedWarmups, setCheckedWarmups] = useState<{ [key: number]: boolean }>({});

  // Block 2 state: active writing cards
  const [grammarInputs, setGrammarInputs] = useState<{ [cardId: string]: string }>(userSentences || {});
  const [savedCards, setSavedCards] = useState<{ [cardId: string]: boolean }>(() => {
    const initial: { [cardId: string]: boolean } = {};
    Object.entries(userSentences || {}).forEach(([id, text]) => {
      if (typeof text === "string" && text.trim().length >= 5) initial[id] = true;
    });
    return initial;
  });
  const [grammarFeedback, setGrammarFeedback] = useState<{
    [cardId: string]: {
      loading?: boolean;
      isCorrect?: boolean;
      correctedText?: string;
      feedback?: string;
      error?: string;
    };
  }>({});
  const [correctingCardId, setCorrectingCardId] = useState<string | null>(null);

  // Block 3 states: Chat history
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello! Welcome to our English conversation. Today we are talking about "${session.topic}". Are you ready to practice with me? Try to introduce yourself or say hi!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isSarahTyping, setIsSarahTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [showUsefulPhrases, setShowUsefulPhrases] = useState(false);

  // Block 4 states: Audio Recorder
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Audio summary (NotebookLM-style)
  const [summaryScript, setSummaryScript] = useState("");
  const [summaryAudioUrl, setSummaryAudioUrl] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isSummaryPlaying, setIsSummaryPlaying] = useState(false);
  const [summaryHeard, setSummaryHeard] = useState(false);
  const [stepHint, setStepHint] = useState<string | null>(null);
  const summaryAudioRef = useRef<HTMLAudioElement | null>(null);
  const summaryFetchedForSession = useRef<string | null>(null);

  // Post-Session congratulation view
  const [showCongratulation, setShowCongratulation] = useState(false);

  // 30 minute Timer controller
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timeLeft]);

  // Scroll to bottom in chat whenever messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isSarahTyping]);

  // Clean up recording states on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const loadLessonAudioSummary = async (force = false) => {
    if (summaryLoading) return;
    if (!force && summaryFetchedForSession.current === session.id && summaryScript) return;

    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const res = await fetch("/api/lesson-audio/summary", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: session.title,
          topic: session.topic,
          level: session.level,
          grammarTitle: session.grammarTitle,
          grammarStructure: session.grammarStructure,
          grammarExplanation: session.grammarExplanation,
          grammarExample: session.grammarExample,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Falha ao gerar o resumo em áudio.");
      }

      setSummaryScript(typeof data.script === "string" ? data.script : "");
      summaryFetchedForSession.current = session.id;

      if (summaryAudioUrl) {
        URL.revokeObjectURL(summaryAudioUrl);
        setSummaryAudioUrl(null);
      }

      if (data.audioBase64 && data.mimeType) {
        const binary = atob(data.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: data.mimeType });
        setSummaryAudioUrl(URL.createObjectURL(blob));
      } else if (data.message) {
        setSummaryError(data.message);
      }
    } catch (err) {
      console.error(err);
      setSummaryError(err instanceof Error ? err.message : "Não foi possível gerar o áudio.");
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (activeBlock === "audioSummary") {
      void loadLessonAudioSummary();
    }
  }, [activeBlock, session.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleSummaryPlayback = async () => {
    const audio = summaryAudioRef.current;
    if (!audio || !summaryAudioUrl) return;

    if (isSummaryPlaying) {
      audio.pause();
      setIsSummaryPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsSummaryPlaying(true);
      setSummaryHeard(true);
      setStepHint(null);
    } catch (err) {
      console.error(err);
      setSummaryError("Não foi possível reproduzir o áudio.");
    }
  };

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleToggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    setTimeLeft(1800);
    setIsTimerRunning(false);
  };

  // Warmup toggles
  const handleToggleWarmup = (idx: number) => {
    setCheckedWarmups((prev) => {
      const next = { ...prev, [idx]: !prev[idx] };
      const allDone = session.warmupPrompts.every((_, i) => !!next[i]);
      if (allDone) setStepHint(null);
      return next;
    });
  };

  // Save grammar block + AI writing correction
  const handleSaveGrammarCard = async (cardId: string) => {
    const textValue = grammarInputs[cardId] || "";
    if (!textValue.trim() || textValue.trim().length < 5) return;

    const card = session.grammarCards.find((c) => c.id === cardId);
    onSaveSentence(cardId, textValue);
    setSavedCards((prev) => ({
      ...prev,
      [cardId]: true,
    }));
    setCorrectingCardId(cardId);
    setGrammarFeedback((prev) => ({
      ...prev,
      [cardId]: { loading: true },
    }));

    try {
      const result = await requestWritingCorrection({
        text: textValue,
        level: session.level,
        prompt: card?.prompt,
        template: card?.template,
        grammarStructure: session.grammarStructure,
        topic: session.topic,
        context: "grammar-card",
      });

      setGrammarFeedback((prev) => ({
        ...prev,
        [cardId]: {
          loading: false,
          isCorrect: result.isCorrect,
          correctedText: result.correctedText,
          feedback: result.feedback,
        },
      }));

      // If AI suggests a better version, keep student text but show correction
      if (!result.isCorrect && result.correctedText) {
        // optional: don't overwrite student input; show side-by-side
      }
    } catch (err) {
      setGrammarFeedback((prev) => ({
        ...prev,
        [cardId]: {
          loading: false,
          error: err instanceof Error ? err.message : "Não foi possível corrigir agora.",
        },
      }));
    } finally {
      setCorrectingCardId(null);
    }
  };

  const isWarmupComplete = session.warmupPrompts.every((_, idx) => !!checkedWarmups[idx]);
  const isSummaryComplete = Boolean(summaryScript.trim()) && summaryHeard;
  const isGrammarComplete = session.grammarCards.every((card) => {
    const text = (grammarInputs[card.id] || "").trim();
    const fb = grammarFeedback[card.id];
    const correctedOnce = Boolean(fb && !fb.loading && (fb.feedback || fb.error));
    return text.length >= 5 && !!savedCards[card.id] && correctedOnce;
  });
  const userChatCount = chatMessages.filter((m) => m.role === "user").length;
  const isChatComplete = userChatCount >= 2;
  const isRecordingComplete = Boolean(audioUrl);

  const isBlockComplete = (blockId: BlockId): boolean => {
    switch (blockId) {
      case "warmup":
        return isWarmupComplete;
      case "audioSummary":
        return isSummaryComplete;
      case "grammar":
        return isGrammarComplete;
      case "chat":
        return isChatComplete;
      case "recording":
        return isRecordingComplete;
      default:
        return false;
    }
  };

  const canEnterBlock = (blockId: BlockId): boolean => {
    const targetIndex = blocks.findIndex((b) => b.id === blockId);
    if (targetIndex <= 0) return true;
    for (let i = 0; i < targetIndex; i++) {
      if (!isBlockComplete(blocks[i].id)) return false;
    }
    return true;
  };

  const incompleteMessageFor = (blockId: BlockId): string => {
    switch (blockId) {
      case "warmup":
        return "Marque todos os prompts do aquecimento antes de avançar.";
      case "audioSummary":
        return summaryScript
          ? "Ouça o resumo (ou marque que já leu o roteiro) antes de avançar."
          : "Aguarde o resumo ser gerado e ouça/leia antes de avançar.";
      case "grammar":
        return "Preencha e salve todas as frases de gramática antes de avançar.";
      case "chat":
        return "Envie pelo menos 2 mensagens para a Sarah antes de avançar.";
      case "recording":
        return "Grave seu áudio de até 30 segundos antes de concluir a sessão.";
      default:
        return "Complete a etapa atual antes de avançar.";
    }
  };

  const goToBlock = (blockId: BlockId) => {
    if (!canEnterBlock(blockId)) {
      const firstIncomplete = blocks.find((b) => !isBlockComplete(b.id));
      setStepHint(incompleteMessageFor(firstIncomplete?.id || activeBlock));
      return;
    }
    setStepHint(null);
    setActiveBlock(blockId);
  };

  const tryAdvanceFrom = (current: BlockId, next: BlockId) => {
    if (!isBlockComplete(current)) {
      setStepHint(incompleteMessageFor(current));
      return;
    }

    if (current === "grammar") {
      session.grammarCards.forEach((card) => {
        const text = (grammarInputs[card.id] || "").trim();
        if (text) onSaveSentence(card.id, text);
      });
    }

    setStepHint(null);
    setActiveBlock(next);
  };

  const tryCompleteSession = () => {
    if (!isRecordingComplete) {
      setStepHint(incompleteMessageFor("recording"));
      return;
    }
    setStepHint(null);
    handleCompleteSession();
  };

  // Send message to Gemini chat tutor
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isSarahTyping) return;

    const userMsgText = chatInput.trim();
    setChatInput("");

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...chatMessages, newMsg];
    setChatMessages(updatedMessages);
    setIsSarahTyping(true);

    try {
      // Map ChatMessage format to simpler role-content schema expected by endpoint
      const formattedHistory = updatedMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: formattedHistory,
          currentTopic: session.topic,
          grammarStructure: session.grammarStructure
        })
      });

      if (!response.ok) {
        throw new Error("Erro de resposta do servidor");
      }

      const data = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-reply`,
        role: "assistant",
        content: data.reply,
        correction: data.correction,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, assistantMsg]);

    } catch (error) {
      console.error("Chat error:", error);
      // Fallback message
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: "assistant",
        content: "Sorry, I had a small connection issue. Can you repeat that, please? I'm listening!",
        correction: "💡 Dica: Sem problemas! Conexões oscilam. Tente me responder novamente.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSarahTyping(false);
    }
  };

  // Audio recording handlers
  const startRecording = async () => {
    try {
      setAudioUrl("");
      setRecordingSeconds(0);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        // release stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      // Start recording seconds interval
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 30) {
            // Auto stop at 30 seconds
            if (recorder.state !== "inactive") {
              recorder.stop();
              setIsRecording(false);
              if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            }
            return 30;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error("Mic error:", err);
      alert("Não conseguimos acessar seu microfone. Certifique-se de dar permissão ao microfone no seu navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  // Finish active session — Sarah's chat + grammar writing corrections fill the error notebook
  const handleCompleteSession = () => {
    const aiErrors = extractErrorsFromChat(chatMessages, session);

    for (const card of session.grammarCards) {
      const original = (grammarInputs[card.id] || "").trim();
      const fb = grammarFeedback[card.id];
      if (!original || !fb || fb.isCorrect || !fb.correctedText) continue;
      if (original.toLowerCase() === fb.correctedText.trim().toLowerCase()) continue;

      aiErrors.push({
        sessionId: session.id,
        sessionTitle: `${session.title} (${session.level} · S${session.week}D${session.day})`,
        errorText: original,
        correctionText: fb.feedback || `💡 Correto: ${fb.correctedText}`,
        source: "ai-session",
      });
    }

    onFinishSession(aiErrors);
    setShowCongratulation(true);
  };

  const usefulPhrases = [
    { eng: "Can you repeat, please?", pt: "Você pode repetir, por favor?" },
    { eng: "How do you say... in English?", pt: "Como se diz... em inglês?" },
    { eng: "I didn't understand.", pt: "Eu não entendi." },
    { eng: "I'm not sure, but...", pt: "Eu não tenho certeza, mas..." },
    { eng: "Could you write that down?", pt: "Você poderia escrever isso?" }
  ];

  // Render congratulations modal overlay
  if (showCongratulation) {
    return (
      <div className="bg-slate-50 min-h-screen py-16 px-4 flex items-center justify-center animate-fade-in">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-teal-50 text-teal-500 border-4 border-teal-100 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={40} className="animate-bounce" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-800">Sessão Concluída!</h2>
            <p className="text-slate-500 text-sm">
              Parabéns! Você completou com sucesso a lição:
            </p>
            <p className="font-bold text-teal-600 text-base">
              Semana {session.week}, Dia {session.day}: {session.title}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-500 border border-slate-100/60 leading-relaxed text-left space-y-1.5">
            <p className="font-bold text-slate-700 flex items-center gap-1">
              <Sparkles size={12} className="text-teal-500" />
              Você praticou hoje:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Aquecimento oral estruturado</li>
              <li>Resumo em áudio da matéria do dia</li>
              <li>Montagem de frases com <strong>{session.grammarTitle}</strong></li>
              <li>Bate-papo real em inglês com feedback inteligente</li>
              <li>Autoanálise de áudio gravado por você</li>
              <li>Erros detectados pela Sarah enviados ao Caderno de Progresso</li>
            </ul>
          </div>

          <button
            onClick={onCloseSession}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md cursor-pointer text-sm"
          >
            Voltar ao Painel Principal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Session Title Bar & Global Timer */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <span className="bg-teal-50 text-teal-700 border border-teal-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Semana {session.week} • Dia {session.day}
            </span>
            <span className="text-slate-400 text-xs font-semibold">• Tema: {session.topic}</span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-slate-800 leading-snug">{session.title}</h2>
        </div>

        {/* Global Timer Card */}
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3">
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center md:text-left">Cronômetro de 30m</p>
            <span className={`text-2xl font-mono font-extrabold ${timeLeft < 180 ? "text-rose-500 animate-pulse" : "text-slate-700"}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
            <button
              onClick={handleToggleTimer}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isTimerRunning 
                  ? "bg-amber-50 text-amber-600 hover:bg-amber-100" 
                  : "bg-teal-50 text-teal-600 hover:bg-teal-100"
              }`}
              title={isTimerRunning ? "Pausar tempo" : "Iniciar tempo"}
            >
              {isTimerRunning ? <Pause size={16} /> : <Play size={16} className="fill-teal-600" />}
            </button>
            <button
              onClick={handleResetTimer}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
              title="Resetar tempo"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Step Progress Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-center overflow-x-auto">
          <div className="flex w-full justify-between items-center max-w-4xl mx-auto px-2">
            {blocks.map((block, index) => {
              const isPast = blocks.findIndex(b => b.id === activeBlock) > index;
              const isCurrent = activeBlock === block.id;
              const unlocked = canEnterBlock(block.id);
              const done = isBlockComplete(block.id);
              
              return (
                <React.Fragment key={block.id}>
                  {/* Step Button */}
                  <div 
                    onClick={() => goToBlock(block.id)}
                    className={`flex flex-col items-center shrink-0 relative z-10 ${
                      unlocked ? "cursor-pointer group" : "cursor-not-allowed opacity-55"
                    }`}
                    title={unlocked ? block.title : "Complete a etapa anterior primeiro"}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                      done && !isCurrent
                        ? "bg-teal-500 border-teal-500 text-white" 
                        : isCurrent 
                        ? "bg-white border-teal-500 text-teal-600 ring-4 ring-teal-50/50 scale-105" 
                        : "bg-white border-slate-200 text-slate-400"
                    }`}>
                      {done && !isCurrent ? <Check size={14} strokeWidth={3} /> : index + 1}
                    </div>
                    <span className={`text-[10px] mt-1.5 font-bold transition-all ${
                      isCurrent ? "text-teal-600" : done || isPast ? "text-slate-500" : "text-slate-400"
                    }`}>
                      {block.title}
                    </span>
                  </div>

                  {/* Divider line between steps */}
                  {index < blocks.length - 1 && (
                    <div className={`grow h-0.5 mx-2 rounded-full transition-all ${
                      isBlockComplete(block.id) ? "bg-teal-500" : "bg-slate-100"
                    }`}></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        {stepHint && (
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-center">
            {stepHint}
          </p>
        )}
      </div>

      {/* Main Workspace based on Active Block */}
      <div className="min-h-[400px] grid grid-cols-1 gap-6">
        
        {/* BLOCK 1: AQUECIMENTO */}
        {activeBlock === "warmup" && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6 animate-fade-in">
            <div className="space-y-1 border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Passo 1 de 5 • Recomendado: 5 Min</span>
              <h3 className="text-base font-bold text-slate-800">Aquecimento de Pronúncia (Warm-up)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                O objetivo aqui é soltar as cordas vocais. Leia os prompts abaixo, tome um fôlego e fale-os em voz alta em inglês de forma pausada e confiante. Marque a caixa quando concluir!
              </p>
            </div>

            <div className="space-y-4">
              {session.warmupPrompts.map((prompt, idx) => {
                const isChecked = !!checkedWarmups[idx];
                return (
                  <div 
                    key={idx}
                    onClick={() => handleToggleWarmup(idx)}
                    className={`p-4.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 border-l-4 ${
                      isChecked 
                        ? "bg-teal-50/20 border-teal-200 border-l-teal-500" 
                        : "bg-slate-50/40 border-slate-200 border-l-teal-400 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                        isChecked ? "bg-teal-500 border-teal-500 text-white" : "border-slate-300 bg-white"
                      }`}>
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className={`text-sm font-semibold transition-all ${
                        isChecked ? "text-slate-500 line-through" : "text-slate-800"
                      }`}>
                        {prompt}
                      </span>
                    </div>
                    <Volume2 className={`shrink-0 w-4.5 h-4.5 ${isChecked ? "text-teal-400" : "text-slate-400 group-hover:text-slate-600"}`} />
                  </div>
                );
              })}
            </div>

            {/* Quick Tips Box */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs text-slate-600 space-y-2">
              <h4 className="font-bold text-teal-800 flex items-center gap-1">
                <Sparkles size={12} className="text-teal-500" />
                Dica de Ouro para nível A1-A2:
              </h4>
              <p className="leading-relaxed">
                Não se preocupe com sotaque perfeito! O mais importante é o ritmo e a articulação clara das consoantes. Fale de frente para um espelho ou em frente ao computador para moldar os movimentos da boca ao falar.
              </p>
            </div>

            {/* Bottom Navigation button */}
            <div className="flex flex-col items-end gap-2 pt-4 border-t border-slate-100">
              <p className={`text-[11px] font-medium ${isWarmupComplete ? "text-teal-600" : "text-amber-600"}`}>
                {isWarmupComplete
                  ? "Aquecimento completo — pode avançar"
                  : `Marque todos os prompts antes de avançar (${Object.values(checkedWarmups).filter(Boolean).length}/${session.warmupPrompts.length})`}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!isWarmupComplete) {
                    setStepHint(incompleteMessageFor("warmup"));
                    return;
                  }
                  tryAdvanceFrom("warmup", "audioSummary");
                }}
                aria-disabled={!isWarmupComplete}
                className={`text-xs font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-1.5 border ${
                  isWarmupComplete
                    ? "bg-slate-900 text-white hover:bg-slate-800 cursor-pointer border-slate-800/20"
                    : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                }`}
              >
                <span>Avançar para Resumo em Áudio</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* BLOCK 2: RESUMO EM ÁUDIO (estilo NotebookLM) */}
        {activeBlock === "audioSummary" && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6 animate-fade-in">
            <div className="space-y-1 border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Passo 2 de 5 • Recomendado: 3 Min</span>
              <h3 className="text-base font-bold text-slate-800">Resumo em Áudio da Matéria</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                A Sarah gera um mini-podcast descolado sobre o tema e a gramática de hoje — no clima NotebookLM. Ouça antes de praticar.
              </p>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-slate-50 border border-teal-100 rounded-3xl p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-600 flex items-center justify-center">
                  <Volume2 size={22} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Podcast da lição</p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {session.topic} · {session.grammarTitle}
                  </p>
                </div>
              </div>

              {summaryAudioUrl && (
                <audio
                  ref={summaryAudioRef}
                  src={summaryAudioUrl}
                  onEnded={() => setIsSummaryPlaying(false)}
                  onPause={() => setIsSummaryPlaying(false)}
                  preload="auto"
                />
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => void handleToggleSummaryPlayback()}
                  disabled={!summaryAudioUrl || summaryLoading}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSummaryPlaying
                      ? "bg-teal-600 text-white"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {isSummaryPlaying ? <Pause size={14} /> : <Play size={14} className="fill-white" />}
                  <span>{isSummaryPlaying ? "Pausar" : "Ouvir resumo"}</span>
                </button>

                <button
                  onClick={() => void loadLessonAudioSummary(true)}
                  disabled={summaryLoading}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-bold text-teal-700 bg-white/80 border border-teal-200 hover:bg-white cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw size={13} className={summaryLoading ? "animate-spin" : ""} />
                  <span>{summaryLoading ? "Gerando..." : "Gerar de novo"}</span>
                </button>
              </div>

              {summaryLoading && !summaryScript && (
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-600">
                  <span className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  Sarah está preparando o podcast da matéria...
                </div>
              )}

              {summaryError && (
                <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex gap-2 items-start">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{summaryError}</span>
                </div>
              )}

              {summaryScript && !summaryHeard && (
                <button
                  type="button"
                  onClick={() => {
                    setSummaryHeard(true);
                    setStepHint(null);
                  }}
                  className="text-[11px] font-bold text-teal-800 bg-white border border-teal-200 hover:bg-teal-50 px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Já ouvi / li o resumo — liberar próxima etapa
                </button>
              )}

              {summaryHeard && (
                <p className="text-[11px] font-bold text-teal-700 flex items-center gap-1">
                  <Check size={12} strokeWidth={3} />
                  Resumo concluído
                </p>
              )}
            </div>

            {summaryScript && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Roteiro (legenda)</h4>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm text-slate-700 leading-relaxed font-medium">
                  {summaryScript}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => goToBlock("warmup")}
                className="text-slate-500 hover:text-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                Aquecimento
              </button>
              <div className="flex flex-col items-end gap-1.5">
                {!isSummaryComplete && (
                  <p className="text-[11px] text-amber-600 font-medium max-w-[220px] text-right">
                    {incompleteMessageFor("audioSummary")}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!isSummaryComplete) {
                      setStepHint(incompleteMessageFor("audioSummary"));
                      return;
                    }
                    tryAdvanceFrom("audioSummary", "grammar");
                  }}
                  aria-disabled={!isSummaryComplete}
                  className={`text-xs font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-1.5 border ${
                    isSummaryComplete
                      ? "bg-slate-900 text-white hover:bg-slate-800 cursor-pointer border-slate-800/20"
                      : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  }`}
                >
                  <span>Avançar para Gramática</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BLOCK 3: GRAMÁTICA */}
        {activeBlock === "grammar" && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6 animate-fade-in">
            <div className="space-y-1 border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Passo 3 de 5 • Recomendado: 10 Min</span>
              <h3 className="text-base font-bold text-slate-800">Estrutura Gramatical do Dia</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Entenda a estrutura base e monte suas próprias frases. Escrever de próprio punho fixa as regras e vocabulários de forma definitiva na memória.
              </p>
            </div>

            {/* Grammar explanation highlight block */}
            <div className="bg-teal-50/50 border border-teal-100 p-5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 justify-between">
                <h4 className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">Estrutura: {session.grammarStructure}</h4>
                <span className="text-[10px] bg-indigo-200/50 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                  Foco do Dia
                </span>
              </div>
              <p className="text-sm font-bold text-slate-800">{session.grammarTitle}</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                {session.grammarExplanation}
              </p>
              <p className="text-xs text-slate-500 font-medium italic">
                Exemplo: <span className="text-indigo-900 font-semibold font-mono">"{session.grammarExample}"</span>
              </p>
            </div>

            {/* Practical cards fields */}
            <div className="space-y-5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Escreva suas frases:</h4>
              
              {session.grammarCards.map((card) => {
                const currentText = grammarInputs[card.id] || "";
                const isSaved = !!savedCards[card.id];
                const fb = grammarFeedback[card.id];
                const isCorrecting = correctingCardId === card.id || !!fb?.loading;
                const isIncomplete =
                  stepHint?.includes("gramática") && (!currentText.trim() || currentText.trim().length < 5 || !isSaved);

                return (
                  <div
                    key={card.id}
                    className={`p-5 rounded-2xl border bg-slate-50/30 space-y-3 ${
                      isIncomplete ? "border-rose-300 ring-1 ring-rose-100" : "border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700">{card.prompt}</p>
                        <p className="text-[10px] text-slate-400 italic">Tradução aproximada: {card.translation}</p>
                      </div>
                      <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded">
                        Comece com: "{card.template}"
                      </span>
                    </div>

                    <div className="flex gap-2.5 items-end">
                      <div className="grow">
                        <textarea
                          rows={2}
                          value={currentText}
                          onChange={(e) => {
                            setGrammarInputs((prev) => ({ ...prev, [card.id]: e.target.value }));
                            setSavedCards((prev) => ({ ...prev, [card.id]: false }));
                            setGrammarFeedback((prev) => {
                              const next = { ...prev };
                              delete next[card.id];
                              return next;
                            });
                          }}
                          placeholder={`Complete: ${card.template}...`}
                          className={`w-full text-xs border rounded-xl p-3 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                            isIncomplete ? "border-rose-300" : "border-slate-200"
                          }`}
                        />
                        {isIncomplete && (
                          <p className="text-[10px] text-rose-500 font-medium mt-1">
                            Preencha a frase e clique em Salvar & Corrigir.
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleSaveGrammarCard(card.id)}
                        disabled={!currentText.trim() || currentText.trim().length < 5 || isCorrecting}
                        className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                          isSaved && fb && !fb.loading
                            ? "bg-teal-500 text-white" 
                            : currentText.trim().length >= 5
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {isCorrecting ? (
                          <RotateCcw size={14} className="animate-spin" />
                        ) : isSaved && fb && !fb.loading ? (
                          <Check size={14} strokeWidth={2.5} />
                        ) : (
                          "Salvar & Corrigir"
                        )}
                      </button>
                    </div>

                    {fb?.loading && (
                      <p className="text-[11px] text-indigo-600 font-medium flex items-center gap-1.5">
                        <Sparkles size={12} />
                        Sarah está corrigindo sua frase…
                      </p>
                    )}

                    {fb?.error && (
                      <p className="text-[11px] text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                        {fb.error}
                      </p>
                    )}

                    {fb && !fb.loading && !fb.error && fb.feedback && (
                      <div
                        className={`rounded-xl px-3 py-2.5 text-[11px] leading-relaxed space-y-1.5 border ${
                          fb.isCorrect
                            ? "bg-teal-50/70 border-teal-100 text-teal-900"
                            : "bg-amber-50 border-amber-100 text-amber-950"
                        }`}
                      >
                        <p className="font-semibold flex items-start gap-1.5">
                          {fb.isCorrect ? (
                            <CheckCircle2 size={13} className="text-teal-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                          )}
                          <span>{fb.feedback}</span>
                        </p>
                        {!fb.isCorrect && fb.correctedText && (
                          <p className="font-mono text-slate-800 bg-white/70 border border-amber-100/60 rounded-lg px-2.5 py-1.5">
                            Correto: "{fb.correctedText}"
                          </p>
                        )}
                        {!fb.isCorrect && fb.correctedText && (
                          <button
                            type="button"
                            onClick={() => {
                              setGrammarInputs((prev) => ({ ...prev, [card.id]: fb.correctedText || "" }));
                              onSaveSentence(card.id, fb.correctedText || "");
                              setSavedCards((prev) => ({ ...prev, [card.id]: true }));
                            }}
                            className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
                          >
                            Usar versão corrigida
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Back & Next Navigation buttons */}
            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => goToBlock("audioSummary")}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 p-2 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Resumo Áudio</span>
              </button>

              <div className="flex flex-col items-end gap-1.5">
                {!isGrammarComplete && (
                  <p className="text-[11px] text-amber-600 font-medium max-w-[260px] text-right">
                    Salve e corrija todas as frases ({session.grammarCards.filter((c) => {
                      const fb = grammarFeedback[c.id];
                      return savedCards[c.id] && fb && !fb.loading && (fb.feedback || fb.error);
                    }).length}/{session.grammarCards.length})
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!isGrammarComplete) {
                      setStepHint(incompleteMessageFor("grammar"));
                      return;
                    }
                    tryAdvanceFrom("grammar", "chat");
                  }}
                  aria-disabled={!isGrammarComplete}
                  className={`text-xs font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-1.5 border ${
                    isGrammarComplete
                      ? "bg-slate-900 text-white hover:bg-slate-800 cursor-pointer border-slate-800/20"
                      : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  }`}
                >
                  <span>Ir para Conversa IA</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BLOCK 4: CONVERSA COM IA */}
        {activeBlock === "chat" && (
          <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[580px] animate-fade-in">
            {/* Header chat metadata */}
            <div className="bg-slate-950 border-b border-slate-800 p-4 md:px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-slate-950 font-extrabold text-sm border-2 border-slate-900 shadow-xs">
                    S
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950"></span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1">
                    Sarah • Tutora Virtual
                    <span className="text-[9px] bg-teal-500/10 text-teal-400 px-1.5 py-0.2 rounded border border-teal-500/20 font-normal">Online</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold">Tópico: {session.topic}</p>
                </div>
              </div>

              {/* Useful phrases dialog toggle */}
              <button
                onClick={() => setShowUsefulPhrases(!showUsefulPhrases)}
                className="text-[10px] font-bold text-teal-400 hover:text-teal-300 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-slate-700/50"
              >
                <HelpIcon size={12} />
                <span>Expressões Úteis</span>
              </button>
            </div>

            {/* Useful expressions sidebar absolute popover */}
            {showUsefulPhrases && (
              <div className="bg-slate-950/95 border-b border-slate-800 p-4 text-xs text-slate-300 animate-slide-up relative">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-2">
                  <span className="font-extrabold text-teal-400 uppercase tracking-wider text-[9px] flex items-center gap-1">
                    <Sparkles size={10} />
                    Salva-Vidas para iniciantes A1-A2:
                  </span>
                  <button 
                    onClick={() => setShowUsefulPhrases(false)}
                    className="text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Fechar [X]
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {usefulPhrases.map((p, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => {
                        setChatInput(prev => prev + " " + p.eng);
                        setShowUsefulPhrases(false);
                      }}
                      className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-850 transition-all cursor-pointer"
                    >
                      <p className="font-bold text-teal-300">{p.eng}</p>
                      <p className="text-[10px] text-slate-400">{p.pt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages box */}
            <div className="grow overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-950/20">
              {chatMessages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div key={msg.id} className={`flex items-start gap-2.5 ${isUser ? "justify-end animate-slide-up" : "animate-fade-in"}`}>
                    
                    {/* Sarah avatar */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0">
                        S
                      </div>
                    )}

                    <div className="max-w-[80%] space-y-1.5">
                      {/* Message Bubble */}
                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isUser 
                          ? "bg-teal-600 text-white font-semibold rounded-tr-none" 
                          : "bg-slate-800 text-slate-100 border border-slate-700/50 rounded-tl-none"
                      }`}>
                        <p>{msg.content}</p>
                      </div>

                      {/* Sarah correction sub-bubble (Feedback em PT) */}
                      {!isUser && msg.correction && (
                        <div className="bg-amber-500/10 text-amber-300 border border-amber-500/20 p-2.5 rounded-xl text-[10px] leading-relaxed flex gap-1.5 animate-fade-in">
                          <AlertCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            {msg.correction}
                          </div>
                        </div>
                      )}

                      {/* Timestamp */}
                      <p className={`text-[9px] text-slate-500 font-semibold px-1 ${isUser ? "text-right" : ""}`}>
                        {msg.timestamp}
                      </p>
                    </div>

                    {/* User avatar */}
                    {isUser && (
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold shrink-0 border border-slate-700">
                        <User size={12} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Sarah typing loading animation */}
              {isSarahTyping && (
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0">
                    S
                  </div>
                  <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700/50 flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Form input messaging bar */}
            <form onSubmit={handleSendChatMessage} className="bg-slate-950 border-t border-slate-850 p-3 md:p-4 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escreva sua resposta para Sarah em inglês..."
                className="grow text-xs border border-slate-800 rounded-xl px-4 py-3 bg-slate-900/50 text-white focus:outline-none focus:bg-slate-900 focus:border-slate-700"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isSarahTyping}
                className={`p-3 rounded-xl text-white transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  chatInput.trim() && !isSarahTyping
                    ? "bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-xs"
                    : "bg-slate-800 text-slate-600 cursor-not-allowed"
                }`}
              >
                <Send size={14} />
              </button>
            </form>

            {/* Quick block switcher footer */}
            <div className="bg-slate-950 border-t border-slate-850 p-3 md:px-4 flex justify-between items-center gap-3">
              <button
                onClick={() => goToBlock("grammar")}
                className="text-xs font-bold text-slate-400 hover:text-slate-200 p-1 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Voltar</span>
              </button>

              <div className="flex flex-col items-end gap-1">
                {!isChatComplete && (
                  <p className="text-[10px] text-amber-400 font-medium">
                    Mensagens enviadas: {userChatCount}/2
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!isChatComplete) {
                      setStepHint(incompleteMessageFor("chat"));
                      return;
                    }
                    tryAdvanceFrom("chat", "recording");
                  }}
                  aria-disabled={!isChatComplete}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1 border ${
                    isChatComplete
                      ? "bg-teal-500 text-slate-950 hover:bg-teal-400 cursor-pointer border-teal-400"
                      : "bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed"
                  }`}
                >
                  <span>Avançar para Gravação</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BLOCK 4: GRAVAÇÃO */}
        {activeBlock === "recording" && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6 animate-fade-in">
            <div className="space-y-1 border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Passo 5 de 5 • Recomendado: 5 Min</span>
              <h3 className="text-base font-bold text-slate-800">Gravação de Áudio</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Feche a lição falando até 30 segundos sobre o tema. Ao concluir, a Sarah monta sozinha o caderno de erros com as correções da conversa e libera sugestões + materiais.
              </p>
            </div>

            {/* Topic guidelines */}
            <div className="bg-rose-50/40 p-4 rounded-xl border border-rose-100/30 text-xs text-rose-950 space-y-1">
              <p className="font-bold">Tema da Gravação de Hoje:</p>
              <p className="italic font-medium text-slate-700">"Fale sobre {session.topic} em inglês por até 30 segundos, tentando aplicar a estrutura gramatical '{session.grammarStructure}'."</p>
            </div>

            {/* The Audio Recorder Layout Widget */}
            <div className="bg-slate-50 border border-slate-200 p-6 md:p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
              
              {/* Record timer */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tempo gravado (Máx 30s)</p>
                <p className="text-2xl font-mono font-extrabold text-slate-800">
                  {recordingSeconds.toString().padStart(2, "0")} / 30
                </p>
              </div>

              {/* Waves animation during recording */}
              {isRecording ? (
                <div className="flex items-center justify-center gap-1 h-8">
                  <span className="w-1 bg-rose-500 h-4 rounded-full animate-pulse"></span>
                  <span className="w-1 bg-rose-500 h-8 rounded-full animate-pulse delay-75"></span>
                  <span className="w-1 bg-rose-500 h-6 rounded-full animate-pulse delay-150"></span>
                  <span className="w-1 bg-rose-500 h-7 rounded-full animate-pulse delay-300"></span>
                  <span className="w-1 bg-rose-500 h-3 rounded-full animate-pulse"></span>
                </div>
              ) : (
                <div className="h-8 flex items-center text-xs text-slate-400 font-medium">
                  {audioUrl ? "Gravação pronta! Ouça no player abaixo." : "Pressione gravar para iniciar"}
                </div>
              )}

              {/* Recording Action Buttons */}
              <div className="flex gap-4">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
                    title="Começar Gravação"
                  >
                    <Mic size={24} />
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="w-14 h-14 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
                    title="Parar Gravação"
                  >
                    <Square size={20} className="fill-white" />
                  </button>
                )}
              </div>

              {/* native Audio HTML5 playback selector */}
              {audioUrl && !isRecording && (
                <div className="w-full max-w-sm space-y-2 pt-2 animate-fade-in">
                  <audio src={audioUrl} controls className="w-full focus:outline-none" />
                  <p className="text-[10px] text-teal-600 font-bold">🎯 Escute seu áudio focado em: Clareza, Ritmo e erros de Pronúncia.</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-teal-100 bg-teal-50/50 px-4 py-3 text-[11px] text-teal-900 leading-relaxed flex gap-2 items-start">
              <Sparkles size={14} className="text-teal-600 shrink-0 mt-0.5" />
              <span>
                Sem anotar erro na mão: as correções que a Sarah deu no chat entram no <strong>Caderno</strong> ao
                concluir. Em Progresso → Materiais você encontra vídeos e sugestões da IA.
              </span>
            </div>

            {/* Bottom completion and action bars */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                onClick={() => goToBlock("chat")}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 p-2 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Voltar</span>
              </button>

              <div className="flex flex-col items-end gap-1.5">
                {!isRecordingComplete && (
                  <p className="text-[11px] text-amber-600 font-medium">
                    Grave um áudio antes de concluir
                  </p>
                )}
                <button
                  type="button"
                  onClick={tryCompleteSession}
                  aria-disabled={!isRecordingComplete || isRecording}
                  className={`text-xs font-extrabold px-6 py-3.5 rounded-xl transition-all flex items-center gap-1.5 border ${
                    isRecordingComplete && !isRecording
                      ? "bg-teal-500 hover:bg-teal-400 text-slate-950 cursor-pointer shadow-md shadow-teal-500/10 border-teal-400"
                      : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  }`}
                >
                  <span>Concluir Sessão de Hoje</span>
                  <Check size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
