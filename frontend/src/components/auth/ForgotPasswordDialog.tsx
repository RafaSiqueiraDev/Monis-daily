import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "../../lib/validations/auth";
import { requestPasswordReset } from "../../api/auth";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setStatus("idle");
    try {
      await requestPasswordReset(data.email);
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) {
          setStatus("idle");
          reset({ email: "" });
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recuperar palavra-passe</DialogTitle>
          <DialogDescription>
            Indica o teu email e enviamos as instruções para redefinires a palavra-passe.
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-sm text-slate-700">
              Se existir uma conta com esse email, vais receber instruções de recuperação em breve.
            </p>
            <DialogClose asChild>
              <Button className="mt-2 w-full">Fechar</Button>
            </DialogClose>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="tu@exemplo.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>

            {status === "error" && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Não foi possível processar o pedido agora. Esta funcionalidade pode ainda não estar
                disponível — tenta novamente mais tarde.
              </div>
            )}

            <div className="mt-2 flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" isLoading={isSubmitting}>
                <Mail className="h-4 w-4" />
                Enviar instruções
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}