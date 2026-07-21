import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generatePlatformApiKeyMaterial,
  normalizePlatformScopes,
} from "@/lib/platform-api";
import { z } from "zod";
import { resolveTicketingActor } from "@/lib/ticketing-auth";

export const runtime = "nodejs";

const createKeySchema = z.object({
  name: z.string().trim().min(1).max(80),
  scopes: z.array(z.string()).min(1),
  expiresAt: z.string().datetime().optional().nullable(),
});

export async function GET(request: Request) {
  const actor = await resolveTicketingActor(request);

  if (!actor?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await prisma.platformApiKey.findMany({
    where: { userId: actor.userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      usageCount: true,
      lastUsedAt: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ keys });
}

export async function POST(req: Request) {
  const actor = await resolveTicketingActor(req);

  if (!actor?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createKeySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid API key payload" }, { status: 400 });
  }

  const scopes = normalizePlatformScopes(parsed.data.scopes);

  if (scopes.length === 0) {
    return NextResponse.json({ error: "At least one valid scope is required" }, { status: 400 });
  }

  const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
  const material = generatePlatformApiKeyMaterial();

  const createdKey = await prisma.platformApiKey.create({
    data: {
      userId: actor.userId,
      name: parsed.data.name,
      prefix: material.prefix,
      keyHash: material.keyHash,
      scopes,
      expiresAt,
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      usageCount: true,
      lastUsedAt: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    apiKey: material.apiKey,
    key: createdKey,
  }, { status: 201 });
}