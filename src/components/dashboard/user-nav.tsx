"use client";

import { LogOut, User, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function UserNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    avatar: string;
    initials: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const email = user.email || "";
        const name = user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     email.split("@")[0];
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "U";
        
        // Get avatar URL from user metadata or user_settings
        let avatar = user.user_metadata?.avatar_url || "";
        
        if (!avatar) {
          // Try to fetch from user_settings
          const { data: settings } = await supabase
            .from("user_settings")
            .select("avatar_url")
            .eq("user_id", user.id)
            .single();
          
          if (settings?.avatar_url) {
            avatar = settings.avatar_url;
          }
        }
        
        setUserData({
          name,
          email,
          avatar,
          initials,
        });
      }
      setLoading(false);
    }
    
    fetchUserData();
    
    // Listen for auth state changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Determine settings URL based on current path
  const settingsUrl = pathname?.startsWith("/admin") ? "/admin/settings" : "/settings";

  if (loading) {
    return (
      <Button
        variant="ghost"
        className="relative h-9 w-9 rounded-full"
        disabled
      >
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-muted">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={userData.avatar} alt={userData.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {userData.initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userData.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userData.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={settingsUrl} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
