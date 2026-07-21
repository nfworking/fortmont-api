import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { s3Client } from "@/lib/s3";
import { resolveTicketingActor } from "@/lib/ticketing-auth";

import crypto from "crypto";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET_NAME = process.env.S3_BUCKET!;

export async function POST(req: Request) {
  try {
    const actor = await resolveTicketingActor(req);

    if (!actor?.userId) {
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
        userId: actor.userId,
      },
      update: {},
      create: {
        userId: actor.userId,
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
      `uploads/${actor.userId}/${fileUuid}-${fileName}`;

    const pendingUpload =
      await prisma.pendingUpload.create({
        data: {
          userId: actor.userId,
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