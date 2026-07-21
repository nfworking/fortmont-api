import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import {
  confirmAuthenticatorSetup,
  consumeEmailTwoFactorCode,
  createAuthenticatorSetup,
  sendTwoFactorCode,
} from "@/lib/two-factor";
import { resolveTicketingActor } from "@/lib/ticketing-auth";

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  method: z.enum(["email", "authenticator"]).default("email"),
});

const verifySchema = z.object({
  code: z.string().min(1),
  method: z.enum(["email", "authenticator"]).default("email"),
});

export async function GET(request: NextRequest) {
  const actor = await resolveTicketingActor(request);
  const userId = actor?.userId;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.appUsers.findUnique({
    where: { id: userId },
    select: {
      email: true,
      twoFactorEnabled: true,
      twoFactorMethod: true,
      twoFactorTotpSecret: true,
      twoFactorPendingTotpSecret: true,
      oneTimePassword: {
        select: {
          expiresAt: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    enabled: user.twoFactorEnabled,
    method: user.twoFactorMethod,
    hasEmail: Boolean(user.email),
    email: user.email ? maskEmail(user.email) : null,
    hasAuthenticator: Boolean(user.twoFactorTotpSecret),
    pendingAuthenticatorVerification: Boolean(user.twoFactorPendingTotpSecret),
    pendingVerification:
      Boolean(user.oneTimePassword) && user.oneTimePassword!.expiresAt > new Date(),
  });
}

export async function POST(request: NextRequest) {
  const actor = await resolveTicketingActor(request);
  const userId = actor?.userId;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = passwordSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Current password is required" }, { status: 400 });
  }

  const user = await prisma.appUsers.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      passwordHash: true,
      twoFactorEnabled: true,
      twoFactorMethod: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.twoFactorEnabled && user.twoFactorMethod === parsed.data.method) {
    return NextResponse.json({ enabled: true });
  }

  if (parsed.data.method === "email" && !user.email) {
    return NextResponse.json({ error: "Add an email address before enabling 2FA" }, { status: 400 });
  }

  if (!verifyPassword(parsed.data.currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
  }

  if (parsed.data.method === "authenticator") {
    const setup = await createAuthenticatorSetup({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    return NextResponse.json({
      ok: true,
      method: "authenticator",
      qrCodeDataUrl: setup.qrCodeDataUrl,
      manualEntryKey: setup.secret,
      otpauthUrl: setup.otpauthUrl,
    });
  }

  await sendTwoFactorCode({
    userId: user.id,
    email: user.email!,
    username: user.username,
  });

  return NextResponse.json({
    ok: true,
    method: "email",
    maskedEmail: maskEmail(user.email!),
  });
}

export async function PUT(request: NextRequest) {
  const actor = await resolveTicketingActor(request);
  const userId = actor?.userId;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = verifySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Verification code is required" }, { status: 400 });
  }

  const isValid =
    parsed.data.method === "authenticator"
      ? await confirmAuthenticatorSetup(userId, parsed.data.code)
      : await consumeEmailTwoFactorCode(userId, parsed.data.code);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
  }

  if (parsed.data.method === "email") {
    await prisma.appUsers.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorMethod: "email",
      },
    });
  }

  return NextResponse.json({ enabled: true, method: parsed.data.method });
}

export async function DELETE(request: NextRequest) {
  const actor = await resolveTicketingActor(request);
  const userId = actor?.userId;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = passwordSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Current password is required" }, { status: 400 });
  }

  const user = await prisma.appUsers.findUnique({
    where: { id: userId },
    select: {
      passwordHash: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!verifyPassword(parsed.data.currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.appUsers.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorMethod: "email",
        twoFactorTotpSecret: null,
        twoFactorPendingTotpSecret: null,
      },
    }),
    prisma.oneTimePassword.deleteMany({
      where: { userId },
    }),
  ]);

  return NextResponse.json({ enabled: false });
}

async function readJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return email;

  const maskedName = name.length <= 2 ? `${name[0] ?? ""}***` : `${name.slice(0, 2)}***`;
  return `${maskedName}@${domain}`;
}
