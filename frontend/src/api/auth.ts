import { apiClient } from "./client";
import type { Token, UserRead, UserCreate } from "../types/user";

export async function login(email: string, password: string): Promise<Token> {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const { data } = await apiClient.post<Token>("/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

export async function register(payload: UserCreate): Promise<UserRead> {
  const { data } = await apiClient.post<UserRead>("/auth/register", payload);
  return data;
}

export async function getCurrentUser(): Promise<UserRead> {
  const { data } = await apiClient.get<UserRead>("/auth/me");
  return data;
}

export async function updateActiveCountries(countries: string[]): Promise<UserRead> {
  const { data } = await apiClient.patch<UserRead>("/auth/me/countries", {
    active_countries: countries,
  });
  return data;
}

export interface ForgotPasswordResponse {
  message: string;
  debug_token?: string | null;
}

export async function requestPasswordReset(email: string): Promise<ForgotPasswordResponse> {
  const { data } = await apiClient.post<ForgotPasswordResponse>("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token: string, newPassword: string): Promise<UserRead> {
  const { data } = await apiClient.post<UserRead>("/auth/reset-password", {
    token,
    new_password: newPassword,
  });
  return data;
}