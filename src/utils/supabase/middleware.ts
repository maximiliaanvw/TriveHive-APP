import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Always allow access to webhook endpoints (crucial for Vapi)
  if (pathname.startsWith("/api/webhooks/")) {
    return supabaseResponse;
  }

  // If user is not authenticated and trying to access protected routes
  if (!user && !pathname.startsWith("/login") && !pathname.startsWith("/auth")) {
    // Redirect to login
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access login page
  if (user && pathname.startsWith("/login")) {
    // Check if user is admin and redirect accordingly
    const adminEmail = process.env.ADMIN_EMAIL;
    const userEmail = user.email?.toLowerCase();
    
    const url = request.nextUrl.clone();
    if (adminEmail && userEmail === adminEmail.toLowerCase()) {
      url.pathname = "/admin";
    } else {
      url.pathname = "/overview";
    }
    return NextResponse.redirect(url);
  }

  // Return the response with updated cookies
  return supabaseResponse;
}
