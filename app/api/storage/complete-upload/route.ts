import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { s3Client } from "@/lib/s3";

import {
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

const BUCKET_NAME = process.env.S3_BUCKET!;

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { uploadId } = await req.json();

    const pending =
      await prisma.pendingUpload.findUnique({
        where: {
          id: uploadId,
        },
      });

    if (!pending) {
      return NextResponse.json(
        {
          error: "Upload not found",
        },
        {
          status: 404,
        }
      );
    }

    if (
      pending.userId !==
      session.user.id
    ) {
      return NextResponse.json(
        {
          error: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    await s3Client.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: pending.objectKey,
      })
    );

    const [savedFile] =
      await prisma.$transaction([
        prisma.file.create({
          data: {
            ownerId: pending.userId,
            bucket: BUCKET_NAME,
            objectKey: pending.objectKey,
            name: pending.fileName,
            size: pending.fileSize,
            mimeType: pending.mimeType,
            ticketId: pending.ticketId,

            fileActivities: {
              create: {
                userId: pending.userId,
                action: "UPLOAD",
              },
            },
          },
        }),

        prisma.userStorage.update({
          where: {
            userId: pending.userId,
          },
          data: {
            usedBytes: {
              increment:
                pending.fileSize,
            },
          },
        }),

        prisma.pendingUpload.delete({
          where: {
            id: pending.id,
          },
        }),
      ]);

    return NextResponse.json({
      success: true,
      fileId: savedFile.id,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Upload verification failed",
      },
      {
        status: 500,
      }
    );
  }
}