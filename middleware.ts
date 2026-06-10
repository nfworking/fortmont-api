import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const publicRoutes = ["/login", "/login_webmail", "/signup"];
const apiAuthPrefix = "/api/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isLoggedIn = !!req.auth;

 const onboarded = (req.auth?.user as {
  isOnboarded?: boolean;
})?.isOnboarded;

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  const isOnboardingRoute =
    pathname === "/onboard/user" ||
    pathname.startsWith("/onboard/");

  // Allow NextAuth internal routes
  if (pathname.startsWith(apiAuthPrefix)) {
    return NextResponse.next();
  }

  // API auth enforcement
  if (pathname.startsWith("/api")) {
    if (!isLoggedIn) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "content-type": "application/json" },
        }
      );
    }

    return NextResponse.next();
  }

  // Require login
  if (!isPublicRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Force onboarding
  if (
    isLoggedIn &&
    onboarded === false &&
    !isOnboardingRoute
  ) {
    return NextResponse.redirect(
      new URL("/onboard/user", req.url)
    );
  }

  // Prevent onboarded users from revisiting onboarding
  if (
    isLoggedIn &&
    onboarded === true &&
    isOnboardingRoute
  ) {
    return NextResponse.redirect(
      new URL("/dashboard", req.url)
    );
  }

  // Prevent logged-in users from login pages
  if (isPublicRoute && isLoggedIn) {
    return NextResponse.redirect(
      new URL("/dashboard", req.url)
    );
  }

  return NextResponse.next();
});
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};