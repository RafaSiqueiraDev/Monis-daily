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

/**
 * Endpoint ainda não implementado no backend (não existe /auth/forgot-password
 * neste momento). A chamada está pronta e vai devolver 404 até essa rota ser
 * criada no FastAPI — o dialog trata esse erro com uma mensagem clara.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await apiClient.post("/auth/forgot-password", { email });
}