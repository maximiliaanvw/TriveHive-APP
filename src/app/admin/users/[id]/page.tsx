import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "User Details | Admin Panel",
};

async function getUserById(userId: string) {
  const adminClient = createAdminClient();

  try {
    const { data: userData, error } = await adminClient.auth.admin.getUserById(
      userId
    );

    if (error || !userData?.user) {
      return null;
    }

    // Get user settings
    const { data: userSettings } = await adminClient
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Get user calls
    const { data: calls, count: callsCount } = await adminClient
      .from("calls")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    const userEmail = userData.user.email || "Unknown";
    const userName =
      userData.user.user_metadata?.full_name ||
      userData.user.user_metadata?.name ||
      userEmail.split("@")[0];

    return {
      id: userData.user.id,
      email: userEmail,
      name: userName,
      created_at: userData.user.created_at || new Date().toISOString(),
      plan: userSettings ? "Standard" : "Free",
      settings: userSettings,
      calls: calls || [],
      callsCount: callsCount || 0,
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params in Next.js 16
  const { id } = await params;

  // Get current user session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Security check: Only allow admin email
  if (!user || !user.email) {
    redirect("/login");
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    redirect("/dashboard");
  }

  // Fetch user data
  const userData = await getUserById(id);

  if (!userData) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/admin/users">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver a Usuarios
        </Button>
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {userData.name}
        </h1>
        <p className="text-muted-foreground mt-1">{userData.email}</p>
      </div>

      {/* User Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información del Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm text-foreground mt-1">{userData.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Plan</p>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 ${
                  userData.plan === "Free"
                    ? "bg-muted text-muted-foreground"
                    : "bg-brand/10 text-brand"
                }`}
              >
                {userData.plan}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Fecha de Registro
              </p>
              <p className="text-sm text-foreground mt-1">
                {new Date(userData.created_at).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total de Llamadas
              </p>
              <p className="text-sm text-foreground mt-1">
                {userData.callsCount} llamadas
              </p>
            </div>
          </CardContent>
        </Card>

        {userData.settings && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userData.settings.business_name && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Nombre del Negocio
                  </p>
                  <p className="text-sm text-foreground mt-1">
                    {userData.settings.business_name}
                  </p>
                </div>
              )}
              {userData.settings.vapi_assistant_id && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Assistant ID
                  </p>
                  <p className="text-sm text-foreground mt-1 font-mono text-xs">
                    {userData.settings.vapi_assistant_id}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Calls */}
      {userData.calls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas Llamadas</CardTitle>
            <CardDescription>
              Las 10 llamadas más recientes de este usuario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Duración
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {userData.calls.map((call: any) => (
                    <tr
                      key={call.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">
                          {new Date(call.created_at).toLocaleDateString(
                            "es-ES",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            call.status === "ended"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {call.status || "Unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {call.duration_seconds
                            ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s`
                            : "N/A"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
