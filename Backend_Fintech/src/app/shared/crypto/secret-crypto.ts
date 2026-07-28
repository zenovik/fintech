import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { env } from '../../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function deriveKey(raw: string): Buffer {
  return createHash('sha256').update(raw).digest();
}

export function encryptSecret(plaintext: string): string {
  const key = deriveKey(env.secrets.configEncryptionKey);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptSecret(ciphertext: string): string {
  const key = deriveKey(env.secrets.configEncryptionKey);
  const buf = Buffer.from(ciphertext, 'base64');
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = buf.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function isEncryptedValue(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const buf = Buffer.from(value, 'base64');
    return buf.length > IV_LENGTH + TAG_LENGTH + 1;
  } catch {
    return false;
  }
}

export function resolveSecret(stored: string | null | undefined, legacyPlain?: boolean): string | null {
  if (!stored) return null;
  if (legacyPlain && !isEncryptedValue(stored)) return stored;
  try {
    return decryptSecret(stored);
  } catch {
    return legacyPlain ? stored : null;
  }
}
