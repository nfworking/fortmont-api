import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { s3Client } from "@/lib/s3";

import crypto from "crypto";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

    const {
      fileName,
      fileType,
      fileSize,
      ticketId,
    } = await req.json();

    const fileSizeBigInt = BigInt(fileSize);

    const storage = await prisma.userStorage.upsert({
      where: {
        userId: session.user.id,
      },
      update: {},
      create: {
        userId: session.user.id,
      },
    });

    if (
      storage.usedBytes +
      fileSizeBigInt >
      storage.quotaBytes
    ) {
      return NextResponse.json(
        {
          error: "Storage quota exceeded",
        },
        {
          status: 413,
        }
      );
    }

    const fileUuid = crypto.randomUUID();

    const objectKey =
      `uploads/${session.user.id}/${fileUuid}-${fileName}`;

    const pendingUpload =
      await prisma.pendingUpload.create({
        data: {
          userId: session.user.id,
          objectKey,
          fileName,
          fileSize: fileSizeBigInt,
          mimeType: fileType,
          ticketId,
        },
      });

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
    });
   
    const uploadUrl = await getSignedUrl(
      s3Client,
      command,
      {
        expiresIn: 300,
      }
    );
     console.log(uploadUrl);
    return NextResponse.json({
      uploadId: pendingUpload.id,
      uploadUrl,
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