import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { login, register, getCurrentUser, updateActiveCountries } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { useUiPreferencesStore } from "../store/uiPreferencesStore";
import type { LoginFormData, RegisterFormData } from "../lib/validations/auth";
import type { CountryCode } from "../types/country";

export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const syncFromServer = useUiPreferencesStore((state) => state.syncFromServer);

  return useMutation({
    mutationFn: async (credentials: LoginFormData) => {
      const tokenResponse = await login(credentials.email, credentials.password);
      useAuthStore.setState({ token: tokenResponse.access_token });
      const user = await getCurrentUser();
      return { token: tokenResponse.access_token, user };
    },
    onSuccess: ({ token, user }) => {
      setAuth(token, user.id, user.name);
      syncFromServer((user.active_countries ?? ["PT"]) as CountryCode[], user.onboarding_completed);
      navigate("/");
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (payload: Omit<RegisterFormData, "confirmPassword">) => register(payload),
    onSuccess: () => navigate("/login?registered=true"),
  });
}

export function useUpdateActiveCountries() {
  const syncFromServer = useUiPreferencesStore((state) => state.syncFromServer);

  return useMutation({
    mutationFn: (countries: CountryCode[]) => updateActiveCountries(countries),
    onSuccess: (user) => {
      syncFromServer((user.active_countries ?? ["PT"]) as CountryCode[], user.onboarding_completed);
    },
  });
}