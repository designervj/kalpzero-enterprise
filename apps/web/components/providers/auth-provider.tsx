"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentSession, login as loginRequest, magicLogin as magicLoginRequest, type LoginPayload, type SessionDto } from "@/lib/api";
import { AUTH_STORAGE_KEY } from "@/lib/auth-storage";
import { AuthUser, clearAuth, setAuthUser } from "@/hook/slices/auth/authSlice";
import { useDispatch } from "react-redux";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: AuthStatus;
  token: string | null;
  session: SessionDto | null;
  login: (payload: LoginPayload) => Promise<SessionDto>;
  magicLogin: (userId: string) => Promise<SessionDto>;
  logout: () => void;
  refresh: () => Promise<SessionDto | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_USER_STORAGE_KEY = "kalp_auth_user";

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

function readStoredAuthUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }
  const rawValue = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }
  try {
    return JSON.parse(rawValue) as AuthUser;
  } catch {
    return null;
  }
}

function writeStoredAuthUser(user: AuthUser | null) {
  if (typeof window === "undefined") {
    return;
  }
  if (!user) {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
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
      writeStoredAuthUser(null);
      dispatch(clearAuth());
      return null;
    }

    try {
      const nextSession = await getCurrentSession(nextToken);
      setToken(nextToken);
      setSession(nextSession);
      setStatus("authenticated");

      const userData: AuthUser = {
        id: nextSession.email,
        name: nextSession.name,
        email: nextSession.email,
        role: nextSession.role,
        tenant_id: nextSession.tenant_id,
        access_token: nextToken,
      };
      dispatch(setAuthUser(userData));
      writeStoredAuthUser(userData);

      return nextSession;
    } catch {
      writeStoredToken(null);
      writeStoredAuthUser(null);
      setToken(null);
      setSession(null);
      setStatus("anonymous");
      dispatch(clearAuth());
      return null;
    }
  }, [dispatch]);

  useEffect(() => {
    const storedUser = readStoredAuthUser();
    if (storedUser) {
      dispatch(setAuthUser(storedUser));
    }
    void refresh();
  }, [refresh, dispatch]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await loginRequest(payload);

    console.log("update logion",response)
    const userData: AuthUser = {
      id: response.session?.email ?? "",
      name: response.session?.name ?? "",
      email: response.session?.email ?? "",
      role: response.session?.role ?? "",
      tenant_id: response.session?.tenant_id ?? "",
      access_token: response.access_token ?? "",
      expires_at: response.expires_at ?? "",
    };
    dispatch(setAuthUser(userData));
    writeStoredToken(response.access_token);
    writeStoredAuthUser(userData);
    setToken(response.access_token);
    setSession(response.session);
    setStatus("authenticated");
    return response.session;
  }, [dispatch]);

  const magicLogin = useCallback(async (userId: string) => {
    const response = await magicLoginRequest(userId);
    const userData: AuthUser = {
      id: response.session?.email ?? "",
      name: response.session?.name ?? "",
      email: response.session?.email ?? "",
      role: response.session?.role ?? "",
      tenant_id: response.session?.tenant_id ?? "",
      access_token: response.access_token ?? "",
      expires_at: response.expires_at ?? "",
    };
    dispatch(setAuthUser(userData));
    writeStoredToken(response.access_token);
    writeStoredAuthUser(userData);
    setToken(response.access_token);
    setSession(response.session);
    setStatus("authenticated");
    return response.session;
  }, [dispatch]);

  const logout = useCallback(() => {
    writeStoredToken(null);
    writeStoredAuthUser(null);
    setToken(null);
    setSession(null);
    setStatus("anonymous");
    dispatch(clearAuth());
  }, [dispatch]);

  const value = useMemo(
    () => ({
      status,
      token,
      session,
      login,
      magicLogin,
      logout,
      refresh
    }),
    [login, magicLogin, logout, refresh, session, status, token]
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
