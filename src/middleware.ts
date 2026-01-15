import { type NextRequest } from 'next/server'
// Asegúrate de que esta ruta coincida con donde guardaste el otro archivo
import { updateSession } from './utils/supabase/middleware' 

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}