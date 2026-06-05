import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const protectedRoutes = ["/dashboard", "/profile"];
const authPageRoutes = ["/login"];
const apiAuthPrefix = "/api/auth";
const protectedApiPrefix = ["/api/lxc", "/api/users", "/api/entra"];

export default auth(function middleware(req) {
  const path = req.nextUrl.pathname;
  const isLoggedIn = !!req.auth;

  if (path.startsWith(apiAuthPrefix)) {
    return NextResponse.next();
  }

  if (protectedApiPrefix.some((prefix) => path.startsWith(prefix))) {
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== process.env.NEXT_PUBLIC_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);

    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthPageRoute = authPageRoutes.some((route) => path.startsWith(route));
  if (isLoggedIn && isAuthPageRoute) {
    return NextResponse.redirect(new URL("/dashboard", process.env.AUTH_URL));
  }
  if (path.startsWith("/mail") && !isLoggedIn) {
  const loginUrl = new URL("/login_webmail", req.url);

  loginUrl.searchParams.set(
    "callbackUrl",
    req.nextUrl.pathname + req.nextUrl.search
  );

  return NextResponse.redirect(loginUrl);
}

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};