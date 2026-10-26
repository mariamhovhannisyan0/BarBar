import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;

/**
 * Hashes a plaintext password using scrypt with a random 16-byte salt.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${derivedKey}`;
}

/**
 * Verifies a plaintext password against a stored scrypt hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 3 || parts[0] !== "scrypt") {
      return false;
    }

    const [, salt, keyHex] = parts;
    const keyBuffer = Buffer.from(keyHex, "hex");
    const derivedKey = scryptSync(password, salt, KEY_LENGTH);

    if (keyBuffer.length !== derivedKey.length) {
      return false;
    }

    return timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

