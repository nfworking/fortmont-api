import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const PASSWORD_HASH_ALGORITHM = "sha512";
const PASSWORD_HASH_KEY_LENGTH = 64;
const PASSWORD_HASH_ITERATIONS = 210000;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(
    password,
    salt,
    PASSWORD_HASH_ITERATIONS,
    PASSWORD_HASH_KEY_LENGTH,
    PASSWORD_HASH_ALGORITHM,
  ).toString("hex");

  return `${PASSWORD_HASH_ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [iterations, salt, hash] = storedHash.split(":");

  if (!iterations || !salt || !hash) {
    return false;
  }

  const parsedIterations = Number(iterations);

  if (!Number.isFinite(parsedIterations)) {
    return false;
  }

  try {
    const expectedHash = Buffer.from(hash, "hex");
    const derivedHash = pbkdf2Sync(
      password,
      salt,
      parsedIterations,
      expectedHash.length,
      PASSWORD_HASH_ALGORITHM,
    );

    return expectedHash.length > 0 && timingSafeEqual(expectedHash, derivedHash);
  } catch {
    return false;
  }
}