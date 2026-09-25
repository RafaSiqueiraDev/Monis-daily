import { apiClient } from "./client";
import type { LoginCredentials, RegisterData, AuthResponse, UserRead } from "../types/auth";

export async function login(credentials: any): Promise<AuthResponse> {
  const params = new URLSearchParams();
  
  
  const userEmail = credentials.email || credentials.username || "";
  const userPassword = credentials.password || "";

  params.append("username", userEmail);
  params.append("password", userPassword);

  const response = await apiClient.post<AuthResponse>("/auth/login", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return response.data;
}

export async function register(data: RegisterData): Promise<UserRead> {
  const response = await apiClient.post<UserRead>("/auth/register", data);
  return response.data;
}

export async function getCurrentUser(): Promise<UserRead> {
  const response = await apiClient.get<UserRead>("/auth/me");
  return response.data;
}

export const getMe = getCurrentUser;