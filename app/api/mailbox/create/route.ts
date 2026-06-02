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

  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Missing email or password" },
      { status: 400 }
    );
  }

  // prevent duplicates
  const existing = await prisma.userMailbox.findFirst({
    where: {
      userId,
      email,
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Mailbox already exists" },
      { status: 409 }
    );
  }

  // verify IMAP login
  const client = new ImapFlow({
    host: process.env.IMAP_HOST!,
    port: 993,
    secure: true,
    auth: {
      user: email,
      pass: password,
    },
  });

  try {
    await client.connect();
    await client.logout();
  } catch {
    return NextResponse.json(
      { error: "Invalid mailbox credentials" },
      { status: 400 }
    );
  }

  // encrypt password
  const encryptedPassword = encrypt(password);

  // store
  const mailbox = await prisma.userMailbox.create({
    data: {
      userId,
      email,
      encryptedPassword,
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