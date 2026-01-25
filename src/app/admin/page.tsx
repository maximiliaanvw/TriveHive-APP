import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Phone, CreditCard, TrendingUp, UserPlus } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Panel | TriveHive",
};

interface UserData {
  id: string;
  email: string;
  name?: string;
  plan: string;
  calls_used: number;
  calls_limit: number;
  created_at: string;
}

async function getAdminMetrics() {
  const adminClient = createAdminClient();

  try {
    // Get all users from auth using admin API
    const { data: usersList, error: usersError } =
      await adminClient.auth.admin.listUsers();

    const totalUsers = usersList?.users?.length || 0;

    // Get total calls count
    const { count: totalCalls, error: callsError } = await adminClient
      .from("calls")
      .select("*", { count: "exact", head: true });

    // Get all user settings to determine subscriptions
    const { data: userSettings, error: settingsError } = await adminClient
      .from("user_settings")
      .select("user_id, created_at");

    // For now, assume all users with settings have a paid plan
    // In the future, add a plan field to user_settings or a subscriptions table
    const activeSubscriptions = userSettings?.length || 0;

    // Get calls count per user
    const { data: callsData, error: callsDataError } = await adminClient
      .from("calls")
      .select("user_id");

    // Aggregate calls per user
    const callsPerUser = new Map<string, number>();
    if (callsData) {
      for (const call of callsData) {
        if (call.user_id) {
          callsPerUser.set(
            call.user_id,
            (callsPerUser.get(call.user_id) || 0) + 1
          );
        }
      }
    }

    // Build user data array
    const users: UserData[] = [];

    if (usersList?.users) {
      for (const authUser of usersList.users) {
        // Get user settings to find created_at and plan info
        const userSetting = userSettings?.find(
          (s) => s.user_id === authUser.id
        );

        const userEmail = authUser.email || "Unknown";
        const userName =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          userEmail.split("@")[0];
        const userCalls = callsPerUser.get(authUser.id) || 0;

        // Use auth user's created_at (when they registered) as primary source
        // Fall back to user_settings created_at if auth user doesn't have it
        const createdAt =
          authUser.created_at ||
          (userSetting?.created_at as string | undefined) ||
          new Date().toISOString();

        users.push({
          id: authUser.id,
          email: userEmail,
          name: userName,
          plan: userSetting ? "Standard" : "Free", // Default plan logic - update when subscription system is implemented
          calls_used: userCalls,
          calls_limit: userSetting ? 1000 : 100, // Default limits - update when subscription system is implemented
          created_at: createdAt,
        });
      }
    }

    // Sort users by date joined (newest first)
    users.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Get recent signups (last 5)
    const recentSignups = users.slice(0, 5);

    // Calculate MRR (Monthly Recurring Revenue)
    // Plan pricing mapping
    const planPricing: Record<string, number> = {
      Standard: 97,
      Plus: 197,
      Pro: 497,
    };
    
    const mrr = users
      .filter((u) => u.plan !== "Free")
      .reduce((total, user) => {
        const price = planPricing[user.plan] || 0;
        return total + price;
      }, 0);

    return {
      totalUsers,
      totalCalls: totalCalls || 0,
      activeSubscriptions,
      mrr,
      recentSignups,
      errors: {
        usersError,
        callsError,
        settingsError,
        callsDataError,
      },
    };
  } catch (error) {
    console.error("Error fetching admin metrics:", error);
    return {
      totalUsers: 0,
      totalCalls: 0,
      activeSubscriptions: 0,
      mrr: 0,
      recentSignups: [],
      errors: { generalError: error },
    };
  }
}

export default async function AdminPage() {
  // Get current user session
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Security check: Only allow admin email
  if (!user || !user.email) {
    redirect("/login");
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    // Redirect non-admin users to dashboard
    redirect("/dashboard");
  }

  // Fetch metrics
  const metrics = await getAdminMetrics();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Admin Panel
        </h1>
        <p className="text-muted-foreground mt-1">
          Overview of all users, calls, and subscriptions across your SaaS platform.
        </p>
      </div>

      {/* Stats Cards - Top Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="py-4">
          <CardContent className="px-4 py-0">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Users
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-foreground">
                    {metrics.totalUsers}
                  </span>
                </div>
              </div>
              <div className="rounded-lg p-2.5 bg-brand/10">
                <Users className="h-5 w-5 text-brand" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="px-4 py-0">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Calls Processed
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-foreground">
                    {metrics.totalCalls}
                  </span>
                </div>
              </div>
              <div className="rounded-lg p-2.5 bg-accent-purple/10">
                <Phone className="h-5 w-5 text-accent-purple" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="px-4 py-0">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  MRR (Monthly Recurring Revenue)
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-foreground">
                    {metrics.mrr}€
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.activeSubscriptions} suscripciones activas
                </p>
              </div>
              <div className="rounded-lg p-2.5 bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="py-0">
        <CardHeader className="py-4 border-b">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Registros Recientes</CardTitle>
          </div>
          <CardDescription>
            Los últimos 5 usuarios que se registraron en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 py-0">
          {metrics.recentSignups.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No hay registros recientes
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {metrics.recentSignups.map((user) => (
                <div
                  key={user.id}
                  className="px-6 py-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand text-sm font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Plan:{" "}
                          <span
                            className={`font-medium ${
                              user.plan === "Free"
                                ? "text-muted-foreground"
                                : "text-brand"
                            }`}
                          >
                            {user.plan}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(user.created_at).toLocaleDateString(
                            "es-ES",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
