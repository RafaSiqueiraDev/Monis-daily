import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { login, getCurrentUser } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Wallet, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registered = searchParams.get("registered");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Envia diretamente o email e a password introduzidos
      const authData = await login({ email, password });
      setToken(authData.access_token);

      // Procura dados do perfil do utilizador
      const userData = await getCurrentUser();
      setUser(userData);

      // Redireciona para o Dashboard
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Erro no login:", err);
      setError("Email ou password incorretos. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="mb-6 flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
          <Wallet className="h-6 w-6" />
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
          Finanças App
        </h1>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Acede à tua conta para continuar</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {registered && (
              <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-xs text-green-700 border border-green-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Conta criada com sucesso. Inicia sessão abaixo.</span>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@exemplo.com"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "A entrar..." : "Entrar"}
            </Button>
            <p className="text-xs text-slate-500 text-center">
              Ainda não tens conta?{" "}
              <Link to="/register" className="font-semibold text-slate-900 underline">
                Regista-te
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}