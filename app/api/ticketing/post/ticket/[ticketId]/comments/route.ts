import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Add a new comment to a specific ticket
// Endpoint: POST https://api.fortmont.me/api/ticketing/post/ticket/[ticketId]/comments
export async function POST(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> } // Typed as a Promise for Next.js 15 compatibility
) {
  try {
    // CRITICAL FIX: Next.js 15 requires you to await params asynchronously
    const { ticketId } = await params; 
    
    const body = await request.json();
    const { text, authorId } = body;

    // 1. Validation
    if (!text || !authorId) {
      return NextResponse.json(
        { error: "Comment text and authorId are required" },
        { status: 400 }
      );
    }

    // 2. Create the comment linked to the ticket and user
    const newComment = await prisma.comment.create({
      data: {
        text,
        ticketId,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(newComment, { status: 201 });

  } catch (error: any) {
    console.error("Failed to add comment:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

// GET: Retrieve all comments for a specific ticket
// Endpoint: GET https://api.fortmont.me/api/ticketing/post/ticket/[ticketId]/comments
export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> } // Typed as a Promise for Next.js 15 compatibility
) {
  try {
    // CRITICAL FIX: Await params here as well
    const { ticketId } = await params;

    const comments = await prisma.comment.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" }, // Oldest comments first
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(comments, { status: 200 });

  } catch (error: any) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}