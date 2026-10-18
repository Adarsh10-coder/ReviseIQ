import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

// Ensure a 32-byte key
function getKey() {
  const secret = process.env.ENCRYPTION_KEY || "reviseiq_default_secure_32_bytes_key!";
  return crypto.createHash("sha256").update(String(secret)).digest();
}

/**
 * Encrypt a plain text string using AES-256-CBC
 * @param {string} text 
 * @returns {string} iv:encryptedData
 */
export function encryptToken(text) {
  if (!text) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt an AES-256-CBC encrypted token string
 * @param {string} encryptedText iv:encryptedData
 * @returns {string} decrypted plain text
 */
export function decryptToken(encryptedText) {
  if (!encryptedText) return "";
  try {
    const [ivHex, dataHex] = encryptedText.split(":");
    if (!ivHex || !dataHex) return "";
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    let decrypted = decipher.update(dataHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Token decryption failed:", err.message);
    return "";
  }
}
