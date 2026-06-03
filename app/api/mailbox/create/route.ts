import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/mailboxPassword";
import { ImapFlow } from "imapflow";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const name = session.user.name ?? `user-${userId}`;
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Missing email or password" },
      { status: 400 }
    );
  }

  // prevent duplicates
  const existing = await prisma.userMailbox.findFirst({
    where: { userId, email },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Mailbox already exists" },
      { status: 409 }
    );
  }

  /**
   * 1. CREATE mailbox on mail server (MISSING IN YOUR CURRENT CODE)
   */
  try {
    await fetch(`${process.env.MAILBOX_API}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.MAILCOW_API_TOKEN!,
      },
      body: JSON.stringify({
        local_part: email.split("@")[0],
        domain: email.split("@")[1],
        name: name,
        quota: 1000, // default to 1000MB if not set
        password: password,
        password2: password,
        active: "1",
        force_pw_update: "1",
        tls_enforce_in: "1",
        tls_enforce_out: "1",
      }),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create mailbox on mail server", errorDetails: (err as Error).message },
      { status: 500 }
    );
  }

  /**
   * 2. VERIFY IMAP (optional safety check)
   */
  const client = new ImapFlow({
    host: process.env.IMAP_HOST!,
    port: 993,
    secure: true,
    auth: { user: email, pass: password },
  });

  try {
    await client.connect();
    await client.logout();
  } catch (err) {
    return NextResponse.json(
      { error: "Mailbox created but IMAP login failed", errorDetails: (err as Error).message },
      { status: 502 }
    );
  }

  /**
   * 3. STORE in DB
   */
  const mailbox = await prisma.userMailbox.create({
    data: {
      userId,
      email,
      encryptedPassword: encrypt(password),
    },
  });

  return NextResponse.json({
    success: true,
    mailbox: {
      id: mailbox.id,
      email: mailbox.email,
    },
  });
}