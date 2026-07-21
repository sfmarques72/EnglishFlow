import React, { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Calendar,
  BarChart3,
  Flame,
  Play,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Map,
  Award,
  ClipboardCheck,
  Mic2,
  Library,
} from "lucide-react";

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  streakCount: number;
  hasActiveSession: boolean;
  onStartTodaySession: () => void;
  userName: string;
  onLogout: () => void;
}

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

type NavCategory = {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
};

const NAV_CATEGORIES: NavCategory[] = [
  {
    id: "study",
    label: "Estudar",
    icon: <BookOpen size={14} />,
    items: [
      { id: "session", label: "Sessão Estudo", icon: <Play size={14} /> },
      { id: "reading", label: "Leitura", icon: <Library size={14} /> },
      { id: "journey", label: "Trilha de Fases", icon: <Map size={14} /> },
      { id: "schedule", label: "Cronograma", icon: <Calendar size={14} /> },
    ],
  },
  {
    id: "practice",
    label: "Praticar",
    icon: <Mic2 size={14} />,
    items: [
      { id: "interview", label: "Entrevista IA", icon: <Play size={14} /> },
      { id: "exam", label: "Exame de Nível", icon: <Award size={14} /> },
      { id: "placement", label: "Nivelamento", icon: <ClipboardCheck size={14} /> },
    ],
  },
  {
    id: "progress",
    label: "Progresso",
    icon: <BarChart3 size={14} />,
    items: [
      { id: "progress", label: "Meu Progresso", icon: <BarChart3 size={14} /> },
    ],
  },
];

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onViewChange,
  streakCount,
  hasActiveSession,
  onStartTodaySession,
  userName,
  onLogout,
}) => {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenCategory(null);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenCategory(null);
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setOpenCategory(null);
  }, [currentView]);

  const isCategoryActive = (category: NavCategory) =>
    category.items.some((item) => item.id === currentView);

  const handleCategoryClick = (categoryId: string) => {
    setOpenCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  const handleItemClick = (viewId: string) => {
    onViewChange(viewId);
    setOpenCategory(null);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm px-4 py-3.5 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div
          onClick={() => onViewChange("dashboard")}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-2xl bg-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-500/10 group-hover:bg-teal-600 transition-all">
            <BookOpen size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              English<span className="text-teal-500 font-extrabold">Flow</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
              Nível A1-C2 • Fluência de Conversação
            </p>
          </div>
        </div>

        {/* Categorized nav */}
        <nav
          ref={navRef}
          className="flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-200 w-full lg:w-auto justify-center gap-1"
        >
          <button
            onClick={() => handleItemClick("dashboard")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              currentView === "dashboard"
                ? "bg-white text-teal-600 shadow-xs border border-slate-200/40"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <LayoutDashboard size={14} />
            <span>Painel</span>
          </button>

          {NAV_CATEGORIES.map((category) => {
            const active = isCategoryActive(category);
            const open = openCategory === category.id;
            const singleItem = category.items.length === 1;

            if (singleItem) {
              const item = category.items[0];
              return (
                <button
                  key={category.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    currentView === item.id
                      ? "bg-white text-teal-600 shadow-xs border border-slate-200/40"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {category.icon}
                  <span>{category.label}</span>
                </button>
              );
            }

            return (
              <div key={category.id} className="relative">
                <button
                  onClick={() => handleCategoryClick(category.id)}
                  aria-expanded={open}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    active || open
                      ? "bg-white text-teal-600 shadow-xs border border-slate-200/40"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {category.icon}
                  <span>{category.label}</span>
                  <ChevronDown
                    size={12}
                    className={`transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>

                {open && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 min-w-[200px] bg-white border border-slate-200 rounded-2xl shadow-lg p-1.5 animate-fade-in">
                    {category.items.map((item) => {
                      const selected = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                            selected
                              ? "bg-teal-50 text-teal-700"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <span className={selected ? "text-teal-600" : "text-slate-400"}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end shrink-0">
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl px-3 py-1.5 text-xs font-bold shadow-xs">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-600 animate-pulse" />
            <span>
              {streakCount} {streakCount === 1 ? "dia" : "dias"}
            </span>
          </div>

          <div
            className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500 max-w-[120px] truncate"
            title={userName}
          >
            {userName}
          </div>

          <button
            onClick={onLogout}
            className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-3 py-2 rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Sair"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sair</span>
          </button>

          {hasActiveSession ? (
            <button
              onClick={() => onViewChange("session")}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 active:scale-98 text-xs font-extrabold px-4 py-2.5 rounded-2xl transition-all shadow-md shadow-teal-500/10 cursor-pointer flex items-center gap-1.5"
            >
              <Play size={14} className="fill-slate-950 text-slate-950" />
              <span>Sessão Ativa</span>
            </button>
          ) : (
            <button
              onClick={onStartTodaySession}
              className="bg-slate-900 text-white hover:bg-slate-800 active:scale-98 text-xs font-bold px-4 py-2.5 rounded-2xl transition-all cursor-pointer border border-slate-800/20"
            >
              Iniciar Hoje
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
