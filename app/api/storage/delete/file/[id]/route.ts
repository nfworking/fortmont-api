// app/api/storage/delete/[id]/route.ts

import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import { prisma } from "@/lib/prisma";
import { s3Client } from "@/lib/s3";
import { resolveTicketingActor } from "@/lib/ticketing-auth";

const BUCKET_NAME = process.env.S3_BUCKET!;

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await resolveTicketingActor(req);

    if (!actor?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Owner check
    if (file.ownerId !== actor.userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Delete from SeaweedFS
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: file.objectKey,
      })
    );

    // Delete DB record and update quota
    await prisma.$transaction([
      prisma.file.delete({
        where: {
          id: file.id,
        },
      }),

      prisma.userStorage.update({
        where: {
          userId: file.ownerId,
        },
        data: {
          usedBytes: {
            decrement: file.size,
          },
        },
      }),

      
    ]);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Delete failed:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}