
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Paths that don't require authentication
  const publicPaths = ['/login', '/register', '/api/auth/login', '/api/auth/register', '/favicon.ico'];
  
  // Check if the current path is public
  if (publicPaths.some(path => pathname.startsWith(path)) || pathname.startsWith('/_next')) {
    // If user is already logged in and tries to access login/register, redirect to dashboard
    if (token && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // If no token, redirect to login
  if (!token) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled separately usually, but here we want to protect non-auth APIs too?)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
