const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const DEFAULT_KEY_STRING = process.env.META_TOKEN_ENCRYPTION_KEY || 'codigix_secret_32_byte_token_encryption_key_2026!';

function getEncryptionKey() {
  return crypto.createHash('sha256').update(DEFAULT_KEY_STRING).digest();
}

/**
 * Encrypts a plaintext Meta Access Token using AES-256-GCM.
 * @param {string} text 
 * @returns {string} iv:authTag:encryptedHex
 */
function encryptToken(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an encrypted token string (iv:authTag:encryptedHex) back to plaintext.
 * @param {string} encryptedString 
 * @returns {string|null}
 */
function decryptToken(encryptedString) {
  if (!encryptedString) return null;
  
  // Fallback for unencrypted legacy tokens if passed directly
  if (!encryptedString.includes(':')) {
    return encryptedString;
  }

  try {
    const parts = encryptedString.split(':');
    if (parts.length !== 3) return encryptedString;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = getEncryptionKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[MetaEncryption] Decryption error:', err.message);
    return null;
  }
}

module.exports = {
  encryptToken,
  decryptToken
};
