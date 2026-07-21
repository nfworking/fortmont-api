import { PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT, importJWK, exportJWK } from 'jose';
import { randomBytes } from 'crypto';

// RSA key pair (generated once at server start; can be overridden by env vars)
let rsaPublicJwk: any = null;
let rsaPrivateKey: any = null;

async function getKeyPair() {
  if (rsaPublicJwk && rsaPrivateKey) return { rsaPublicJwk, rsaPrivateKey };
  const { publicKey, privateKey } = await import('jose').then(j => j.generateKeyPair('RS256'));
  rsaPublicJwk = await exportJWK(publicKey);
  rsaPrivateKey = privateKey;
  // set kid for JWKS
  rsaPublicJwk.kid = 'fortmont_key';
  return { rsaPublicJwk, rsaPrivateKey };
}

export async function signAccessToken(payload: object, expiresIn: string = '1h') {
  const { rsaPrivateKey } = await getKeyPair();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', kid: 'fortmont_key' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(rsaPrivateKey);
}

export async function getJWKS() {
  const { rsaPublicJwk } = await getKeyPair();
  return { keys: [rsaPublicJwk] };
}

export async function verifyClientSecret(clientSecretHash: string, secret: string): Promise<boolean> {
  return bcrypt.compare(secret, clientSecretHash);
}

export async function hashClientSecret(secret: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(secret, salt);
}

export async function generateRandomString(length: number = 32): Promise<string> {
  return randomBytes(length).toString('hex');
}
