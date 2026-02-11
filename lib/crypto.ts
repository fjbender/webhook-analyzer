import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY must be defined in environment variables");
}

/**
 * Encrypt sensitive data (like Mollie API keys)
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  const key = crypto.pbkdf2Sync(ENCRYPTION_KEY!, salt, 100000, 32, "sha512");

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, tag, encrypted]).toString("base64");
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string): string {
  const buffer = Buffer.from(encryptedData, "base64");

  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = crypto.pbkdf2Sync(ENCRYPTION_KEY!, salt, 100000, 32, "sha512");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(encrypted) + decipher.final("utf8");
}

/**
 * Verify HMAC signature for next-gen webhooks
 */
export function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest("hex");

  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}
