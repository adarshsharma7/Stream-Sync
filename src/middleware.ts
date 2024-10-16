import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
export { default } from 'next-auth/middleware';

export const config = {
   matcher: ['/dashboard/:path*', '/sign-in', '/sign-up', '/', '/verify/:path*','/profile','/liked-videos','/subscriptionprofile/:path*','/videoplay/:path*','/watch-history','/watch-later','/subscriptions','/upload','/uploaded-videos','/forgetpassword'],
 
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const url = request.nextUrl;


   // Allow access to public routes without authentication
   const publicPaths = ['/sign-in', '/sign-up', '/verify', '/forgetpassword'];
   const isPublicPath = publicPaths.some((path) => url.pathname.startsWith(path));
   
 
   // If the user is not authenticated and not on a public path, redirect to sign-in
   if (!token && !isPublicPath) {
    if (url.pathname !== '/sign-in') {
     return NextResponse.redirect(new URL('/sign-in', request.url));
    }
   }
 
   // If the user is authenticated and trying to access public paths, redirect to dashboard
   if (token && isPublicPath && !url.pathname.startsWith('/forgetpassword')) {
    if (url.pathname !== '/dashboard') {
     return NextResponse.redirect(new URL('/dashboard', request.url));
    }
   }

  return NextResponse.next();
}