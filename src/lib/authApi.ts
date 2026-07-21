export type AuthUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

type AuthResponse = {
  user: AuthUser;
};

type ErrorResponse = {
  error?: string;
};

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
  });

  if (res.status === 401) {
    return null;
  }

  const data = await parseJson<AuthResponse>(res);
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<AuthResponse>(res);
  return data.user;
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthUser> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<AuthResponse>(res);
  return data.user;
}

export async function logoutUser(): Promise<void> {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  await parseJson<{ ok: boolean }>(res);
}
