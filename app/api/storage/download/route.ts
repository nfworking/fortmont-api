// app/api/storage/download/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { s3Client } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { resolveTicketingActor } from "@/lib/ticketing-auth";

export const runtime = "nodejs";

const BUCKET_NAME = process.env.S3_BUCKET!;

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveTicketingActor(req);
    const userId = actor?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileId = req.nextUrl.searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (file.ownerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: file.objectKey,
      ResponseContentDisposition: `attachment; filename="${file.name}"`,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return NextResponse.json({ url: downloadUrl, fileName: file.name });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}