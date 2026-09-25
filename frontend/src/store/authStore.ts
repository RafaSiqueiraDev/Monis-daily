import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRead } from "../types/user";

interface AuthState {
  token: string | null;
  user: UserRead | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  setUser: (user: UserRead) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setToken: (token: string) =>
        set({ token, isAuthenticated: Boolean(token) }),
      setUser: (user: UserRead) => set({ user }),
      logout: () =>
        set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: "financas-auth",
    }
  )
);