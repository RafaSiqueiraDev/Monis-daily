import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRead } from "../types/user";

interface AuthState {
  token: string | null;
  user: UserRead | null;
  userName?: string | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  setUser: (user: UserRead) => void;
  setAuth: (token: string, user: UserRead) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      userName: null,
      isAuthenticated: false,
      setToken: (token: string) =>
        set({ token, isAuthenticated: Boolean(token) }),
      setUser: (user: UserRead) =>
        set({ user, userName: user.full_name || user.email }),
      setAuth: (token: string, user: UserRead) =>
        set({
          token,
          user,
          userName: user.full_name || user.email,
          isAuthenticated: true,
        }),
      logout: () =>
        set({ token: null, user: null, userName: null, isAuthenticated: false }),
    }),
    {
      name: "financas-auth",
    }
  )
);