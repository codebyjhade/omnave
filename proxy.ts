import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js 16 Edge Proxy (formerly Middleware) to enforce authentication boundaries
 * Powered by Supabase SSR for secure token refresh.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 1. Initialize Supabase Server Client to manage secure auth cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
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

  // 2. Securely ask Supabase if this user has a valid, active session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // 🔴 DIAGNOSTIC LOGS: Watch your terminal!
  console.log(`\n--- MIDDLEWARE TRIGGERED FOR: ${path} ---`);
  console.log(`Cookies present:`, request.cookies.getAll().map((cookie) => cookie.name).join(', '));
  console.log(`User ID detected:`, user?.id || 'NULL');
  if (error) console.log(`Supabase Error:`, error.message);
  console.log(`----------------------------------------\n`);

  // 3. Your Custom Route Logic
  const isPublicAuthRoute = path === '/login' || path === '/signup';
  const isProtectedRoute = 
    path.startsWith('/home') || 
    path.startsWith('/library') || 
    path.startsWith('/progress') || 
    path.startsWith('/profile') || 
    path.startsWith('/upload') || 
    path.startsWith('/lesson');

  const isPublicPage = path === '/' || isPublicAuthRoute;

  // If a guest tries to access a protected route, redirect to landing page '/'
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL('/', request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    
    // CRITICAL: Copy Supabase auth cookies to the redirect response to prevent token refresh loops
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        maxAge: cookie.maxAge,
        expires: cookie.expires,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
      });
    });
    return redirectResponse;
  }

  // If unauthenticated and already on a public page, do not redirect
  if (!user && isPublicPage) {
    return supabaseResponse;
  }

  // If a logged-in user hits /login or /signup, push them into the app
  if (user && isPublicAuthRoute) {
    const redirectResponse = NextResponse.redirect(new URL('/home', request.url));
    
    // CRITICAL: Copy Supabase auth cookies to the redirect response to prevent loops
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        maxAge: cookie.maxAge,
        expires: cookie.expires,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
      });
    });
    return redirectResponse;
  }

  // Allow the request to proceed and securely attach the refreshed Supabase cookies
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * This ensures Supabase safely refreshes tokens on every page load, but ignores images.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};