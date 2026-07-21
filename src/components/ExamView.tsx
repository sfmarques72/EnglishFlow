import React, { useEffect, useRef, useState } from "react";
import { Award, BookOpen, Volume2, Mic, MicOff, Play, CheckCircle2, AlertCircle, RefreshCw, ChevronRight, BookOpenCheck, ArrowRight, Sparkles, FileText } from "lucide-react";
import { ExamResult } from "../types";
import { requestWritingCorrection } from "../lib/writingCorrectApi";

interface ExamViewProps {
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  onExamFinished: (result: ExamResult) => void;
  onCancelExam: () => void;
}

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
}

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

export const ExamView: React.FC<ExamViewProps> = ({
  level,
  onExamFinished,
  onCancelExam,
}) => {
  const [examStep, setExamStep] = useState<"intro" | "block1" | "block2" | "block3" | "block4" | "results">("intro");
  
  // Answers tracking
  const [grammarAnswers, setGrammarAnswers] = useState<Record<number, number>>({});
  const [listeningAnswers, setListeningAnswers] = useState<Record<number, number>>({});
  const [speakingRecording, setSpeakingRecording] = useState<boolean>(false);
  const [speakingText, setSpeakingText] = useState<string>("");
  const [speakingRecorded, setSpeakingRecorded] = useState<boolean>(false);
  const [speakingTranscribing, setSpeakingTranscribing] = useState(false);
  const [speakingError, setSpeakingError] = useState<string | null>(null);
  const speakingRecorderRef = useRef<MediaRecorder | null>(null);
  const speakingStreamRef = useRef<MediaStream | null>(null);
  const speakingChunksRef = useRef<Blob[]>([]);

  const [writingText, setWritingText] = useState<string>("");
  const [writingCorrecting, setWritingCorrecting] = useState(false);
  const [writingFeedback, setWritingFeedback] = useState<{
    isCorrect?: boolean;
    correctedText?: string;
    feedback?: string;
    error?: string;
  } | null>(null);

  const [isPlayingListening, setIsPlayingListening] = useState<boolean>(false);
  const [listeningAudioPlayed, setListeningAudioPlayed] = useState<boolean>(false);
  const [listeningAudioError, setListeningAudioError] = useState<string | null>(null);
  const listeningUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Results state
  const [finalResult, setFinalResult] = useState<ExamResult | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      speakingRecorderRef.current?.stop();
      speakingStreamRef.current?.getTracks().forEach((t) => t.stop());
      speakingStreamRef.current = null;
    };
  }, []);

  // Generate specific exam questions based on CEFR level
  const getExamData = () => {
    switch (level) {
      case "A1":
        return {
          title: "Prova Oficial de Fase A1",
          grammarQuestions: [
            { id: 1, text: "I ___ from Brazil and I ___ in Rio de Janeiro.", options: ["am / live", "is / lives", "are / live", "am / lives"], correctAnswer: 0 },
            { id: 2, text: "My sister ___ coffee, but she ___ like tea.", options: ["like / doesn't", "likes / don't", "likes / doesn't", "like / don't"], correctAnswer: 2 },
            { id: 3, text: "There ___ some apples and ___ orange on the kitchen table.", options: ["is / an", "are / an", "are / a", "is / a"], correctAnswer: 1 }
          ],
          listeningText: "Hello! My name is Lucy. I am an engineer from Toronto, but now I live in London. Every morning, I wake up at 6:30 AM, drink some tea, and go to the park before work. I love running in the park when it is sunny.",
          listeningQuestions: [
            { id: 1, text: "What is Lucy's profession and where does she live now?", options: ["She is a doctor living in Toronto", "She is an engineer living in London", "She is a teacher living in London", "She is an engineer living in Toronto"], correctAnswer: 1 },
            { id: 2, text: "What does Lucy like to do in the morning when it is sunny?", options: ["Eat breakfast in the kitchen", "Run in the park", "Drink coffee at work", "Read a book in bed"], correctAnswer: 1 }
          ],
          speakingPrompt: "Sarah (IA): 'Tell me about yourself! What is your name, where do you live, and what do you like to do in your free time?'",
          writingPrompt: "Write a short message (2-3 sentences) in English introducing your family or introducing your home routine. (Minimum 15 words)"
        };
      case "A2":
        return {
          title: "Prova Oficial de Fase A2",
          grammarQuestions: [
            { id: 1, text: "Yesterday, I ___ to the beach and we ___ delicious fish.", options: ["travel / eat", "went / ate", "gone / eat", "went / eat"], correctAnswer: 1 },
            { id: 2, text: "This weekend, I ___ my grandmother. I already bought the bus ticket.", options: ["am going to visit", "will visit", "visit", "was visiting"], correctAnswer: 0 },
            { id: 3, text: "To learn English, you ___ practice speaking every day. It's my recommendation.", options: ["have to", "should", "shouldn't", "can't"], correctAnswer: 1 }
          ],
          listeningText: "Last vacation, my family and I traveled to Italy. We stayed in a small, historic hotel in Florence. On Monday, we visited the museum, which was the most beautiful place we saw. On Tuesday, we rented a car, but we didn't drive fast because it was raining.",
          listeningQuestions: [
            { id: 1, text: "Where did they stay during their vacation in Italy?", options: ["A modern apartment in Rome", "A small, historic hotel in Florence", "A resort near the beach", "A family house in Milan"], correctAnswer: 1 },
            { id: 2, text: "Why did they drive slowly on Tuesday?", options: ["Because they were tired", "Because the car was very old", "Because it was raining", "Because the traffic was horrible"], correctAnswer: 2 }
          ],
          speakingPrompt: "Sarah (IA): 'Describe your last weekend. Where did you go and what did you do? Tell me in 3-4 sentences.'",
          writingPrompt: "Write a small paragraph describing your favorite city in the world and why it is better than other places. (Minimum 20 words)"
        };
      case "B1":
        return {
          title: "Prova Oficial de Fase B1",
          grammarQuestions: [
            { id: 1, text: "I have lived in this apartment ___ five years, and I have studied English ___ 2021.", options: ["since / since", "for / for", "for / since", "since / for"], correctAnswer: 2 },
            { id: 2, text: "Have you ___ been to France? Yes, I ___ there last summer.", options: ["ever / went", "never / went", "ever / have been", "never / have been"], correctAnswer: 0 },
            { id: 3, text: "The new website ___ by our developer team last night.", options: ["is built", "was built", "has built", "built"], correctAnswer: 1 }
          ],
          listeningText: "I've been working as a graphic designer for a marketing company since I graduated in 2022. I really enjoy my career, although I have to work long hours occasionally. Last month, I managed my first international campaign, which was highly successful.",
          listeningQuestions: [
            { id: 1, text: "How long has the speaker been working as a graphic designer?", options: ["Since graduation in 2022", "For two months", "For five years", "Since last month"], correctAnswer: 0 },
            { id: 2, text: "What did the speaker do last month?", options: ["Graduated from university", "Changed their job", "Managed their first international campaign", "Took a long vacation abroad"], correctAnswer: 2 }
          ],
          speakingPrompt: "Sarah (IA): 'Tell me about your career history and what you have been working on recently.'",
          writingPrompt: "Describe a life-changing experience or a memorable trip you have made. Write 4-5 sentences in English. (Minimum 30 words)"
        };
      default: // B2, C1, C2 fallback
        return {
          title: `Prova Oficial de Fase ${level}`,
          grammarQuestions: [
            { id: 1, text: "If I ___ more time last night, I ___ the presentation.", options: ["had / would finish", "had had / would have finished", "have / will finish", "had / would have finished"], correctAnswer: 1 },
            { id: 2, text: "What we desperately need in this project ___ clear and transparent communication.", options: ["is", "are", "was", "be"], correctAnswer: 0 },
            { id: 3, text: "Seldom ___ such a highly motivated and skilled team of developers.", options: ["I have seen", "have I seen", "did I saw", "I saw"], correctAnswer: 1 }
          ],
          listeningText: "We need to acknowledge that corporate restructuring is a double-edged sword. While it streamlines operations and decreases expenditure, it also risks fracturing team cohesion. Seldom have we witnessed a smooth transition without substantial upfront change-management policies in place.",
          listeningQuestions: [
            { id: 1, text: "Why does the speaker refer to corporate restructuring as a double-edged sword?", options: ["Because it has positive financial effects but negative social risks", "Because it is completely negative", "Because it requires double the budget", "Because it's a very sharp and fast decision"], correctAnswer: 0 },
            { id: 2, text: "What is necessary according to the speaker for a smooth corporate transition?", options: ["Firing people quickly", "Substantial upfront change-management policies", "Increasing product prices", "Decreasing communication channels"], correctAnswer: 1 }
          ],
          speakingPrompt: "Sarah (IA): 'Express your opinion on remote work versus in-office work. Present a diplomatic counterpoint to the idea that offices are obsolete.'",
          writingPrompt: "Write a short argumentative paragraph in English discussing the ethical implications of artificial intelligence in today's workforce. (Minimum 45 words)"
        };
    }
  };

  const data = getExamData();

  const pickEnglishVoice = (): SpeechSynthesisVoice | null => {
    if (!("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    const preferred = voices.find(
      (v) =>
        /en(-|_)?(US|GB|AU)?/i.test(v.lang) &&
        /female|zira|samantha|susan|karen|moira|victoria|google uk english female/i.test(v.name)
    );
    if (preferred) return preferred;

    return (
      voices.find((v) => v.lang.toLowerCase().startsWith("en-us")) ||
      voices.find((v) => v.lang.toLowerCase().startsWith("en")) ||
      null
    );
  };

  const handlePlayListening = () => {
    setListeningAudioError(null);

    if (!("speechSynthesis" in window)) {
      setListeningAudioError("Seu navegador não tem síntese de voz. A transcrição será liberada para você continuar.");
      setListeningAudioPlayed(true);
      return;
    }

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(data.listeningText);
    utter.lang = "en-US";
    utter.rate = 0.92;
    utter.pitch = 1.05;

    const voice = pickEnglishVoice();
    if (voice) utter.voice = voice;

    // Chrome sometimes returns empty voices until voiceschanged fires
    if (!voice) {
      const onVoices = () => {
        const lateVoice = pickEnglishVoice();
        if (lateVoice) utter.voice = lateVoice;
        window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      };
      window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    }

    utter.onstart = () => {
      setIsPlayingListening(true);
    };
    utter.onend = () => {
      setIsPlayingListening(false);
      setListeningAudioPlayed(true);
      listeningUtteranceRef.current = null;
    };
    utter.onerror = () => {
      setIsPlayingListening(false);
      setListeningAudioPlayed(true);
      setListeningAudioError("Não foi possível reproduzir o áudio. Use a transcrição abaixo.");
      listeningUtteranceRef.current = null;
    };

    listeningUtteranceRef.current = utter;
    setIsPlayingListening(true);

    // Chrome: voices / speak can hang if called too soon after cancel
    window.setTimeout(() => {
      window.speechSynthesis.speak(utter);
      // Some Chrome builds pause the queue silently
      window.speechSynthesis.resume();
    }, 60);
  };

  const stopSpeakingStream = () => {
    speakingStreamRef.current?.getTracks().forEach((t) => t.stop());
    speakingStreamRef.current = null;
  };

  const transcribeSpeakingAudio = async (blob: Blob) => {
    setSpeakingTranscribing(true);
    setSpeakingError(null);
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
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || "Falha ao transcrever o áudio.");
      }
      const text = typeof payload.text === "string" ? payload.text.trim() : "";
      if (!text) {
        setSpeakingError("Não entendi o áudio. Fale de novo ou digite sua resposta abaixo.");
        setSpeakingRecorded(false);
        return;
      }
      setSpeakingText(text);
      setSpeakingRecorded(true);
    } catch (err) {
      console.error(err);
      setSpeakingError(
        err instanceof Error ? err.message : "Falha ao transcrever. Digite sua resposta abaixo."
      );
    } finally {
      setSpeakingTranscribing(false);
    }
  };

  const handleToggleSpeakingRecording = async () => {
    if (speakingTranscribing) return;

    if (speakingRecording) {
      const recorder = speakingRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      } else {
        setSpeakingRecording(false);
        stopSpeakingStream();
      }
      return;
    }

    try {
      setSpeakingError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setSpeakingError("Seu navegador não permite acesso ao microfone.");
        return;
      }
      if (typeof MediaRecorder === "undefined") {
        setSpeakingError("Gravação não é suportada neste navegador. Use Chrome ou Edge.");
        return;
      }

      stopSpeakingStream();
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      });

      speakingStreamRef.current = audioStream;
      speakingChunksRef.current = [];
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
          speakingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        setSpeakingRecording(false);
        speakingRecorderRef.current = null;
        const blob = new Blob(speakingChunksRef.current, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });
        speakingChunksRef.current = [];
        stopSpeakingStream();

        if (blob.size < 500) {
          setSpeakingError("Gravação muito curta. Clique no microfone, fale alguns segundos e pare.");
          return;
        }

        void transcribeSpeakingAudio(blob);
      };

      recorder.onerror = () => {
        setSpeakingRecording(false);
        stopSpeakingStream();
        setSpeakingError("Erro ao gravar o microfone.");
      };

      speakingRecorderRef.current = recorder;
      recorder.start(250);
      setSpeakingRecording(true);
      setSpeakingRecorded(false);
    } catch (err) {
      console.error(err);
      stopSpeakingStream();
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setSpeakingError("Microfone bloqueado. Permita o microfone no cadeado da barra do navegador.");
      } else if (name === "NotFoundError") {
        setSpeakingError("Nenhum microfone encontrado neste PC.");
      } else {
        setSpeakingError("Não foi possível iniciar o microfone.");
      }
    }
  };

  // Submit Exam and Calculate Score
  const handleSubmitExam = () => {
    // 1. Grammar Score (3 questions)
    let grammarCorrect = 0;
    data.grammarQuestions.forEach((q) => {
      if (grammarAnswers[q.id] === q.correctAnswer) {
        grammarCorrect++;
      }
    });
    const grammarScore = Math.round((grammarCorrect / data.grammarQuestions.length) * 100);

    // 2. Listening Score (2 questions)
    let listeningCorrect = 0;
    data.listeningQuestions.forEach((q) => {
      if (listeningAnswers[q.id] === q.correctAnswer) {
        listeningCorrect++;
      }
    });
    const listeningScore = Math.round((listeningCorrect / data.listeningQuestions.length) * 100);

    // 3. Speaking Score (simulated based on length of response)
    const speakingScore = speakingRecorded && speakingText.length > 20 ? 85 : 50;

    // 4. Writing Score (word count + AI correction if available)
    const wordCount = writingText.trim().split(/\s+/).filter(Boolean).length;
    let writingScore = 40;
    if (wordCount >= 30) {
      writingScore = 90;
    } else if (wordCount >= 15) {
      writingScore = 75;
    } else if (wordCount > 5) {
      writingScore = 60;
    }
    if (writingFeedback?.isCorrect === true) {
      writingScore = Math.min(100, writingScore + 5);
    } else if (writingFeedback?.isCorrect === false) {
      writingScore = Math.max(40, writingScore - 10);
    }

    // Average Score
    const overallScore = Math.round((grammarScore + listeningScore + speakingScore + writingScore) / 4);
    const passed = overallScore >= 70; // 70% to pass

    const weakPoints: string[] = [];
    const suggestedRevisionWeeks: number[] = [];

    if (grammarScore < 70) {
      weakPoints.push("Estrutura Gramatical (rever tempos verbais principais)");
      suggestedRevisionWeeks.push(1);
    }
    if (listeningScore < 70) {
      weakPoints.push("Compreensão Auditiva (praticar mais diálogos com velocidade natural)");
      suggestedRevisionWeeks.push(2);
    }
    if (speakingScore < 70) {
      weakPoints.push("Fluência Oral (gravar áudios e conferir pronúncia)");
      suggestedRevisionWeeks.push(3);
    }
    if (writingScore < 70) {
      weakPoints.push("Produção Escrita (escrever frases completas sem pressa)");
      suggestedRevisionWeeks.push(4);
    }

    if (suggestedRevisionWeeks.length === 0 && !passed) {
      suggestedRevisionWeeks.push(3, 4);
    }

    const examResult: ExamResult = {
      level,
      passed,
      score: overallScore,
      scores: {
        grammar: grammarScore,
        listening: listeningScore,
        speaking: speakingScore,
        writing: writingScore,
      },
      notes: passed
        ? `Excelente! Você demonstrou domínio das estruturas da Fase ${level}. Seu nível de conversação, escrita e listening está adequado para avançar.`
        : `Ainda faltam alguns detalhes para a fluência total da Fase ${level}. Recomendamos revisar o cronograma de estudos e tentar novamente. O aprendizado é um processo de repetição contínua.`,
      weakPoints,
      suggestedRevisionWeeks: Array.from(new Set(suggestedRevisionWeeks)),
      timestamp: new Date().toLocaleDateString("pt-BR"),
    };

    setFinalResult(examResult);
    setExamStep("results");
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 animate-fade-in space-y-6">
      
      {/* HEADER BAR FOR PROGRESS */}
      {examStep !== "intro" && examStep !== "results" && (
        <div className="space-y-3.5 border-b border-slate-100 pb-5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-extrabold text-teal-600 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpenCheck size={14} />
              {data.title}
            </span>
            <span className="text-slate-400 font-bold">
              {examStep === "block1" && "Bloco 1 de 4 (Gramática)"}
              {examStep === "block2" && "Bloco 2 de 4 (Listening)"}
              {examStep === "block3" && "Bloco 3 de 4 (Conversação)"}
              {examStep === "block4" && "Bloco 4 de 4 (Escrita)"}
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-teal-500 h-full transition-all duration-300"
              style={{
                width: 
                  examStep === "block1" ? "25%" :
                  examStep === "block2" ? "50%" :
                  examStep === "block3" ? "75%" : "100%"
              }}
            />
          </div>
        </div>
      )}

      {/* INTRO STEP */}
      {examStep === "intro" && (
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 rounded-3xl bg-teal-500/10 text-teal-600 flex items-center justify-center mx-auto shadow-md">
            <Award size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800">
              {data.title}
            </h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">
              Esta avaliação oficial testará suas competências e determinará se você está pronto para desbloquear o próximo nível no CEFR.
            </p>
          </div>

          {/* Exam conditions grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left">
            <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50/50 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Habilidades Testadas</span>
              <p className="text-xs font-bold text-slate-700">Gramática, Listening, Fala e Escrita</p>
            </div>
            <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50/50 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Meta de Desbloqueio</span>
              <p className="text-xs font-bold text-slate-700">Mínimo de 70% de acertos gerais</p>
            </div>
            <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50/50 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Estimativa de Duração</span>
              <p className="text-xs font-bold text-slate-700">Aproximadamente 10-15 minutos</p>
            </div>
            <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50/50 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Tentativas de Exame</span>
              <p className="text-xs font-bold text-slate-700">Ilimitadas (pode refazer quando quiser)</p>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-800 max-w-xl mx-auto flex items-start gap-2.5 text-left">
            <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-slate-600 font-medium">
              <strong className="text-slate-800 font-bold">Aviso importante:</strong> Certifique-se de estar em um ambiente silencioso e com áudio/microfone habilitados antes de prosseguir com os blocos de fala.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onCancelExam}
              className="text-slate-500 hover:text-slate-700 font-bold text-xs px-5 py-3 rounded-xl hover:bg-slate-50 cursor-pointer w-full sm:w-auto"
            >
              Voltar ao Painel
            </button>
            <button
              onClick={() => setExamStep("block1")}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold px-8 py-3.5 rounded-xl text-xs transition-all shadow-lg shadow-teal-500/20 cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <span>Iniciar Avaliação Oficial</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* BLOCK 1: GRAMMAR (3 MULTIPLE CHOICE) */}
      {examStep === "block1" && (
        <div className="space-y-6">
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-xs font-black">1</span>
              Gramática e Estruturação de Frases
            </h3>
            <p className="text-xs text-slate-500">
              Escolha a alternativa correta que preenche as lacunas respeitando as regras ensinadas na Fase {level}.
            </p>
          </div>

          <div className="space-y-5">
            {data.grammarQuestions.map((q, qidx) => (
              <div key={q.id} className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-3">
                <p className="text-xs font-bold text-slate-700 flex gap-2">
                  <span className="text-slate-400">{qidx + 1}.</span>
                  <span>{q.text}</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {q.options.map((opt, oidx) => {
                    const isSelected = grammarAnswers[q.id] === oidx;
                    return (
                      <button
                        key={oidx}
                        onClick={() => setGrammarAnswers({ ...grammarAnswers, [q.id]: oidx })}
                        className={`text-left text-xs p-3.5 rounded-xl border font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-teal-500/10 border-teal-500 text-teal-700"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setExamStep("intro")}
              className="text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
            >
              Anterior
            </button>
            <button
              onClick={() => setExamStep("block2")}
              disabled={Object.keys(grammarAnswers).length < data.grammarQuestions.length}
              className={`bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                Object.keys(grammarAnswers).length < data.grammarQuestions.length ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <span>Avançar para Listening</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* BLOCK 2: LISTENING COMPREHENSION */}
      {examStep === "block2" && (
        <div className="space-y-6">
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-xs font-black">2</span>
              Compreensão Auditiva (Listening)
            </h3>
            <p className="text-xs text-slate-500">
              Ouça o áudio da professora IA com atenção e depois responda às perguntas de compreensão e vocabulário.
            </p>
          </div>

          {/* Simulated Audio player */}
          <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex flex-col items-center justify-center gap-4 text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isPlayingListening ? "bg-teal-500 text-slate-950 animate-pulse scale-105" : "bg-white text-teal-600 shadow-xs hover:scale-105"
            }`}>
              <Volume2 size={24} />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700">Audio oficial da avaliação</p>
              <p className="text-[11px] text-slate-400 font-medium">Lucy fala sobre sua rotina, profissão ou viagem</p>
            </div>

            <button
              onClick={handlePlayListening}
              disabled={isPlayingListening}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isPlayingListening ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Lucy falando...</span>
                </>
              ) : (
                <>
                  <Play size={12} className="fill-current" />
                  <span>{listeningAudioPlayed ? "Ouvir Novamente" : "Tocar Áudio"}</span>
                </>
              )}
            </button>

            {listeningAudioError && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 max-w-md">
                {listeningAudioError}
              </p>
            )}

            {/* Transcript Reveal helper for accessibility */}
            {listeningAudioPlayed && (
              <div className="mt-3 text-left bg-white p-4 rounded-xl border border-slate-100 text-xs text-slate-500 leading-relaxed max-w-md">
                <span className="font-bold text-slate-700 block mb-1">Transcrição do Áudio (Acessibilidade):</span>
                "{data.listeningText}"
              </div>
            )}
          </div>

          {/* Listening Questions */}
          {listeningAudioPlayed && (
            <div className="space-y-5 animate-fade-in">
              {data.listeningQuestions.map((q, qidx) => (
                <div key={q.id} className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-3">
                  <p className="text-xs font-bold text-slate-700 flex gap-2">
                    <span className="text-slate-400">{qidx + 1}.</span>
                    <span>{q.text}</span>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {q.options.map((opt, oidx) => {
                      const isSelected = listeningAnswers[q.id] === oidx;
                      return (
                        <button
                          key={oidx}
                          onClick={() => setListeningAnswers({ ...listeningAnswers, [q.id]: oidx })}
                          className={`text-left text-xs p-3.5 rounded-xl border font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-teal-500/10 border-teal-500 text-teal-700"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setExamStep("block1")}
              className="text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
            >
              Anterior
            </button>
            <button
              onClick={() => setExamStep("block3")}
              disabled={Object.keys(listeningAnswers).length < data.listeningQuestions.length}
              className={`bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                Object.keys(listeningAnswers).length < data.listeningQuestions.length ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <span>Avançar para Conversação</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* BLOCK 3: SPEAKING (CONVERSATION) */}
      {examStep === "block3" && (
        <div className="space-y-6">
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-xs font-black">3</span>
              Competência Oral (Conversação)
            </h3>
            <p className="text-xs text-slate-500">
              Fale em voz alta em inglês para responder à pergunta da IA. Clique no microfone, fale e clique novamente para encerrar.
            </p>
          </div>

          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
            {/* Call Screen UI mockup */}
            <div className="bg-slate-900 p-6 flex flex-col items-center justify-center gap-5 text-center relative h-64 text-white">
              <div className="w-16 h-16 rounded-full bg-teal-500 flex items-center justify-center text-slate-950 font-black shadow-lg animate-pulse">
                S
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold">Professora IA • Sarah</p>
                <p className="text-[10px] text-teal-400 font-bold tracking-widest uppercase">Perguntando em Inglês...</p>
              </div>

              {/* Active voice wave graphic */}
              <div className="flex items-center gap-1 h-8">
                <div className="w-1 bg-teal-500 h-2 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <div className="w-1 bg-teal-500 h-6 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                <div className="w-1 bg-teal-500 h-4 rounded-full animate-bounce" style={{ animationDelay: "0.5s" }} />
                <div className="w-1 bg-teal-500 h-7 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                <div className="w-1 bg-teal-500 h-3 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
              </div>

              <div className="absolute bottom-4 left-4 right-4 bg-black/40 px-4 py-2.5 rounded-xl text-[11px] font-medium leading-relaxed max-w-xl mx-auto border border-white/5">
                {data.speakingPrompt}
              </div>
            </div>

            {/* Speaking actions and transcription */}
            <div className="bg-slate-50/50 p-6 flex flex-col items-center justify-center gap-4 text-center">
              {speakingRecording ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => void handleToggleSpeakingRecording()}
                    className="w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg cursor-pointer"
                    title="Parar gravação"
                  >
                    <MicOff size={22} />
                  </button>
                  <p className="text-xs font-bold text-rose-500 animate-pulse">
                    Gravando… clique de novo para parar
                  </p>
                </div>
              ) : speakingTranscribing ? (
                <div className="space-y-2">
                  <div className="w-14 h-14 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                    <RefreshCw size={22} className="animate-spin" />
                  </div>
                  <p className="text-xs font-bold text-slate-600">Transcrevendo seu áudio…</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => void handleToggleSpeakingRecording()}
                    className="w-14 h-14 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-105"
                    title="Gravar resposta"
                  >
                    <Mic size={22} />
                  </button>
                  <p className="text-xs font-bold text-slate-600">
                    {speakingRecorded ? "Refazer Gravação" : "Clique para Gravar Resposta"}
                  </p>
                </div>
              )}

              {speakingError && (
                <p className="text-[11px] text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 max-w-md">
                  {speakingError}
                </p>
              )}

              <div className="w-full max-w-md bg-white p-4 rounded-xl border border-slate-100 text-left space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  {speakingRecorded ? "Sua resposta (edite se precisar):" : "Ou digite sua resposta em inglês:"}
                </span>
                <textarea
                  value={speakingText}
                  onChange={(e) => {
                    setSpeakingText(e.target.value);
                    if (e.target.value.trim().length > 10) {
                      setSpeakingRecorded(true);
                    } else {
                      setSpeakingRecorded(false);
                    }
                  }}
                  rows={3}
                  placeholder="Ex: My name is Ana. I live in Recife and I like reading."
                  className="w-full text-xs font-semibold text-slate-700 leading-relaxed border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                />
                {speakingRecorded && speakingText.trim().length > 10 && (
                  <span className="text-[9px] text-teal-600 font-bold uppercase tracking-wider block">
                    ✓ Resposta pronta
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setExamStep("block2")}
              className="text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
            >
              Anterior
            </button>
            <button
              onClick={() => setExamStep("block4")}
              disabled={!speakingRecorded || speakingText.trim().length < 10}
              className={`bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                !speakingRecorded || speakingText.trim().length < 10 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <span>Avançar para Escrita</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* BLOCK 4: WRITING */}
      {examStep === "block4" && (
        <div className="space-y-6">
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-xs font-black">4</span>
              Produção Escrita (Writing)
            </h3>
            <p className="text-xs text-slate-500">
              Escreva a sua resposta em inglês no campo de texto abaixo conforme as diretrizes do tema.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Tema de Escrita</span>
              <p className="text-xs font-bold text-slate-700 leading-relaxed">
                {data.writingPrompt}
              </p>
            </div>

            <div className="space-y-1.5">
              <textarea
                value={writingText}
                onChange={(e) => {
                  setWritingText(e.target.value);
                  setWritingFeedback(null);
                }}
                placeholder="Type your response here in English..."
                rows={6}
                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 placeholder:text-slate-300 resize-none leading-relaxed"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-bold uppercase">
                <span>Contagem de palavras: {writingText.trim().split(/\s+/).filter(Boolean).length}</span>
                <span>Mínimo ideal: {level === "A1" ? "15" : level === "A2" ? "20" : level === "B1" ? "30" : "45"} palavras</span>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    if (writingText.trim().length < 10 || writingCorrecting) return;
                    setWritingCorrecting(true);
                    setWritingFeedback(null);
                    try {
                      const result = await requestWritingCorrection({
                        text: writingText,
                        level,
                        prompt: data.writingPrompt,
                        context: "exam-writing",
                      });
                      setWritingFeedback({
                        isCorrect: result.isCorrect,
                        correctedText: result.correctedText,
                        feedback: result.feedback,
                      });
                    } catch (err) {
                      setWritingFeedback({
                        error: err instanceof Error ? err.message : "Falha ao corrigir.",
                      });
                    } finally {
                      setWritingCorrecting(false);
                    }
                  }}
                  disabled={writingText.trim().length < 10 || writingCorrecting}
                  className={`text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 border transition-all ${
                    writingText.trim().length >= 10 && !writingCorrecting
                      ? "bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700 cursor-pointer"
                      : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  }`}
                >
                  {writingCorrecting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      Corrigindo…
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      Corrigir com a Sarah
                    </>
                  )}
                </button>
              </div>

              {writingFeedback?.error && (
                <p className="text-[11px] text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                  {writingFeedback.error}
                </p>
              )}

              {writingFeedback && !writingFeedback.error && writingFeedback.feedback && (
                <div
                  className={`rounded-xl px-3 py-2.5 text-[11px] leading-relaxed space-y-1.5 border ${
                    writingFeedback.isCorrect
                      ? "bg-teal-50/70 border-teal-100 text-teal-900"
                      : "bg-amber-50 border-amber-100 text-amber-950"
                  }`}
                >
                  <p className="font-semibold flex items-start gap-1.5">
                    {writingFeedback.isCorrect ? (
                      <CheckCircle2 size={13} className="text-teal-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <span>{writingFeedback.feedback}</span>
                  </p>
                  {!writingFeedback.isCorrect && writingFeedback.correctedText && (
                    <>
                      <p className="font-mono text-slate-800 bg-white/70 border border-amber-100/60 rounded-lg px-2.5 py-1.5 whitespace-pre-wrap">
                        Versão corrigida: {writingFeedback.correctedText}
                      </p>
                      <button
                        type="button"
                        onClick={() => setWritingText(writingFeedback.correctedText || "")}
                        className="text-[10px] font-bold text-indigo-700 underline cursor-pointer"
                      >
                        Usar versão corrigida no campo
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center gap-3">
            <button
              onClick={() => setExamStep("block3")}
              className="text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
            >
              Anterior
            </button>
            <div className="flex flex-col items-end gap-1.5">
              {!writingFeedback?.feedback && !writingFeedback?.error && (
                <p className="text-[11px] text-amber-600 font-medium">
                  Peça a correção da Sarah antes de finalizar
                </p>
              )}
              <button
                onClick={handleSubmitExam}
                disabled={
                  writingText.trim().length < 10 ||
                  writingCorrecting ||
                  (!writingFeedback?.feedback && !writingFeedback?.error)
                }
                className={`bg-slate-900 text-white hover:bg-slate-800 font-extrabold px-8 py-3.5 rounded-xl text-xs transition-all shadow-md flex items-center gap-2 border ${
                  writingText.trim().length >= 10 &&
                  !writingCorrecting &&
                  (writingFeedback?.feedback || writingFeedback?.error)
                    ? "cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <FileText size={14} />
                <span>Finalizar e Enviar Prova</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS STEP */}
      {examStep === "results" && finalResult && (
        <div className="space-y-8 animate-fade-in py-2">
          
          {/* Main Success or Fail header */}
          <div className="text-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-md ${
              finalResult.passed 
                ? "bg-emerald-500/10 text-emerald-600" 
                : "bg-rose-500/10 text-rose-600"
            }`}>
              {finalResult.passed ? <CheckCircle2 size={36} /> : <AlertCircle size={36} />}
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2.5xl font-black text-slate-800">
                {finalResult.passed ? "Parabéns! Você Passou! 🎉" : "Não foi dessa vez..."}
              </h2>
              <p className="text-slate-500 text-xs">
                Nota Geral Obtida: <strong className="text-slate-800 text-sm font-black">{finalResult.score}%</strong> (Mínimo de 70% necessário)
              </p>
            </div>
          </div>

          {/* Skill metrics breakdown */}
          <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
              Aproveitamento por Competência
            </h3>

            <div className="space-y-4 max-w-md mx-auto">
              {/* Grammar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">Gramática e Estruturação</span>
                  <span className="font-black text-slate-800">{finalResult.scores.grammar}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full transition-all duration-500" style={{ width: `${finalResult.scores.grammar}%` }} />
                </div>
              </div>

              {/* Listening */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">Compreensão Auditiva (Listening)</span>
                  <span className="font-black text-slate-800">{finalResult.scores.listening}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full transition-all duration-500" style={{ width: `${finalResult.scores.listening}%` }} />
                </div>
              </div>

              {/* Speaking */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">Competência Oral (Speaking)</span>
                  <span className="font-black text-slate-800">{finalResult.scores.speaking}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full transition-all duration-500" style={{ width: `${finalResult.scores.speaking}%` }} />
                </div>
              </div>

              {/* Writing */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">Produção Escrita (Writing)</span>
                  <span className="font-black text-slate-800">{finalResult.scores.writing}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full transition-all duration-500" style={{ width: `${finalResult.scores.writing}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Feedback & Weak Points */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Avaliação Geral do Tutor</span>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {finalResult.notes}
              </p>
            </div>

            {finalResult.weakPoints.length > 0 && (
              <div className="space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-700">
                <span className="text-[10px] text-rose-500 font-bold uppercase tracking-widest block">Pontos que Requerem Atenção:</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-500 font-medium">
                  {finalResult.weakPoints.map((pt, pidx) => (
                    <li key={pidx}>{pt}</li>
                  ))}
                </ul>
              </div>
            )}

            {!finalResult.passed && finalResult.suggestedRevisionWeeks.length > 0 && (
              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-800 flex items-start gap-2.5">
                <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Estratégia de Estudo Recomendada:</p>
                  <p className="text-slate-600 font-medium">
                    Revise os temas e faça novamente as sessões práticas da <strong className="text-slate-800 font-bold">Semana {finalResult.suggestedRevisionWeeks.join(", ")}</strong> do seu cronograma para consolidar o vocabulário e as estruturas. Isso aumentará suas chances de sucesso na próxima tentativa!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {finalResult.passed ? (
              <button
                onClick={() => onExamFinished(finalResult)}
                className="w-full sm:w-auto bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold px-8 py-3.5 rounded-xl text-xs shadow-md shadow-teal-500/10 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Desbloquear Próxima Fase</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setGrammarAnswers({});
                    setListeningAnswers({});
                    setSpeakingRecorded(false);
                    setSpeakingText("");
                    setWritingText("");
                    setListeningAudioPlayed(false);
                    setExamStep("intro");
                  }}
                  className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 font-bold px-6 py-3.5 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} />
                  <span>Tentar Novamente</span>
                </button>
                <button
                  onClick={onCancelExam}
                  className="w-full sm:w-auto text-slate-600 hover:bg-slate-50 border border-slate-200 font-bold px-6 py-3.5 rounded-xl text-xs cursor-pointer"
                >
                  Voltar ao Cronograma
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
