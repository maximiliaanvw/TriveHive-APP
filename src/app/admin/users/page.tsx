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
import { Input } from "@/components/ui/input";
import { Users, Eye, Search } from "lucide-react";
import Link from "next/link";
import { UsersTableClient } from "./users-table-client";

export const metadata: Metadata = {
  title: "Usuarios | Admin Panel",
};

interface UserData {
  id: string;
  email: string;
  name: string;
  plan: string;
  calls_used: number;
  created_at: string;
}

async function getAllUsers(): Promise<UserData[]> {
  const adminClient = createAdminClient();

  try {
    // Get all users from auth using admin API
    const { data: usersList, error: usersError } =
      await adminClient.auth.admin.listUsers();

    if (usersError || !usersList?.users) {
      return [];
    }

    // Get all user settings to determine subscriptions
    const { data: userSettings } = await adminClient
      .from("user_settings")
      .select("user_id, created_at");

    // Get calls count per user
    const { data: callsData } = await adminClient
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

    for (const authUser of usersList.users) {
      const userSetting = userSettings?.find((s) => s.user_id === authUser.id);

      const userEmail = authUser.email || "Unknown";
      const userName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        userEmail.split("@")[0];
      const userCalls = callsPerUser.get(authUser.id) || 0;

      const createdAt =
        authUser.created_at ||
        (userSetting?.created_at as string | undefined) ||
        new Date().toISOString();

      users.push({
        id: authUser.id,
        email: userEmail,
        name: userName,
        plan: userSetting ? "Standard" : "Free",
        calls_used: userCalls,
        created_at: createdAt,
      });
    }

    // Sort users by date joined (newest first)
    users.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export default async function UsersPage() {
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

  // Fetch all users
  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Usuarios
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestiona y visualiza todos los usuarios registrados en el sistema.
        </p>
      </div>

      {/* User Table with Search */}
      <Card className="py-0">
        <CardHeader className="py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Todos los Usuarios</CardTitle>
              <CardDescription>
                {users.length} {users.length === 1 ? "usuario" : "usuarios"} en total
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <UsersTableClient users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
