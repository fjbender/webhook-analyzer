import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const isAuth = !!token;
  const isAuthPage = request.nextUrl.pathname.startsWith("/login") || 
                    request.nextUrl.pathname.startsWith("/register");
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return null;
  }

  if (isDashboard && !isAuth) {
    let from = request.nextUrl.pathname;
    if (request.nextUrl.search) {
      from += request.nextUrl.search;
    }

    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, request.url)
    );
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
