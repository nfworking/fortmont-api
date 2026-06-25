import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server"; // Added NextRequest
import { auth } from "@/lib/auth";
import { decode } from "next-auth/jwt"; // Added decode to read mobile tokens

export const dynamic = "force-dynamic";

const AUTH_JWT_SALT = "authjs.session-token";

export async function GET(req: NextRequest) {
  let userId: string | undefined;
  let userRole: string | undefined;

  // 1. TRY MOBILE AUTHENTICATION FIRST (Bearer Token)
  const authHeader = req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const authSecret = process.env.AUTH_SECRET;

    if (authSecret) {
      try {
        const decoded: any = await decode({
          token,
          secret: authSecret,
          salt: AUTH_JWT_SALT,
        });

        if (decoded && decoded.sub) {
          userId = decoded.sub;
          userRole = decoded.role;
        }
      } catch (error) {
        console.error("Failed to decode mobile token:", error);
        return NextResponse.json({ error: "Invalid mobile token" }, { status: 401 });
      }
    }
  }

  // 2. FALLBACK TO WEB AUTHENTICATION (Cookies via auth())
  if (!userId) {
    const session = await auth();
    if (session?.user?.id) {
      userId = session.user.id;
      userRole = (session.user as any).role;
    }
  }

  // 3. REJECT IF NEITHER WORKED
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // FIXED: Evaluates isAdmin cleanly based on your role check logic
  // (Note: Make sure to fill in your admin criteria, e.g., userRole === "admin")
  const isAdmin = userRole === "admin" || userRole === "ticket_admin"; 

  // 4. FETCH TICKETS
  const tickets = await prisma.tickets.findMany({
    where: {
      ...(isAdmin
        ? {
            OR: [
              { status: null },
              { status: { not: "closed" } },
              { assignedToId: null },
            ],
          }
        : {
            assignedToId: userId,
            OR: [{ status: null }, { status: { not: "closed" } }],
          }),
    },
    include: {
      createdBy: true,
      assignedTo: true,
      comments: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(tickets, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}