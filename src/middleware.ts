import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/'], // Only match the root path
};

export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Always redirect / to /dashboard
  if (url.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}
