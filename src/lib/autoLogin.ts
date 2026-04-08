import { API_BASE } from "@/lib/api";
import { getSession, setSession, type AuthSession } from "@/lib/auth";

export const tryAutoLogin = async (): Promise<AuthSession | null> => {
  try {
    const current = getSession();

    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: current?.refreshToken }),
    });

    if (!refreshRes.ok) return null;
    const refreshJson = (await refreshRes.json()) as {
      success?: boolean;
      data?: { accessToken?: string; refreshToken?: string };
    };
    if (!refreshJson?.success || !refreshJson.data?.accessToken) return null;

    const accessToken = refreshJson.data.accessToken;
    const refreshToken = refreshJson.data.refreshToken;

    const meRes = await fetch(`${API_BASE}/users/me`, {
      method: "GET",
      credentials: "include",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!meRes.ok) return null;
    const meJson = (await meRes.json()) as {
      success?: boolean;
      data?: { _id?: string; id?: string; email?: string; role?: AuthSession["user"]["role"] };
    };
    if (!meJson?.success || !meJson.data?.email || !meJson.data?.role) return null;

    const userId = meJson.data.id || meJson.data._id;
    if (!userId) return null;

    const session: AuthSession = {
      accessToken,
      refreshToken,
      user: { id: userId, email: meJson.data.email, role: meJson.data.role },
    };

    setSession(session);
    return session;
  } catch {
    return null;
  }
};

