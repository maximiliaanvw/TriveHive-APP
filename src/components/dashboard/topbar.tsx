"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { UserNav } from "./user-nav";

const routeLabels: Record<string, string> = {
  "/overview": "Panel de Control",
  "/calls": "Llamadas",
  "/settings": "Configuración",
  "/admin": "Vista General",
  "/admin/users": "Usuarios",
  "/admin/subscriptions": "Suscripciones",
  "/admin/settings": "Configuración",
};

export function Topbar() {
  const pathname = usePathname();
  const currentLabel = routeLabels[pathname] || "Panel de Control";
  const isAdmin = pathname?.startsWith("/admin");
  const baseLabel = isAdmin ? "Admin Panel" : "Panel de Control";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
        <span className="font-medium text-foreground/60">{baseLabel}</span>
        {pathname !== "/admin" && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground">{currentLabel}</span>
          </>
        )}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <UserNav />
      </div>
    </header>
  );
}
