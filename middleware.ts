import NextAuth from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const publicRoutes = [
  "/apps",
  "/forgot-password",
  "/reset-password",
  "/onboard",
  "/privacy-policy",
  "/terms-of-service",
  "/.well-known",
];

const authPages = ["/login", "/login_webmail", "/signup", "/oauth/login"];

function isOAuthConnectRoute(pathname: string): boolean {
  return (
    pathname === "/oauth/login" ||
    pathname === "/oauth/consent" ||
    pathname.startsWith("/oauth/login/") ||
    pathname.startsWith("/oauth/consent/")
  );
}

function redirectToLogin(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isOAuthFlow =
    pathname === "/oauth" ||
    pathname.startsWith("/oauth/") ||
    pathname.startsWith("/api/oauth/");

  const loginPath = isOAuthFlow ? "/oauth/login" : "/login";

  if (isOAuthFlow) {
    const loginUrl = new URL(loginPath, req.url);
    if (pathname.startsWith("/api/oauth/authorize")) {
      loginUrl.searchParams.set("callbackUrl", pathname + search);
    } else if (pathname.startsWith("/oauth/consent")) {
      const authorize = new URL("/api/oauth/authorize", req.url);
      req.nextUrl.searchParams.forEach((value, key) => {
        if (key !== "consent") authorize.searchParams.set(key, value);
      });
      loginUrl.searchParams.set("callbackUrl", authorize.pathname + authorize.search);
    }

    const clientId = req.nextUrl.searchParams.get("client_id");
    if (clientId) loginUrl.searchParams.set("client_id", clientId);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(loginPath, req.url));
}

export default auth(async (req) => {
  const { pathname, search } = req.nextUrl;
  const isPublicRoute =
    pathname.startsWith("/api") ||
    publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;
  const isAuthPage = authPages.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
  const isOnboardingRoute = pathname === "/onboard/user" || pathname.startsWith("/onboard/");
  const isOAuthUi = isOAuthConnectRoute(pathname);

  let verifiedOnboarded: boolean | undefined;

  if (isLoggedIn) {
    try {
      const verifyRes = await fetch(new URL("/api/auth/verify-session", req.url), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie") ?? "",
        },
        cache: "no-store",
        body: JSON.stringify({}),
      });

      const verification = (await verifyRes.json()) as {
        active?: boolean;
        onboarded?: boolean;
      };

      verifiedOnboarded = verification.onboarded;

      if (!verifyRes.ok || !verification.active) {
        return redirectToLogin(req);
      }
    } catch (error) {
      console.error("Middleware session verification fetch failed", error);
      return redirectToLogin(req);
    }
  }

  const onboarded = verifiedOnboarded === true;

  if (!isLoggedIn) {
    if (isAuthPage) {
      return NextResponse.next();
    }

    if (isOAuthUi) {
      const loginUrl = new URL("/oauth/login", req.url);
      if (pathname.startsWith("/oauth/consent")) {
        const authorize = new URL("/api/oauth/authorize", req.url);
        req.nextUrl.searchParams.forEach((value, key) => {
          if (key !== "consent") authorize.searchParams.set(key, value);
        });
        loginUrl.searchParams.set("callbackUrl", authorize.pathname + authorize.search);
      } else {
        loginUrl.searchParams.set("callbackUrl", pathname + search);
      }

      const clientId = req.nextUrl.searchParams.get("client_id");
      if (clientId) loginUrl.searchParams.set("client_id", clientId);
      return NextResponse.redirect(loginUrl);
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  if (onboarded !== true && !isOnboardingRoute && !isOAuthUi) {
    return NextResponse.redirect(new URL("/onboard/user", req.url));
  }

  if (onboarded === true && isOnboardingRoute) {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    return NextResponse.redirect(new URL(callbackUrl || "/dashboard", req.url));
  }

  if (isAuthPage) {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    if (callbackUrl) {
      return NextResponse.redirect(new URL(callbackUrl, req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
