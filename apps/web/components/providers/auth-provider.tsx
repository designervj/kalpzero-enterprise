"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getCurrentSession, login as loginRequest, type LoginPayload, type SessionDto } from "@/lib/api";
import { AUTH_STORAGE_KEY } from "@/lib/auth-storage";
import { AuthUser, setAuthUser } from "@/lib/slices/auth/authSlice";
import { useDispatch } from "react-redux";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: AuthStatus;
  token: string | null;
  session: SessionDto | null;
  login: (payload: LoginPayload) => Promise<SessionDto>;
  logout: () => void;
  refresh: () => Promise<SessionDto | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as { token?: string };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

function writeStoredToken(token: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!token) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token }));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<SessionDto | null>(null);

  const dispatch = useDispatch();

  const refresh = useCallback(async () => {
    const nextToken = readStoredToken();
    if (!nextToken) {
      setToken(null);
      setSession(null);
      setStatus("anonymous");
      return null;
    }

    try {
      const nextSession = await getCurrentSession(nextToken);
      setToken(nextToken);
      setSession(nextSession);
      setStatus("authenticated");

      // Restore auth user in Redux on page refresh
      const userData: AuthUser = {
        id: nextSession.user_id ?? "",
        name: "",
        email: nextSession.user_id ?? "",
        roles: nextSession.roles[0] ?? "",
        tenant_id: nextSession.tenant_id ?? "",
        access_token: nextToken,
      };
      dispatch(setAuthUser(userData));

      return nextSession;
    } catch {
      writeStoredToken(null);
      setToken(null);
      setSession(null);
      setStatus("anonymous");
      return null;
    }
  }, [dispatch]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await loginRequest(payload);

    const usrerdata: AuthUser = {
      id: response.session?.user_id ?? "",
      name: "",
      email: response.session.user_id ?? "",
      roles: response.session.roles[0] ?? "",
      tenant_id: response.session.tenant_id ?? "",
      //tenant_slug:response.session.tenant_slug??"",
      access_token: response.access_token ?? "",
      expires_at: response.expires_at ?? "",
    };
    dispatch(setAuthUser(usrerdata));
    // console.log("login ",response)
    writeStoredToken(response.access_token);
    setToken(response.access_token);
    setSession(response.session);
    setStatus("authenticated");
    return response.session;
  }, [dispatch]);

  const logout = useCallback(() => {
    writeStoredToken(null);
    setToken(null);
    setSession(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(
    () => ({
      status,
      token,
      session,
      login,
      logout,
      refresh
    }),
    [login, logout, refresh, session, status, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
