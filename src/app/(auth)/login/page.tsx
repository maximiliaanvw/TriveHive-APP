"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "./actions";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El email es requerido" })
    .email({ message: "Por favor ingresa un email válido" }),
  password: z
    .string()
    .min(1, { message: "La contraseña es requerida" })
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isPending, setIsPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsPending(true);
    setServerError(null);

    try {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);

      const result = await login(formData);
      
      if (result?.error) {
        setServerError(result.error);
        setIsPending(false);
      }
      // Si no hay error, el redirect de Next.js lanzará una excepción especial
      // que será manejada automáticamente por Next.js, así que no necesitamos hacer nada
    } catch (error: any) {
      // Verificar si es un error de redirección de Next.js
      // Los redirects de Next.js lanzan un error especial que debemos ignorar
      if (error?.digest?.startsWith('NEXT_REDIRECT') || error?.message?.includes('NEXT_REDIRECT')) {
        // Es una redirección exitosa, no mostrar error
        return;
      }
      // Solo mostrar error si es un error real
      setServerError("Ocurrió un error al iniciar sesión");
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold tracking-tight">
          Portal de Cliente
        </h2>
        <p className="text-sm text-muted-foreground">
          Introduce tus credenciales para acceder al panel.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {serverError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@empresa.com"
            autoComplete="email"
            disabled={isPending}
            aria-invalid={errors.email ? "true" : "false"}
            className={errors.email ? "border-red-500" : ""}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isPending}
            aria-invalid={errors.password ? "true" : "false"}
            className={errors.password ? "border-red-500" : ""}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Iniciando sesión...
            </>
          ) : (
            "Iniciar sesión"
          )}
        </Button>
      </form>

      {/* Support link */}
      <div className="pt-2 text-center">
        <a
          href="mailto:soporte@trivehive.com"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ¿Problemas para entrar? Contactar Soporte
        </a>
      </div>
    </div>
  );
}
