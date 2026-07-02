import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { sendTwoFactorCode } from "@/lib/two-factor";

const startTwoFactorSchema = z.object({
  username: z.string().trim().min(1).transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = startTwoFactorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "username and password are required" }, { status: 400 });
  }

  const { username, password } = parsed.data;

  const user = await prisma.appUsers.findFirst({
    where: {
      OR: [{ username }, { email: username }],
    },
    select: {
      id: true,
      username: true,
      email: true,
      passwordHash: true,
      isActive: true,
      twoFactorEnabled: true,
      twoFactorMethod: true,
    },
  });

  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  if (!user.twoFactorEnabled) {
    return NextResponse.json({ requiresTwoFactor: false });
  }

  if (user.twoFactorMethod === "authenticator") {
    return NextResponse.json({
      requiresTwoFactor: true,
      method: "authenticator",
    });
  }

  if (!user.email) {
    return NextResponse.json({ error: "Two-factor authentication is not configured correctly" }, { status: 400 });
  }

  await sendTwoFactorCode({
    userId: user.id,
    email: user.email,
    username: user.username,
  });

  return NextResponse.json({
    requiresTwoFactor: true,
    method: "email",
    maskedEmail: maskEmail(user.email),
  });
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return email;

  const maskedName = name.length <= 2 ? `${name[0] ?? ""}***` : `${name.slice(0, 2)}***`;
  return `${maskedName}@${domain}`;
}
