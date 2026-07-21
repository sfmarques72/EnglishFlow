import { useState, useEffect } from "react";
import { Navigation } from "./components/Navigation";
import { DashboardView } from "./components/DashboardView";
import { ScheduleView } from "./components/ScheduleView";
import { ProgressView } from "./components/ProgressView";
import { ActiveSessionView } from "./components/ActiveSessionView";
import { JourneyView } from "./components/JourneyView";
import { ExamView } from "./components/ExamView";
import { InterviewView } from "./components/InterviewView";
import { PlacementView } from "./components/PlacementView";
import { ReadingView } from "./components/ReadingView";
import { AuthView } from "./components/AuthView";
import { STUDY_SCHEDULE, getSessionsForLevel } from "./data/schedule";
import { Session, ErrorLog, AppState, ExamResult, InterviewSession } from "./types";
import { AuthUser, fetchCurrentUser, logoutUser } from "./lib/authApi";
import { extractErrorsFromInterview, mergeErrorLogs } from "./lib/extractSessionErrors";
import { BookOpen, Loader2, RotateCcw } from "lucide-react";

const LOCAL_STORAGE_KEY = "englishflow_student_state_v2";

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<string>("dashboard");
  
  // Persisted state
  const [completedSessions, setCompletedSessions] = useState<string[]>([]);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [lastStudyDate, setLastStudyDate] = useState<string | null>(null);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [userGrammarSentences, setUserGrammarSentences] = useState<{ [sessionId: string]: { [cardId: string]: string } }>({});
  const [selectedLevel, setSelectedLevel] = useState<"A1" | "A2" | "B1" | "B2" | "C1" | "C2">("A1");
  const [unlockedLevels, setUnlockedLevels] = useState<string[]>(["A1"]);
  const [completedExams, setCompletedExams] = useState<{ [level: string]: ExamResult }>({});
  const [interviewHistory, setInterviewHistory] = useState<InterviewSession[]>([]);
  const [placementTestResult, setPlacementTestResult] = useState<"A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null>(null);

  // Active Session state
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  // Resolve authenticated session on mount
  useEffect(() => {
    let cancelled = false;

    fetchCurrentUser()
      .then((user) => {
        if (!cancelled) setAuthUser(user);
      })
      .catch(() => {
        if (!cancelled) setAuthUser(null);
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: AppState = JSON.parse(saved);
        setCompletedSessions(parsed.completedSessions || []);
        setStreakCount(parsed.streakCount || 0);
        setLastStudyDate(parsed.lastStudyDate || null);
        setErrorLogs(parsed.errorLogs || []);
        setUserGrammarSentences(parsed.userGrammarSentences || {});
        setSelectedLevel(parsed.selectedLevel || "A1");
        setUnlockedLevels(parsed.unlockedLevels && parsed.unlockedLevels.length > 0 ? parsed.unlockedLevels : ["A1"]);
        setCompletedExams(parsed.completedExams || {});
        setInterviewHistory(parsed.interviewHistory || []);
        setPlacementTestResult(parsed.placementTestResult || null);
      }
    } catch (e) {
      console.error("Failed to load local storage state:", e);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error("Failed to logout:", e);
    } finally {
      setAuthUser(null);
      setActiveSession(null);
      setCurrentView("dashboard");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center text-slate-500">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Loader2 size={18} className="animate-spin text-teal-500" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <AuthView onAuthenticated={setAuthUser} />;
  }

  // Save state helper
  const saveStateToLocalStorage = (
    completed: string[],
    streak: number,
    lastDate: string | null,
    logs: ErrorLog[],
    sentences: { [sessionId: string]: { [cardId: string]: string } },
    levelToSave: "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
    unlocked: string[],
    exams: { [level: string]: ExamResult },
    interviews: InterviewSession[],
    placement: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null
  ) => {
    try {
      const stateToSave: AppState = {
        completedSessions: completed,
        streakCount: streak,
        lastStudyDate: lastDate,
        errorLogs: logs,
        userGrammarSentences: sentences,
        selectedLevel: levelToSave,
        unlockedLevels: unlocked,
        completedExams: exams,
        interviewHistory: interviews,
        placementTestResult: placement
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Failed to save state to local storage:", e);
    }
  };

  const handleLevelChange = (level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2") => {
    setSelectedLevel(level);
    saveStateToLocalStorage(
      completedSessions,
      streakCount,
      lastStudyDate,
      errorLogs,
      userGrammarSentences,
      level,
      unlockedLevels,
      completedExams,
      interviewHistory,
      placementTestResult
    );
  };

  // Find the next recommended session that hasn't been completed
  const getNextRecommendedSession = (): Session => {
    const levelSessions = getSessionsForLevel(selectedLevel);
    const next = levelSessions.find((s) => !completedSessions.includes(s.id));
    return next || levelSessions[levelSessions.length - 1] || STUDY_SCHEDULE[0];
  };

  const handleStartSession = (session: Session) => {
    // If starting a session, make sure its level is selected
    if (session.level !== selectedLevel) {
      setSelectedLevel(session.level);
    }
    setActiveSession(session);
    setCurrentView("session");
  };

  // Handle study session completion
  const handleFinishSession = (newErrorLogs?: Omit<ErrorLog, "id" | "timestamp">[]) => {
    if (!activeSession) return;

    const todayStr = new Date().toISOString().split("T")[0];
    let newStreak = streakCount;

    // Streak count calculation
    if (lastStudyDate === todayStr) {
      // Already studied today, keep streak the same
    } else if (lastStudyDate) {
      const lastDate = new Date(lastStudyDate);
      const todayDate = new Date(todayStr);
      const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1; // reset streak if skipped days
      }
    } else {
      newStreak = 1; // first day studying ever
    }

    const updatedCompleted = completedSessions.includes(activeSession.id)
      ? completedSessions
      : [...completedSessions, activeSession.id];

    const updatedLogs = mergeErrorLogs(errorLogs, newErrorLogs || []);

    setCompletedSessions(updatedCompleted);
    setStreakCount(newStreak);
    setLastStudyDate(todayStr);
    setErrorLogs(updatedLogs);

    // Save
    saveStateToLocalStorage(
      updatedCompleted,
      newStreak,
      todayStr,
      updatedLogs,
      userGrammarSentences,
      selectedLevel,
      unlockedLevels,
      completedExams,
      interviewHistory,
      placementTestResult
    );
  };

  // Save grammar sentence card per card
  const handleSaveSentence = (cardId: string, text: string) => {
    if (!activeSession) return;

    const updatedSentences = {
      ...userGrammarSentences,
      [activeSession.id]: {
        ...(userGrammarSentences[activeSession.id] || {}),
        [cardId]: text
      }
    };

    setUserGrammarSentences(updatedSentences);
    saveStateToLocalStorage(
      completedSessions,
      streakCount,
      lastStudyDate,
      errorLogs,
      updatedSentences,
      selectedLevel,
      unlockedLevels,
      completedExams,
      interviewHistory,
      placementTestResult
    );
  };

  // Delete logged error
  const handleDeleteErrorLog = (id: string) => {
    const updatedLogs = errorLogs.filter((log) => log.id !== id);
    setErrorLogs(updatedLogs);
    saveStateToLocalStorage(
      completedSessions,
      streakCount,
      lastStudyDate,
      updatedLogs,
      userGrammarSentences,
      selectedLevel,
      unlockedLevels,
      completedExams,
      interviewHistory,
      placementTestResult
    );
  };

  // Reset all course statistics
  const handleResetCourseProgress = () => {
    if (window.confirm("Tem certeza que deseja reiniciar todo seu cronograma de estudos, caderno de erros, histórico de entrevistas e exames concluídos do EnglishFlow?")) {
      setCompletedSessions([]);
      setStreakCount(0);
      setLastStudyDate(null);
      setErrorLogs([]);
      setUserGrammarSentences({});
      setSelectedLevel("A1");
      setUnlockedLevels(["A1"]);
      setCompletedExams({});
      setInterviewHistory([]);
      setPlacementTestResult(null);
      setActiveSession(null);
      setCurrentView("dashboard");
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const nextSession = getNextRecommendedSession();

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 flex flex-col font-sans">
      
      {/* Header and top tab navigator */}
      <Navigation
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          // If they click on "Sessão Estudo" without active, set the recommended
          if (view === "session" && !activeSession) {
            setActiveSession(nextSession);
          }
        }}
        streakCount={streakCount}
        hasActiveSession={!!activeSession}
        onStartTodaySession={() => handleStartSession(nextSession)}
        userName={authUser.name}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="grow max-w-7xl w-full mx-auto px-4 py-8 md:px-8">
        
        {currentView === "dashboard" && (
          <DashboardView
            completedSessions={completedSessions}
            streakCount={streakCount}
            nextSession={nextSession}
            onStartSession={handleStartSession}
            onViewChange={setCurrentView}
            selectedLevel={selectedLevel}
            onLevelChange={handleLevelChange}
            unlockedLevels={unlockedLevels}
          />
        )}

        {currentView === "journey" && (
          <JourneyView
            unlockedLevels={unlockedLevels}
            selectedLevel={selectedLevel}
            onLevelChange={handleLevelChange}
            completedSessions={completedSessions}
            onStartSession={handleStartSession}
            onNavigateToExam={(lvl) => {
              setSelectedLevel(lvl);
              setCurrentView("exam");
            }}
          />
        )}

        {currentView === "session" && activeSession && (
          <ActiveSessionView
            session={activeSession}
            onFinishSession={handleFinishSession}
            onCloseSession={() => {
              setActiveSession(null);
              setCurrentView("dashboard");
            }}
            userSentences={userGrammarSentences[activeSession.id] || {}}
            onSaveSentence={handleSaveSentence}
          />
        )}

        {currentView === "schedule" && (
          <ScheduleView
            completedSessions={completedSessions}
            nextSession={nextSession}
            onStartSession={handleStartSession}
            selectedLevel={selectedLevel}
            onLevelChange={handleLevelChange}
            unlockedLevels={unlockedLevels}
          />
        )}

        {currentView === "reading" && (
          <ReadingView selectedLevel={selectedLevel} />
        )}

        {currentView === "progress" && (
          <ProgressView
            completedSessions={completedSessions}
            streakCount={streakCount}
            errorLogs={errorLogs}
            onDeleteErrorLog={handleDeleteErrorLog}
            unlockedLevels={unlockedLevels}
            interviewHistory={interviewHistory}
          />
        )}

        {currentView === "exam" && (
          <ExamView
            level={selectedLevel}
            onCancelExam={() => setCurrentView("dashboard")}
            onExamFinished={(result) => {
              const updatedExams = { ...completedExams, [selectedLevel]: result };
              setCompletedExams(updatedExams);
              
              // Unlock next level logic
              let updatedUnlocked = [...unlockedLevels];
              const levelsSequence: Array<"A1" | "A2" | "B1" | "B2" | "C1" | "C2"> = ["A1", "A2", "B1", "B2", "C1", "C2"];
              const currentIndex = levelsSequence.indexOf(selectedLevel);
              let nextLvl: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null = null;
              
              if (currentIndex !== -1 && currentIndex < levelsSequence.length - 1) {
                nextLvl = levelsSequence[currentIndex + 1];
                if (!updatedUnlocked.includes(nextLvl)) {
                  updatedUnlocked.push(nextLvl);
                }
              }

              setUnlockedLevels(updatedUnlocked);

              // Switch to next level if available
              if (nextLvl) {
                setSelectedLevel(nextLvl);
              }
              
              saveStateToLocalStorage(
                completedSessions,
                streakCount,
                lastStudyDate,
                errorLogs,
                userGrammarSentences,
                nextLvl || selectedLevel,
                updatedUnlocked,
                updatedExams,
                interviewHistory,
                placementTestResult
              );

              // Redirect to journey maps showing their shiny new unlocked levels
              setCurrentView("journey");
            }}
          />
        )}

        {currentView === "interview" && (
          <InterviewView
            currentLevel={selectedLevel}
            onNavigateToDashboard={() => setCurrentView("dashboard")}
            onSaveInterview={(newSession) => {
              const updatedHistory = [newSession, ...interviewHistory];
              setInterviewHistory(updatedHistory);
              const interviewErrors = extractErrorsFromInterview(newSession);
              const updatedLogs = mergeErrorLogs(errorLogs, interviewErrors);
              setErrorLogs(updatedLogs);
              saveStateToLocalStorage(
                completedSessions,
                streakCount,
                lastStudyDate,
                updatedLogs,
                userGrammarSentences,
                selectedLevel,
                unlockedLevels,
                completedExams,
                updatedHistory,
                placementTestResult
              );
            }}
          />
        )}

        {currentView === "placement" && (
          <PlacementView
            onCancel={() => setCurrentView("dashboard")}
            onApplyRecommendedLevel={(lvl) => {
              setPlacementTestResult(lvl);
              
              // Unlock all levels up to recommended
              const levelsSequence: Array<"A1" | "A2" | "B1" | "B2" | "C1" | "C2"> = ["A1", "A2", "B1", "B2", "C1", "C2"];
              const targetIdx = levelsSequence.indexOf(lvl);
              const updatedUnlocked: string[] = [];
              for (let i = 0; i <= targetIdx; i++) {
                updatedUnlocked.push(levelsSequence[i]);
              }

              setUnlockedLevels(updatedUnlocked);
              setSelectedLevel(lvl);

              saveStateToLocalStorage(
                completedSessions,
                streakCount,
                lastStudyDate,
                errorLogs,
                userGrammarSentences,
                lvl,
                updatedUnlocked,
                completedExams,
                interviewHistory,
                lvl
              );

              setCurrentView("dashboard");
            }}
          />
        )}

      </main>

      {/* Platform footer */}
      <footer className="bg-white border-t border-slate-100 py-6 px-4 md:px-8 mt-12 text-center text-xs text-slate-400 space-y-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-teal-500" />
            <span className="font-bold text-slate-700">EnglishFlow</span>
            <span className="text-slate-300">|</span>
            <span>Aprenda inglês grátis de conversação prática com IA — Do A1 ao C2</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleResetCourseProgress}
              className="text-rose-500 hover:text-rose-600 font-bold hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw size={12} />
              <span>Resetar Todo Progresso</span>
            </button>
            <span className="text-slate-300">|</span>
            <span>© 2026 EnglishFlow</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
