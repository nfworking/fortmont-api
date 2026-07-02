import crypto from "crypto";
import QRCode from "qrcode";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const OTP_TTL_MS = 10 * 60 * 1000;
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function getOtpPepper() {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "fortmont-otp";
}

function getEncryptionKey() {
  return crypto.createHash("sha256").update(getOtpPepper()).digest();
}

function encryptSecret(secret: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

function decryptSecret(encryptedSecret: string) {
  const [ivValue, tagValue, encryptedValue] = encryptedSecret.split(".");
  if (!ivValue || !tagValue || !encryptedValue) return null;

  try {
    const iv = Buffer.from(ivValue, "base64url");
    const tag = Buffer.from(tagValue, "base64url");
    const encrypted = Buffer.from(encryptedValue, "base64url");
    const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

function hashOtp(code: string) {
  return crypto
    .createHmac("sha256", getOtpPepper())
    .update(code)
    .digest("hex");
}

function verifyHash(code: string, codeHash: string) {
  const candidate = Buffer.from(hashOtp(code), "hex");
  const expected = Buffer.from(codeHash, "hex");

  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

export function normalizeOtpCode(value: unknown) {
  return typeof value === "string" ? value.replace(/\D/g, "").slice(0, 6) : "";
}

function toBase32(buffer: Buffer) {
  let bits = "";
  let output = "";

  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, "0");
  }

  for (let index = 0; index < bits.length; index += 5) {
    const chunk = bits.slice(index, index + 5).padEnd(5, "0");
    output += BASE32_ALPHABET[parseInt(chunk, 2)];
  }

  return output;
}

function fromBase32(secret: string) {
  const normalized = secret.replace(/=+$/g, "").replace(/\s/g, "").toUpperCase();
  let bits = "";

  for (const char of normalized) {
    const value = BASE32_ALPHABET.indexOf(char);
    if (value === -1) return null;
    bits += value.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(parseInt(bits.slice(index, index + 8), 2));
  }

  return Buffer.from(bytes);
}

function generateTotpCode(secret: string, timeStep: number) {
  const key = fromBase32(secret);
  if (!key) return null;

  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(timeStep));

  const hmac = crypto.createHmac("sha1", key).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (binary % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, "0");
}

function verifyTotp(secret: string, rawCode: unknown) {
  const code = normalizeOtpCode(rawCode);
  if (code.length !== TOTP_DIGITS) return false;

  const currentStep = Math.floor(Date.now() / 1000 / TOTP_PERIOD_SECONDS);

  for (const skew of [-1, 0, 1]) {
    const expectedCode = generateTotpCode(secret, currentStep + skew);
    if (!expectedCode) return false;

    const candidate = Buffer.from(code);
    const expected = Buffer.from(expectedCode);
    if (candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected)) {
      return true;
    }
  }

  return false;
}

function getAppIssuer() {
  return process.env.NEXT_PUBLIC_APP_NAME ?? "Fortmont";
}

export async function createAuthenticatorSetup({
  userId,
  username,
  email,
}: {
  userId: string;
  username: string;
  email: string | null;
}) {
  const secret = toBase32(crypto.randomBytes(20));
  const label = encodeURIComponent(`${getAppIssuer()}:${email ?? username}`);
  const issuer = encodeURIComponent(getAppIssuer());
  const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD_SECONDS}`;
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 220,
  });

  await prisma.appUsers.update({
    where: { id: userId },
    data: {
      twoFactorPendingTotpSecret: encryptSecret(secret),
    },
  });

  return {
    secret,
    otpauthUrl,
    qrCodeDataUrl,
  };
}

export async function confirmAuthenticatorSetup(userId: string, rawCode: unknown) {
  const user = await prisma.appUsers.findUnique({
    where: { id: userId },
    select: {
      twoFactorPendingTotpSecret: true,
    },
  });

  if (!user?.twoFactorPendingTotpSecret) return false;

  const secret = decryptSecret(user.twoFactorPendingTotpSecret);
  if (!secret || !verifyTotp(secret, rawCode)) return false;

  await prisma.appUsers.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorMethod: "authenticator",
      twoFactorTotpSecret: user.twoFactorPendingTotpSecret,
      twoFactorPendingTotpSecret: null,
    },
  });

  return true;
}

export async function verifyTwoFactorCode(userId: string, rawCode: unknown) {
  const user = await prisma.appUsers.findUnique({
    where: { id: userId },
    select: {
      twoFactorMethod: true,
      twoFactorTotpSecret: true,
    },
  });

  if (user?.twoFactorMethod === "authenticator") {
    if (!user.twoFactorTotpSecret) return false;

    const secret = decryptSecret(user.twoFactorTotpSecret);
    return Boolean(secret && verifyTotp(secret, rawCode));
  }

  return consumeEmailTwoFactorCode(userId, rawCode);
}

export async function sendTwoFactorCode({
  userId,
  email,
  username,
}: {
  userId: string;
  email: string;
  username: string;
}) {
  const code = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.oneTimePassword.upsert({
    where: { userId },
    update: {
      codeHash: hashOtp(code),
      expiresAt,
      createdAt: new Date(),
    },
    create: {
      userId,
      codeHash: hashOtp(code),
      expiresAt,
    },
  });

  await sendEmail({
    to: email,
    subject: "Your Fortmont verification code",
    html: `
      <p>Hello ${username},</p>
      <p>Your Fortmont verification code is <strong>${code}</strong>.</p>
      <p>This code expires in 10 minutes.</p>
    `,
  });
}

export async function consumeEmailTwoFactorCode(userId: string, rawCode: unknown) {
  const code = normalizeOtpCode(rawCode);
  if (code.length !== 6) return false;

  const record = await prisma.oneTimePassword.findUnique({
    where: { userId },
  });

  if (!record || record.expiresAt < new Date()) {
    if (record) {
      await prisma.oneTimePassword.delete({ where: { userId } }).catch(() => undefined);
    }

    return false;
  }

  const isValid = verifyHash(code, record.codeHash);
  if (!isValid) return false;

  await prisma.oneTimePassword.delete({
    where: { userId },
  });

  return true;
}
