import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import { AxiosError } from "axios";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { resetPasswordSchema, type ResetPasswordFormData } from "../lib/validations/auth";
import { resetPassword } from "../api/auth";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await resetPassword(token, data.password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      setErrorMessage(
        axiosErr.response?.data?.detail ?? "Não foi possível redefinir a password. Tenta pedir um novo link."
      );
    } finally {
      setIsSubmitting(false);
    }
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
            <CardTitle>Nova palavra-passe</CardTitle>
            <CardDescription>Define a tua nova password de acesso</CardDescription>
          </CardHeader>
          <CardContent>
            {!token && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Link inválido. Pede uma nova recuperação de password no ecrã de login.
              </div>
            )}

            {token && success && (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="text-sm text-slate-700">
                  Password redefinida com sucesso. A redirecionar para o login...
                </p>
              </div>
            )}

            {token && !success && (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">Nova password</Label>
                  <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
                  {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirmPassword">Confirmar password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}

                <Button type="submit" className="mt-2 w-full" isLoading={isSubmitting}>
                  Redefinir password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/login" className="font-medium text-slate-900 hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}