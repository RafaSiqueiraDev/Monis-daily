import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { login, register, getCurrentUser } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import type { LoginFormData, RegisterFormData } from "../lib/validations/auth";

export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (credentials: LoginFormData) => {
      const tokenResponse = await login(credentials.email, credentials.password);

      // o /auth/login só devolve o token — precisamos de um segundo
      // pedido a /auth/me para saber o nome/id do utilizador. Fazemos
      // isto aqui dentro da mutation para o authStore já ficar completo
      // de uma vez, em vez de o componente ter de encadear dois hooks.
      useAuthStore.setState({ token: tokenResponse.access_token });
      const user = await getCurrentUser();

      return { token: tokenResponse.access_token, user };
    },
    onSuccess: ({ token, user }) => {
      setAuth(token, user.id, user.name);
      navigate("/");
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: Omit<RegisterFormData, "confirmPassword">) => register(payload),
    onSuccess: () => {
      // depois de registar, mandamos para o login em vez de autenticar
      // automaticamente — mantém o fluxo explícito e simples de seguir
      navigate("/login?registered=true");
    },
  });
}