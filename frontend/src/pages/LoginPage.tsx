import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wallet, CheckCircle2 } from "lucide-react";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { loginSchema, type LoginFormData } from "../lib/validations/auth";
import { useLogin } from "../hooks/useAuth";
import { ForgotPasswordDialog } from "../components/auth/ForgotPasswordDialog";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useLogin();

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700">
            <Wallet className="h-6 w-6" />
          </div>
          <h1 className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            Monis Daily
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Acede à tua conta para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            {justRegistered && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Conta criada com sucesso. Inicia sessão abaixo.
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@exemplo.com"
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-900"
                  >
                    Esqueceste-te da palavra-passe?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register("password")}
                />
                {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
              </div>

              {loginMutation.isError && (
                <p className="text-xs text-red-600">
                  Email ou password incorretos. Tenta novamente.
                </p>
              )}

              <Button type="submit" className="mt-2 w-full" isLoading={loginMutation.isPending}>
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-slate-500">
          Ainda não tens conta?{" "}
          <Link to="/register" className="font-medium text-slate-900 hover:underline">
            Regista-te
          </Link>
        </p>
      </div>

      <ForgotPasswordDialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen} />
    </div>
  );
}