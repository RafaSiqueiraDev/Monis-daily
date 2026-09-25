import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

apiClient.interceptors.request.use((config) => {
  // Obtém o token do Zustand ou do localStorage
  const token = useAuthStore.getState().token || localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Se der 401 numa chamada interna, limpa a sessão
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);