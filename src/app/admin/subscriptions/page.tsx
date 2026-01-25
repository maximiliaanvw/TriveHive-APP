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
import { CreditCard } from "lucide-react";

export const metadata: Metadata = {
  title: "Suscripciones Activas | Admin Panel",
};

interface SubscriptionData {
  id: string;
  email: string;
  name: string;
  plan: string;
  status: string;
  amount: string;
  renews: string;
}

// Plan pricing mapping
const planPricing: Record<string, string> = {
  Standard: "97€",
  Plus: "197€",
  Pro: "497€",
};

// Mock status (active or past due)
function getSubscriptionStatus(plan: string): string {
  // For now, mock all as Active
  // In the future, check actual subscription status from DB
  return "Active";
}

// Mock renewal date (next month)
function getRenewalDate(): string {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return nextMonth.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function getActiveSubscriptions(): Promise<SubscriptionData[]> {
  const adminClient = createAdminClient();

  try {
    // Get all users from auth
    const { data: usersList, error: usersError } =
      await adminClient.auth.admin.listUsers();

    if (usersError || !usersList?.users) {
      return [];
    }

    // Get all user settings (these represent users with subscriptions)
    const { data: userSettings } = await adminClient
      .from("user_settings")
      .select("user_id");

    // Build subscription data array (only users with settings = paid plans)
    const subscriptions: SubscriptionData[] = [];

    for (const authUser of usersList.users) {
      const hasSettings = userSettings?.some(
        (s) => s.user_id === authUser.id
      );

      // Only include users with subscriptions (non-free plans)
      if (hasSettings) {
        const userEmail = authUser.email || "Unknown";
        const userName =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          userEmail.split("@")[0];

        // Determine plan (for now, all with settings are Standard)
        // In the future, read from subscription/plan field
        const plan = "Standard"; // TODO: Get actual plan from subscription system

        subscriptions.push({
          id: authUser.id,
          email: userEmail,
          name: userName,
          plan: plan,
          status: getSubscriptionStatus(plan),
          amount: planPricing[plan] || "N/A",
          renews: getRenewalDate(),
        });
      }
    }

    // Sort by plan (Pro > Plus > Standard)
    const planOrder: Record<string, number> = {
      Pro: 3,
      Plus: 2,
      Standard: 1,
    };

    subscriptions.sort((a, b) => {
      return (planOrder[b.plan] || 0) - (planOrder[a.plan] || 0);
    });

    return subscriptions;
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return [];
  }
}

export default async function SubscriptionsPage() {
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

  // Fetch active subscriptions
  const subscriptions = await getActiveSubscriptions();

  // Calculate MRR (Monthly Recurring Revenue)
  const mrr = subscriptions.reduce((total, sub) => {
    const amount = parseInt(sub.amount.replace("€", "")) || 0;
    return total + amount;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Suscripciones Activas
        </h1>
        <p className="text-muted-foreground mt-1">
          Visión general de todas las suscripciones activas y ingresos recurrentes.
        </p>
      </div>

      {/* MRR Summary Card */}
      <Card className="py-4">
        <CardContent className="px-4 py-0">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                MRR (Monthly Recurring Revenue)
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  {mrr}€
                </span>
              </div>
            </div>
            <div className="rounded-lg p-2.5 bg-emerald-500/10">
              <CreditCard className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card className="py-0">
        <CardHeader className="py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Todas las Suscripciones Activas
              </CardTitle>
              <CardDescription>
                {subscriptions.length}{" "}
                {subscriptions.length === 1
                  ? "suscripción activa"
                  : "suscripciones activas"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0">
          {subscriptions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CreditCard className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No hay suscripciones activas
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Las suscripciones aparecerán aquí una vez que los usuarios se suscriban
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Renews
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subscriptions.map((subscription) => (
                    <tr
                      key={subscription.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {subscription.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {subscription.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            subscription.plan === "Pro"
                              ? "bg-purple-500/10 text-purple-500"
                              : subscription.plan === "Plus"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-brand/10 text-brand"
                          }`}
                        >
                          {subscription.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            subscription.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {subscription.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-foreground">
                          {subscription.amount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {subscription.renews}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
