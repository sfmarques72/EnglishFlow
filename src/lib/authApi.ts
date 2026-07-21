export type AuthUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

type AuthResponse = {
  user: AuthUser;
  token?: string;
};

type ErrorResponse = {
  error?: string;
};

const TOKEN_KEY = "englishflow_auth_token";

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

function authHeaders(json = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";
  const token = getStoredToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function readErrorMessage(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = (await res.json().catch(() => ({}))) as ErrorResponse;
    if (data.error) return data.error;
  } else {
    const text = await res.text().catch(() => "");
    if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
      return `API indisponível (HTTP ${res.status}). Confira /api/health no deploy da Vercel.`;
    }
    if (text.trim()) return text.slice(0, 180);
  }
  return `Falha na autenticação (HTTP ${res.status}).`;
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return (await res.json()) as T;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me", {
    credentials: "include",
    headers: authHeaders(),
  });

  if (res.status === 401) {
    setStoredToken(null);
    return null;
  }

  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }

  const data = (await res.json()) as AuthResponse;
  return data.user;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthUser> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    credentials: "include",
    headers: authHeaders(true),
    body: JSON.stringify(input),
  });
  const data = await parseJson<AuthResponse>(res);
  if (data.token) setStoredToken(data.token);
  return data.user;
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthUser> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: authHeaders(true),
    body: JSON.stringify(input),
  });
  const data = await parseJson<AuthResponse>(res);
  if (data.token) setStoredToken(data.token);
  return data.user;
}

export async function logoutUser(): Promise<void> {
  try {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: authHeaders(),
    });
    await parseJson<{ ok: boolean }>(res);
  } finally {
    setStoredToken(null);
  }
}
