"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "./actions";
import { Loader2 } from "lucide-react";

type LoginState = {
  error?: string;
} | null;

async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const result = await login(formData);
  return result ?? null;
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

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

      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@empresa.com"
            required
            autoComplete="email"
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            disabled={isPending}
          />
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
