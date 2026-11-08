import axios, { type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/authStore";
import { useApiStatusStore } from "../store/apiStatusStore";
import { normalizeDecimals } from "./normalizeDecimals";
import { isConnectivityError } from "./connectivity";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  // Margem generosa para cold starts do Render; sem isto um pedido
  // pendurado nunca falha e a UI fica presa em loading.
  timeout: 30_000,
});

/** A partir daqui um pedido conta como "lento" e o aviso de ligação aparece. */
export const SLOW_REQUEST_MS = 3_000;

// Temporizador de "lento" por pedido. WeakMap: a entrada desaparece com o config.
const slowTracking = new WeakMap<InternalAxiosRequestConfig, { timer: ReturnType<typeof setTimeout>; slow: boolean }>();

function startTracking(config: InternalAxiosRequestConfig) {
  const entry = {
    slow: false,
    timer: setTimeout(() => {
      entry.slow = true;
      useApiStatusStore.getState().slowStarted();
    }, SLOW_REQUEST_MS),
  };
  slowTracking.set(config, entry);
}

function stopTracking(config: InternalAxiosRequestConfig | undefined) {
  const entry = config && slowTracking.get(config);
  if (!entry) return;
  clearTimeout(entry.timer);
  if (entry.slow) useApiStatusStore.getState().slowFinished();
  slowTracking.delete(config);
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token || localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  startTracking(config);
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    stopTracking(response.config);
    // Qualquer resposta bem-sucedida prova que a API está de volta
    useApiStatusStore.getState().connectionRestored();
    response.data = normalizeDecimals(response.data);
    return response;
  },
  (error) => {
    stopTracking(error.config);
    if (isConnectivityError(error)) {
      useApiStatusStore.getState().connectionLost();
    } else if (error.response) {
      // A API respondeu (mesmo que com 4xx/5xx da app): a ligação existe
      useApiStatusStore.getState().connectionRestored();
      if (error.response.status === 401) {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);
