import crypto from 'node:crypto';
import { config } from '../../infrastructure/config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;

function requireKey() {
  if (!config.encryption.key) {
    throw new Error(
      'TOKEN_ENCRYPTION_KEY is not set — cannot encrypt/decrypt LinkedIn tokens. Set it in the environment before connecting a LinkedIn account.',
    );
  }
  return crypto.createHash('sha256').update(config.encryption.key).digest();
}

/**
 * @param {string} plaintext
 * @returns {string} base64(iv || authTag || ciphertext)
 */
export function encrypt(plaintext) {
  const key = requireKey();
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
}

/**
 * @param {string} payload output of `encrypt()`
 * @returns {string} the original plaintext
 */
export function decrypt(payload) {
  const key = requireKey();
  const raw = Buffer.from(payload, 'base64');
  const iv = raw.subarray(0, IV_LENGTH_BYTES);
  const authTag = raw.subarray(IV_LENGTH_BYTES, IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES);
  const ciphertext = raw.subarray(IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
