import { useState, FormEvent } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { AuthUser, loginUser, registerUser } from "../lib/authApi";

interface AuthViewProps {
  onAuthenticated: (user: AuthUser) => void;
}

export function AuthView({ onAuthenticated }: AuthViewProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user =
        mode === "login"
          ? await loginUser({ email, password })
          : await registerUser({ name, email, password });
      onAuthenticated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível autenticar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 flex items-center justify-center px-4 py-10 font-sans">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-500/10">
            <BookOpen size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              English<span className="text-teal-500 font-extrabold">Flow</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
              Entre para continuar seus estudos
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-8">
          <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-white text-teal-600 shadow-xs border border-slate-200/40"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                mode === "register"
                  ? "bg-white text-teal-600 shadow-xs border border-slate-200/40"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Nome</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  autoComplete="name"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-400 focus:bg-white transition-colors"
                  placeholder="Seu nome"
                />
              </label>
            )}

            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-400 focus:bg-white transition-colors"
                placeholder="voce@email.com"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Senha</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-400 focus:bg-white transition-colors"
                placeholder="Mínimo 6 caracteres"
              />
            </label>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] text-sm font-bold px-4 py-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{mode === "login" ? "Entrar" : "Criar conta"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
