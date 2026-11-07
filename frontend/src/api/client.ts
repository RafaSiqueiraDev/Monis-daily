import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { normalizeDecimals } from "./normalizeDecimals";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  // Margem generosa para cold starts do Render; sem isto um pedido
  // pendurado nunca falha e a UI fica presa em loading.
  timeout: 30_000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token || localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    response.data = normalizeDecimals(response.data);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
