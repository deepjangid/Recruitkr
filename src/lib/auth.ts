export type UserRole = 'candidate' | 'client' | 'admin';

export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
};

const AUTH_STORAGE_KEY = 'recruitkr.auth.session';

export const getSession = (): AuthSession | null => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.accessToken || !parsed?.user?.id) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const setSession = (session: AuthSession) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const clearSession = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const updateSessionTokens = (accessToken: string, refreshToken?: string) => {
  const current = getSession();
  if (!current) return;

  setSession({
    ...current,
    accessToken,
    refreshToken: refreshToken ?? current.refreshToken,
  });
};
