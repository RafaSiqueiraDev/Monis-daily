import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "O email é obrigatório").email("Email inválido"),
  password: z.string().min(1, "A password é obrigatória"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres").max(120),
    email: z.string().min(1, "O email é obrigatório").email("Email inválido"),
    password: z
      .string()
      .min(8, "A password deve ter pelo menos 8 caracteres")
      .max(72, "A password não pode exceder 72 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As passwords não coincidem",
    path: ["confirmPassword"], // o erro aparece associado a este campo específico
  });

export type RegisterFormData = z.infer<typeof registerSchema>;