import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hashClientSecret, generateRandomString } from '@/lib/oauth';
import { v4 as uuidv4 } from 'uuid';

// GET: list all OAuth clients (admin only)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const clients = await prisma.oAuthClient.findMany({
    select: { id: true, clientId: true, name: true, redirectUris: true, scopes: true, createdAt: true },
  });
  return NextResponse.json(clients);
}

// POST: create a new client (admin only)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { name, redirectUris, scopes } = await request.json();
  const clientId = uuidv4();
  const rawSecret = await generateRandomString(32);
  const clientSecret = await hashClientSecret(rawSecret);
  const client = await prisma.oAuthClient.create({
    data: {
      clientId,
      clientSecret,
      name,
      redirectUris: redirectUris as any, // stored as Json
      scopes: scopes as any,
    },
    select: { clientId: true, name: true },
  });
  return NextResponse.json({ clientId: client.clientId, clientSecret: rawSecret, name: client.name });
}

// DELETE: remove a client (admin only) – expects JSON body with clientId
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { clientId } = await request.json();
  await prisma.oAuthClient.delete({ where: { clientId } });
  return NextResponse.json({ success: true });
}
