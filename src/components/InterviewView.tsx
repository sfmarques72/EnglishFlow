import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Video, VideoOff, Volume2, User, Award, CheckCircle, RefreshCw, ArrowRight, Sparkles, MessageSquare, AlertCircle } from "lucide-react";
import { InterviewSession } from "../types";

interface InterviewViewProps {
  currentLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  onSaveInterview: (session: InterviewSession) => void;
  onNavigateToDashboard: () => void;
}

const SAMPLE_JOBS = [
  "Software Engineer",
  "Product Manager",
  "UX/UI Designer",
  "Data Analyst",
  "Marketing Specialist",
  "Sales Representative",
  "Customer Support Agent",
  "English Teacher"
];

const LEVEL_INTERVIEW_QUESTIONS: Record<string, string[]> = {
  A1: [
    "Hello! Welcome to the interview. What is your name and where are you from?",
    "Nice. Tell me, what do you do in your free time?",
    "Excellent. Why do you want this job?",
    "Thank you! That is all for today. Do you have any questions for me?"
  ],
  A2: [
    "Hello, welcome! Please introduce yourself. What is your profession?",
    "Great. What did you study and where did you work in your last job?",
    "Interesting! Why are you interested in our company?",
    "Excellent. Tell me about a past project you completed successfully.",
    "Thank you for your time. We will contact you soon."
  ],
  B1: [
    "Welcome! Let's begin. Can you take me through your professional background?",
    "Fascinating. What would you say is your greatest professional achievement so far?",
    "And how do you handle tight deadlines or stressful situations in a team?",
    "Great. What are your long-term career goals for the next three years?",
    "Perfect. What are your salary expectations for this position?",
    "Thank you. It was a pleasure talking to you today."
  ],
  B2: [
    "Good morning. Thank you for joining us today. To start off, what makes you the ideal candidate for this role?",
    "Excellent. Could you describe a challenging workplace scenario you faced and how you resolved it?",
    "That sounds like a learning experience. How do you prioritize tasks when managing multiple projects?",
    "In your opinion, what is the most important trend happening in your industry right now?",
    "Fascinating. Why are you looking to leave your current role at this moment?",
    "Thank you. This has been very informative. We will reach out within the week."
  ],
  C1: [
    "Welcome to our executive assessment. Could you elaborate on your leadership style and how you foster cross-functional collaboration?",
    "Indeed. How do you navigate stakeholder resistance when implementing high-risk strategic changes?",
    "That requires diplomacy. Could you cite an instance where you successfully mitigated a major project failure?",
    "Fascinating. In a fast-paced environment, how do you balance commercial urgency with quality assurance?",
    "Understood. What unique value proposition do you bring that our current leadership team might lack?",
    "Thank you for this high-level discussion. We'll be in touch."
  ],
  C2: [
    "It is a privilege to speak with you. Given the abstract complexities of today's markets, how do you speculatively manage geopolitical volatility within your operations?",
    "Invaluable insight. How do you cultivate a workplace culture that is resilient to paradigm-shifting technological disruptions?",
    "Remarkable. If you were to critique our current market positioning, what subtle vulnerabilities would you highlight?",
    "Brilliant analysis. How do you articulate complex corporate visions to highly diverse stakeholder groups with varying registers of technical understanding?",
    "This dialogue has been exceptionally enriching. I appreciate your mastery. We shall finalize our decision shortly."
  ]
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Falha ao ler áudio."));
        return;
      }
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("Áudio inválido."));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Falha ao ler áudio."));
    reader.readAsDataURL(blob);
  });
}

function pickRecorderMimeType(): string | undefined {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

export const InterviewView: React.FC<InterviewViewProps> = ({
  currentLevel,
  onSaveInterview,
  onNavigateToDashboard,
}) => {
  const [stage, setStage] = useState<"setup" | "active" | "feedback">("setup");
  
  const [jobTitle, setJobTitle] = useState<string>("Software Engineer");
  const [duration, setDuration] = useState<number>(10);
  const [customJobInput, setCustomJobInput] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [mediaReady, setMediaReady] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [transcript, setTranscript] = useState<Array<{ sender: "interviewer" | "candidate"; text: string; correction?: string }>>([]);
  const [userTextResponse, setUserTextResponse] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600);
  
  const [finalScore, setFinalScore] = useState<number>(0);
  const [critScores, setCritScores] = useState({ fluency: 0, grammar: 0, vocabulary: 0, clarity: 0 });
  const [feedbackNotes, setFeedbackNotes] = useState<string>("");

  const interviewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const setupVideoRef = useRef<HTMLVideoElement>(null);
  const activeVideoRef = useRef<HTMLVideoElement>(null);

  const questions = LEVEL_INTERVIEW_QUESTIONS[currentLevel] || LEVEL_INTERVIEW_QUESTIONS.A2;

  const attachStreamToVideos = useCallback((stream: MediaStream) => {
    [setupVideoRef.current, activeVideoRef.current].forEach((video) => {
      if (!video) return;
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.muted = true;
      video.playsInline = true;
      void video.play().catch(() => {});
    });
  }, []);

  const stopMicStream = useCallback(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
  }, []);

  const stopRecordingTracks = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  const stopMedia = useCallback(() => {
    stopRecordingTracks();
    stopMicStream();

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    [setupVideoRef.current, activeVideoRef.current].forEach((video) => {
      if (video) video.srcObject = null;
    });
    setMediaReady(false);
  }, [stopRecordingTracks, stopMicStream]);

  const startMedia = useCallback(async (withCamera: boolean) => {
    setMediaError(null);
    setMediaLoading(true);
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withCamera
          ? { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
          : false,
      });

      mediaStreamRef.current = stream;
      setMediaReady(true);
      requestAnimationFrame(() => {
        attachStreamToVideos(stream);
        setTimeout(() => attachStreamToVideos(stream), 50);
      });
    } catch (err) {
      console.error("Media permission error:", err);
      setMediaReady(false);
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setMediaError("Permissão de câmera/microfone negada. Clique no cadeado na barra do navegador e permita câmera e microfone.");
      } else if (name === "NotFoundError") {
        setMediaError("Nenhuma câmera ou microfone foi encontrado neste dispositivo.");
      } else {
        setMediaError("Não foi possível acessar câmera/microfone do PC.");
      }
    } finally {
      setMediaLoading(false);
    }
  }, [attachStreamToVideos]);

  useEffect(() => {
    if (stage === "setup" || stage === "active") {
      void startMedia(isCameraActive);
    } else {
      stopMedia();
    }

    return () => {
      stopMedia();
    };
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps -- restart media when stage changes

  useEffect(() => {
    const stream = mediaStreamRef.current;
    if (!stream) return;

    const videoTracks = stream.getVideoTracks();
    if (isCameraActive && videoTracks.length === 0) {
      void startMedia(true);
      return;
    }

    videoTracks.forEach((track) => {
      track.enabled = isCameraActive;
    });

    if (isCameraActive) {
      attachStreamToVideos(stream);
    }
  }, [isCameraActive, startMedia, attachStreamToVideos]);

  useEffect(() => {
    if (mediaReady && mediaStreamRef.current) {
      attachStreamToVideos(mediaStreamRef.current);
    }
  }, [mediaReady, stage, attachStreamToVideos]);

  useEffect(() => {
    if (stage === "active" && secondsRemaining > 0) {
      interviewTimerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleEndInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interviewTimerRef.current) clearInterval(interviewTimerRef.current);
    };
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartInterview = () => {
    const selectedJob = showCustomInput ? customJobInput : jobTitle;
    if (!selectedJob.trim()) {
      alert("Por favor, digite ou selecione um cargo desejado!");
      return;
    }
    setJobTitle(selectedJob);
    setSecondsRemaining(duration * 60);
    setTranscript([{ sender: "interviewer", text: questions[0] }]);
    setCurrentQuestionIndex(0);
    setUserTextResponse("");
    setStage("active");
  };

  const handleAnswerSubmit = (customText?: string) => {
    const textToSubmit = customText || userTextResponse;
    if (!textToSubmit.trim()) return;

    stopRecordingTracks();

    const newTranscript = [...transcript];
    
    let correction: string | undefined = undefined;
    if (currentLevel === "A1" || currentLevel === "A2") {
      if (textToSubmit.toLowerCase().includes("i have thirty years")) {
        correction = "I am 30 years old (Em inglês, expressamos idade com o verbo To Be, não com To Have).";
      } else if (textToSubmit.toLowerCase().includes("i work as developer")) {
        correction = "I work as a developer (Lembre-se de usar o artigo 'a' antes de profissões singulares).";
      } else if (textToSubmit.toLowerCase().includes("i like study")) {
        correction = "I like studying / I like to study (Verbos de preferência são seguidos por gerúndio ou infinitivo).";
      }
    }

    newTranscript.push({ sender: "candidate", text: textToSubmit, correction });

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      newTranscript.push({ sender: "interviewer", text: questions[nextIndex] });
      setCurrentQuestionIndex(nextIndex);
      setTranscript(newTranscript);
      setUserTextResponse("");
    } else {
      setTranscript(newTranscript);
      handleEndInterview(newTranscript);
    }
  };

  const transcribeAudioBlob = async (blob: Blob) => {
    setIsTranscribing(true);
    setMediaError(null);
    try {
      const audioBase64 = await blobToBase64(blob);
      const res = await fetch("/api/transcribe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64,
          mimeType: blob.type || "audio/webm",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Falha ao transcrever o áudio.");
      }
      const text = typeof data.text === "string" ? data.text.trim() : "";
      if (!text) {
        setMediaError("Não entendi o áudio. Tente falar de novo ou digite a resposta.");
        return;
      }
      setUserTextResponse(text);
    } catch (err) {
      console.error(err);
      setMediaError(err instanceof Error ? err.message : "Falha ao transcrever. Digite a resposta.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleToggleMicrophone = async () => {
    if (isTranscribing) return;

    if (isRecording) {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      } else {
        setIsRecording(false);
        stopMicStream();
      }
      return;
    }

    try {
      setMediaError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setMediaError("Seu navegador não permite acesso ao microfone.");
        return;
      }
      if (typeof MediaRecorder === "undefined") {
        setMediaError("Gravação de áudio não é suportada neste navegador. Use Chrome ou Edge.");
        return;
      }

      // Dedicated audio-only stream — MediaRecorder breaks on A/V camera streams
      // when using audio/* mime types.
      stopMicStream();
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      });

      micStreamRef.current = audioStream;

      audioChunksRef.current = [];
      const mimeType = pickRecorderMimeType();

      let recorder: MediaRecorder;
      try {
        recorder = mimeType
          ? new MediaRecorder(audioStream, { mimeType })
          : new MediaRecorder(audioStream);
      } catch {
        recorder = new MediaRecorder(audioStream);
      }

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        setIsRecording(false);
        mediaRecorderRef.current = null;
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });
        audioChunksRef.current = [];
        stopMicStream();

        if (blob.size < 500) {
          setMediaError("Gravação muito curta. Clique em Falar, fale por alguns segundos e depois Parar.");
          return;
        }
        void transcribeAudioBlob(blob);
      };

      recorder.onerror = () => {
        setIsRecording(false);
        stopMicStream();
        setMediaError("Erro ao gravar o microfone.");
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone start error:", err);
      setIsRecording(false);
      stopMicStream();

      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setMediaError("Microfone bloqueado. Clique no cadeado na barra do navegador e permita o microfone.");
      } else if (name === "NotFoundError") {
        setMediaError("Nenhum microfone foi encontrado no PC.");
      } else if (name === "NotReadableError") {
        setMediaError("Microfone em uso por outro app. Feche Zoom/Teams/Discord e tente de novo.");
      } else if (err instanceof Error && err.message) {
        setMediaError(`Não foi possível iniciar o microfone: ${err.message}`);
      } else {
        setMediaError("Não foi possível iniciar o microfone. Verifique a permissão no navegador.");
      }
    }
  };

  const handleEndInterview = (overrideTranscript?: typeof transcript) => {
    if (interviewTimerRef.current) clearInterval(interviewTimerRef.current);
    stopRecordingTracks();
    
    const finalTrans = overrideTranscript || transcript;

    const levelMultipliers: Record<string, number> = { A1: 65, A2: 75, B1: 82, B2: 88, C1: 94, C2: 98 };
    const base = levelMultipliers[currentLevel] || 75;

    const fluency = Math.min(100, Math.round(base + (Math.random() * 8)));
    const grammar = Math.min(100, Math.round(base - 5 + (Math.random() * 8)));
    const vocabulary = Math.min(100, Math.round(base - 2 + (Math.random() * 8)));
    const clarity = Math.min(100, Math.round(base + 1 + (Math.random() * 6)));

    const average = Math.round((fluency + grammar + vocabulary + clarity) / 4);

    setFinalScore(average);
    setCritScores({ fluency, grammar, vocabulary, clarity });

    let notes = "";
    if (average >= 90) {
      notes = `Excelente! Sua entrevista para o cargo de ${jobTitle} no nível ${currentLevel} foi fantástica. Seu vocabulário é sofisticado, a gramática está em alto nível, e a clareza nas respostas demonstra confiança corporativa internacional.`;
    } else if (average >= 75) {
      notes = `Muito bom desempenho! Você conseguiu se expressar de forma coerente e estruturada. Há pequenos deslizes gramaticais pontuais, mas a fluência é estável e a comunicação profissional está adequada para as demandas do cargo.`;
    } else {
      notes = `Bom esforço! Você se comunicou de forma compreensível. Para o cargo de ${jobTitle}, recomendamos reforçar expressões corporativas e treinar respostas curtas antes de longas explanações.`;
    }

    setFeedbackNotes(notes);

    const savedSession: InterviewSession = {
      jobTitle,
      duration,
      difficulty: currentLevel,
      score: average,
      scores: { fluency, grammar, vocabulary, clarity },
      transcript: finalTrans,
      feedback: notes,
      timestamp: new Date().toLocaleDateString("pt-BR")
    };

    onSaveInterview(savedSession);
    setStage("feedback");
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const renderCameraPreview = (
    videoRef: React.RefObject<HTMLVideoElement | null>,
    sizeClass: string,
    showToggle = false
  ) => (
    <div className={`bg-slate-900 rounded-xl relative overflow-hidden ${sizeClass} flex items-center justify-center border border-slate-800`}>
      {/* Always mounted so getUserMedia can attach even before "ready" paint */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity ${
          isCameraActive && mediaReady ? "opacity-100" : "opacity-0"
        }`}
      />

      {!(isCameraActive && mediaReady) && (
        <div className="flex flex-col items-center justify-center text-slate-400 space-y-2 z-10 px-4 text-center">
          {mediaLoading ? (
            <>
              <span className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-bold">Ligando câmera...</span>
            </>
          ) : (
            <>
              <VideoOff size={24} />
              <span className="text-[10px] font-bold">
                {mediaError
                  ? "Sem acesso à câmera"
                  : isCameraActive
                    ? "Aguardando câmera"
                    : "Câmera desligada"}
              </span>
              {(mediaError || !mediaReady) && (
                <button
                  type="button"
                  onClick={() => void startMedia(true)}
                  className="text-[10px] font-extrabold text-teal-300 hover:text-teal-200 underline cursor-pointer"
                >
                  Tentar habilitar câmera
                </button>
              )}
            </>
          )}
        </div>
      )}

      {isCameraActive && mediaReady && (
        <span className="absolute top-2 left-2 z-10 text-[9px] font-black tracking-widest text-teal-300 uppercase flex items-center gap-1 bg-black/50 px-2 py-1 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          Seu Vídeo (Ao vivo)
        </span>
      )}

      {showToggle && (
        <button
          type="button"
          onClick={() => {
            const next = !isCameraActive;
            setIsCameraActive(next);
            if (next && !mediaStreamRef.current?.getVideoTracks().length) {
              void startMedia(true);
            }
          }}
          className="absolute bottom-2 right-2 z-20 bg-black/60 hover:bg-black/80 border border-white/10 text-white p-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1"
        >
          {isCameraActive ? <VideoOff size={12} /> : <Video size={12} />}
          {isCameraActive ? "Desligar" : "Ligar câmera"}
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      
      {stage === "setup" && (
        <div className="bg-white rounded-3xl border border-slate-200/85 p-6 md:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Video className="text-teal-500" size={22} />
              Simulador de Entrevista de Emprego IA
            </h2>
            <p className="text-slate-500 text-xs">
              Prepare-se para processos seletivos internacionais. Escolha seu cargo ideal, configure o tempo e responda em inglês como em uma chamada real!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">Cargo Desejado</label>
                
                {showCustomInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customJobInput}
                      onChange={(e) => setCustomJobInput(e.target.value)}
                      placeholder="Ex: Senior Project Manager..."
                      className="grow bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500"
                    />
                    <button
                      onClick={() => setShowCustomInput(false)}
                      className="text-xs text-slate-500 font-bold border border-slate-200 rounded-xl px-3.5 hover:bg-slate-50 cursor-pointer"
                    >
                      Voltar à lista
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={jobTitle}
                      onChange={(e) => {
                        if (e.target.value === "custom") {
                          setShowCustomInput(true);
                        } else {
                          setJobTitle(e.target.value);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500"
                    >
                      {SAMPLE_JOBS.map((j) => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                      <option value="custom">Outro cargo (+ Personalizado)...</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">Duração da Chamada</label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15].map((t) => (
                    <button
                      key={t}
                      onClick={() => setDuration(t)}
                      className={`text-center py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        duration === t
                          ? "bg-teal-500/10 border-teal-500 text-teal-700"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {t} Minutos
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">Dificuldade da IA</label>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Award className="text-teal-500 w-4.5 h-4.5" />
                    Ajustado ao seu Nível Atual:
                  </span>
                  <span className="bg-teal-500 text-slate-950 px-2.5 py-1 rounded-lg">
                    {currentLevel}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  A entrevistadora adaptará a velocidade da fala, vocabulário e complexidade gramatical das perguntas de acordo com sua fase atual.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Checklist pré-chamada
                </h3>
                <ul className="space-y-2 text-xs text-slate-500 leading-relaxed font-medium">
                  <li className="flex gap-2 items-start">
                    <CheckCircle className={`shrink-0 w-4 h-4 mt-0.5 ${mediaReady ? "text-teal-500" : "text-slate-300"}`} />
                    <span>
                      {mediaReady
                        ? "Câmera e microfone do PC conectados."
                        : "Aguardando permissão de câmera e microfone..."}
                    </span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <CheckCircle className="text-teal-500 shrink-0 w-4 h-4 mt-0.5" />
                    <span>Microfone local + transcrição com IA (Gemini).</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <CheckCircle className="text-teal-500 shrink-0 w-4 h-4 mt-0.5" />
                    <span>Perguntas personalizadas para <strong className="text-slate-700 font-bold">{showCustomInput ? customJobInput || "Sua Escolha" : jobTitle}</strong>.</span>
                  </li>
                </ul>

                {mediaError && (
                  <div className="flex gap-2 items-start text-[11px] text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{mediaError}</span>
                  </div>
                )}
              </div>

              <div className="relative">
                {renderCameraPreview(setupVideoRef, "h-36", true)}
              </div>
            </div>

          </div>

          <div className="border-t border-slate-100 pt-5 flex items-center justify-end gap-3.5">
            <button
              onClick={onNavigateToDashboard}
              className="text-slate-500 hover:text-slate-800 text-xs font-bold px-4 py-2 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Voltar ao Painel
            </button>
            <button
              onClick={handleStartInterview}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold px-6 py-3 rounded-xl text-xs transition-all shadow-md shadow-teal-500/15 cursor-pointer flex items-center gap-1.5"
            >
              <Video size={14} />
              <span>Entrar na Videochamada</span>
            </button>
          </div>
        </div>
      )}

      {stage === "active" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center text-xs bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs px-5">
            <span className="font-extrabold text-teal-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              Entrevista: {jobTitle} ({currentLevel})
            </span>
            <div className="flex items-center gap-3.5 font-bold text-slate-500">
              <span className="bg-slate-100 px-3 py-1 rounded-lg">Tempo Restante: {formatTimer(secondsRemaining)}</span>
              <button
                onClick={() => setIsCameraActive((prev) => !prev)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                {isCameraActive ? <Video size={12} /> : <VideoOff size={12} />}
                {isCameraActive ? "Câmera" : "Sem câmera"}
              </button>
              <button
                onClick={() => handleEndInterview()}
                className="bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white px-3 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Encerrar Chamada
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            <div className="md:col-span-8 bg-slate-950 rounded-3xl relative overflow-hidden h-96 border border-slate-900 flex flex-col justify-between p-6">
              
              <div className="flex items-center gap-2.5 bg-black/40 border border-white/5 px-3 py-1.5 rounded-full w-fit self-start">
                <Volume2 size={12} className="text-teal-400 animate-bounce" />
                <span className="text-[9px] font-bold text-teal-400 uppercase tracking-widest">Entrevistadora IA (Sarah)</span>
              </div>

              <div className="flex flex-col items-center justify-center gap-3.5 my-auto text-white">
                <div className="w-20 h-20 rounded-3xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shadow-2xl relative">
                  <User size={40} />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-teal-500 border-2 border-slate-950 animate-ping" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className="font-bold text-sm">Sarah Parker</h4>
                  <p className="text-[10px] text-slate-400">Head of Talent Acquisition</p>
                </div>

                <div className="flex items-center gap-1.5 h-6 mt-1">
                  <span className="w-1 h-3 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <span className="w-1 h-5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                  <span className="w-1 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0.5s" }} />
                  <span className="w-1 h-4 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>

              <div className="bg-black/70 border border-white/10 px-5 py-4 rounded-2xl max-w-xl mx-auto w-full text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 text-teal-400">Closed Captions (Legenda ao vivo)</p>
                <p className="text-xs font-semibold text-white leading-relaxed">
                  "{questions[currentQuestionIndex] || "I am analyzing your profile, wait a moment..."}"
                </p>
              </div>

            </div>

            <div className="md:col-span-4 flex flex-col gap-4">
              
              {renderCameraPreview(activeVideoRef, "h-44 rounded-2xl")}

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs grow flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Progresso do Diálogo</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-slate-800">{currentQuestionIndex + 1}</span>
                    <span className="text-xs text-slate-400 font-bold">/ {questions.length} Perguntas</span>
                  </div>

                  <div className="flex gap-1 pt-1.5">
                    {questions.map((_, qidx) => (
                      <div 
                        key={qidx}
                        className={`grow h-1.5 rounded-full ${
                          qidx < currentQuestionIndex 
                            ? "bg-teal-500" 
                            : qidx === currentQuestionIndex 
                            ? "bg-teal-500 animate-pulse" 
                            : "bg-slate-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Histórico de Respostas</h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto text-[10px] leading-relaxed">
                    {transcript.slice(-4).map((line, lidx) => (
                      <div key={lidx} className="border-b border-slate-50 pb-1.5">
                        <span className={`font-extrabold ${line.sender === "interviewer" ? "text-teal-600" : "text-slate-600"} uppercase block`}>
                          {line.sender === "interviewer" ? "Sarah" : "Você"}
                        </span>
                        <p className="text-slate-500 line-clamp-2">"{line.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>

          <div className="bg-white rounded-3xl border border-slate-200/85 p-6 shadow-sm flex flex-col md:flex-row items-center gap-5">
            
            <div className="grow w-full space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">
                {isTranscribing
                  ? "Transcrevendo sua fala com IA..."
                  : isRecording
                    ? "Gravando... fale em inglês e clique em Parar"
                    : "Escreva ou fale sua resposta em inglês"}
              </label>
              <textarea
                value={userTextResponse}
                onChange={(e) => setUserTextResponse(e.target.value)}
                placeholder="Clique em Falar (Mic), responda em voz alta, depois Parar — ou digite aqui..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 resize-none placeholder:text-slate-300 leading-relaxed"
              />
              {mediaError && stage === "active" && (
                <p className="text-[11px] text-rose-600 font-medium">{mediaError}</p>
              )}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto shrink-0 self-end">
              <button
                onClick={() => void handleToggleMicrophone()}
                disabled={isTranscribing}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 py-3.5 px-5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                  isRecording 
                    ? "bg-rose-500 text-white animate-pulse" 
                    : isTranscribing
                      ? "bg-amber-50 text-amber-700 border border-amber-100"
                      : "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-100"
                }`}
              >
                {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                <span>
                  {isTranscribing ? "Transcrevendo..." : isRecording ? "Parar Mic" : "Falar (Mic)"}
                </span>
              </button>

              <button
                onClick={() => handleAnswerSubmit()}
                disabled={!userTextResponse.trim()}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-1 py-3.5 px-6 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  userTextResponse.trim()
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <span>Enviar Resposta</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </div>

        </div>
      )}

      {stage === "feedback" && (
        <div className="bg-white rounded-3xl border border-slate-200/85 p-6 md:p-8 shadow-sm space-y-8 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="space-y-1.5 text-center sm:text-left">
              <span className="text-[10px] text-teal-600 font-bold uppercase tracking-widest flex items-center gap-1 justify-center sm:justify-start">
                <Sparkles size={12} />
                Simulação Concluída!
              </span>
              <h2 className="text-xl font-bold text-slate-800">
                Resultado para o cargo de <strong className="text-teal-600">{jobTitle}</strong>
              </h2>
              <p className="text-xs text-slate-400 font-medium">Dificuldade: Nível {currentLevel} • {new Date().toLocaleDateString("pt-BR")}</p>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl shrink-0">
              <div className="text-center">
                <span className="text-3xl font-black text-slate-800">{finalScore}</span>
                <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider mt-0.5">Nota Geral</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50/50 text-center space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Fluência</span>
              <span className="text-lg font-black text-teal-600">{critScores.fluency}%</span>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-teal-500 h-full" style={{ width: `${critScores.fluency}%` }} />
              </div>
            </div>

            <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50/50 text-center space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Gramática</span>
              <span className="text-lg font-black text-teal-600">{critScores.grammar}%</span>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-teal-500 h-full" style={{ width: `${critScores.grammar}%` }} />
              </div>
            </div>

            <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50/50 text-center space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Vocabulário</span>
              <span className="text-lg font-black text-teal-600">{critScores.vocabulary}%</span>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-teal-500 h-full" style={{ width: `${critScores.vocabulary}%` }} />
              </div>
            </div>

            <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50/50 text-center space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Clareza</span>
              <span className="text-lg font-black text-teal-600">{critScores.clarity}%</span>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-teal-500 h-full" style={{ width: `${critScores.clarity}%` }} />
              </div>
            </div>

          </div>

          <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Feedback Executivo</span>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {feedbackNotes}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <MessageSquare size={12} />
              Transcrição Completa e Correções
            </h3>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {transcript.map((line, lidx) => (
                <div 
                  key={lidx} 
                  className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                    line.sender === "interviewer" 
                      ? "bg-teal-500/5 border-teal-100/50 text-teal-900" 
                      : "bg-white border-slate-100 text-slate-700"
                  }`}
                >
                  <span className={`font-black uppercase tracking-wider text-[10px] block mb-1.5 ${
                    line.sender === "interviewer" ? "text-teal-700" : "text-slate-500"
                  }`}>
                    {line.sender === "interviewer" ? "Sarah Parker (Interviewer)" : "Você (Candidate)"}
                  </span>
                  
                  <p className="font-semibold">"{line.text}"</p>

                  {line.correction && (
                    <div className="bg-rose-50/70 border border-rose-100 text-rose-800 p-3.5 rounded-xl mt-3 text-[11px]">
                      <span className="font-bold text-rose-700 block mb-0.5">Sugestão de Ajuste Gramatical:</span>
                      {line.correction}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => {
                setStage("setup");
                setTranscript([]);
                setUserTextResponse("");
                setCurrentQuestionIndex(0);
              }}
              className="w-full sm:w-auto text-slate-600 hover:bg-slate-50 border border-slate-200 font-bold px-6 py-3.5 rounded-xl text-xs cursor-pointer text-center"
            >
              Tentar Outro Cargo / Configuração
            </button>

            <button
              onClick={() => {
                setTranscript([]);
                setUserTextResponse("");
                setCurrentQuestionIndex(0);
                setSecondsRemaining(duration * 60);
                setTranscript([{ sender: "interviewer", text: questions[0] }]);
                setStage("active");
              }}
              className="w-full sm:w-auto bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold px-6 py-3.5 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} />
              <span>Repetir Entrevista</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
