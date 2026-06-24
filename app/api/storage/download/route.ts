// app/api/storage/download/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { s3Client } from "@/lib/s3";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET_NAME = process.env.S3_BUCKET!;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const fileId = req.nextUrl.searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "fileId is required" },
        { status: 400 }
      );
    }

    const file = await prisma.file.findUnique({
      where: {
        id: fileId,
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Owner check
    if (file.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: file.objectKey,

      ResponseContentDisposition:
        `attachment; filename="${file.name}"`,
    });

    const downloadUrl = await getSignedUrl(
      s3Client,
      command,
      {
        expiresIn: 300, // 5 minutes
      }
    );

    return NextResponse.json({
      url: downloadUrl,
      fileName: file.name,
    });
  } catch (error) {
    console.error(error);

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