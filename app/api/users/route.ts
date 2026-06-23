import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
// TODO: Import your auth library's session getter
import { auth } from "@/lib/auth"; 

export const runtime = "nodejs";

// Updated sanitizer helper to reflect the full structure returned by GET
function sanitizeAppUser(user: any) {
  // If you want to do any client-facing data stripping, do it here
  return user;
}

export async function GET(req: Request) {
  try {
    // 1. Get the current logged-in user session
    // Replace this with your actual auth checker (e.g., const session = await auth())
    const session = await auth(); 

    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch only THAT specific user using findUnique
    const user = await prisma.appUsers.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        isEntraUser: true,
        phone: true,
        mailboxes: {
          select: {
            id: true,
            email: true,
            isPrimary: true,
          },
        },
        teams: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        notifications: {
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
            read: true,
            createdAt: true,
          },
        },
        githubLink: {
          select: {
            username: true,
            profileUrl: true,
            avatarUrl: true,
            scope: true,
            linkedAt: true,
          }
        },
        sessions: {
          select: {
            id: true,
            userAgent: true,
            ipAddress: true,
            createdAt: true,
            expiresAt: true,
            lastActive: true,
          }
        },
        _count: {
          select: {
            createdTickets: true,
            assignedTickets: true,
          }
        }
      }
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(sanitizeAppUser(user));
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();

  const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const displayName = typeof body.displayName === "string" && body.displayName.trim() ? body.displayName.trim() : null;
  const email = typeof body.email === "string" && body.email.trim() ? body.email.trim().toLowerCase() : null;

  if (!username || !password) {
    return Response.json(
      { error: "username and password are required" },
      { status: 400 },
    );
  }

  const existingUser = await prisma.appUsers.findFirst({
    where: {
      OR: [{ username }, ...(email ? [{ email }] : [])],
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return Response.json(
      { error: "A user with that username or email already exists" },
      { status: 409 },
    );
  }

  const createdUser = await prisma.appUsers.create({
    data: {
      username,
      displayName,
      email,
      phone: typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null,
      passwordHash: hashPassword(password),
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return Response.json(createdUser, { status: 201 });
}