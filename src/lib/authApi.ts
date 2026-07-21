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

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & ErrorResponse;
  if (!res.ok) {
    throw new Error(data.error || "Falha na autenticação.");
  }
  return data;
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

  // API offline / HTML 404 from static host
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
      throw new Error(
        "API de login indisponível neste deploy. Confira se /api está ativo na Vercel."
      );
    }
    throw new Error("Falha na autenticação.");
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
