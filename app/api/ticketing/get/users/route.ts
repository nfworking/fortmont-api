// app/api/tickets/users/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma" // Adjust this import path to point to your prisma client instance

export async function GET() {
  try {
    // Querying your appUsers model
    const appUsers = await prisma.appUsers.findMany({
      select: {
        id: true,
        displayName: true,
        email: true,
      },
      orderBy: {
        displayName: 'asc'
      }
    })

    return NextResponse.json(appUsers)
  } catch (error) {
    console.error("Failed to fetch users from Prisma:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}