import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(req: Request) {
  const { token, password } = await req.json();

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record || record.expiresAt < new Date()) {
    return new Response("Invalid or expired token", { status: 400 });
  }

  const hashed = hashPassword(password);

  await prisma.appUsers.update({
    where: { id: record.userId },
    data: { passwordHash: hashed },
  });

  // delete token after use
  await prisma.passwordResetToken.delete({
    where: { token },
  });

  return Response.json({ ok: true });
}