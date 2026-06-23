import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

// Common public frontend routes. No need to list "/api/..." routes here.
const publicRoutes = ["/apps", "/forgot-password", "/reset-password", "/onboard"];
const authPages = ["/login", "/login_webmail", "/signup"];

export default auth(async (req) => {
  const { pathname, search } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // After determining the request is logged in, verify the session is still active via an API route
  if (isLoggedIn) {
    const token = req.auth as any;
    const sessionId = token?.sessionId as string | undefined;
    
    if (sessionId) {
      try {
        // Forward the session check to an API route running in the Node.js runtime
        const verifyRes = await fetch(new URL("/api/auth/verify-session", req.url), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store", // Ensure we don't cache this response
          body: JSON.stringify({ sessionId }),
        });

        const { active } = await verifyRes.json();

        if (!active) {
  // 1. Generate the base redirect response
  const response = NextResponse.redirect(new URL("/login", req.url));
  
  // 2. The explicit list of NextAuth cookies
  const cookiesToClear = [
    "next-auth.session-token", 
    "__Secure-next-auth.session-token", 
    "__Host-next-auth.session-token", 
    "next-auth.csrf-token", 
    "next-auth.callback-url", 
    "next-auth.state"
  ];
  
  // 3. Clear both response and request layers explicitly
  cookiesToClear.forEach((cookieName) => {
    // Tell Chrome to drop it instantly
    response.cookies.delete(cookieName);
    
    // Backup fallback: Set an explicit expired structure
    response.cookies.set({
      name: cookieName,
      value: "",
      maxAge: 0,
      path: "/",
    });
  });

  return response;
}
      } catch (err) {
        // If the internal API call fails, fail‑open to keep the app functional
        console.error("Middleware session verification fetch failed", err);
      }
    }
  }

  const onboarded = (req.auth?.user as { isOnboarded?: boolean })?.isOnboarded;

  // 1. Check if it's an API route OR listed in public frontend routes
  const isPublicRoute = 
    pathname.startsWith("/api") || 
    publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));

  const isAuthPage = authPages.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  const isOnboardingRoute = pathname === "/onboard/user" || pathname.startsWith("/onboard/");

  // Allow all API routes and public frontend routes globally
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Not logged in
  if (!isLoggedIn) {
    if (isAuthPage) {
      return NextResponse.next();
    }

    // Redirect to login and preserve destination
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // Force onboarding
  if (onboarded === false && !isOnboardingRoute) {
    return NextResponse.redirect(new URL("/onboard/user", req.url));
  }

  // Prevent onboarded users revisiting onboarding
  if (onboarded === true && isOnboardingRoute) {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    return NextResponse.redirect(new URL(callbackUrl || "/dashboard", req.url));
  }

  // Logged-in users shouldn't see login/signup
  if (isAuthPage) {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    return NextResponse.redirect(new URL(callbackUrl || "/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  // Balanced matcher to catch all standard pages while ignoring static assets
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};