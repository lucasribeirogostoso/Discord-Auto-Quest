import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT = 'discord-auto-quest-salt-v1'; // Em produção, use algo mais seguro
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

// Gerar chave a partir de uma senha do sistema
function getKey(): Buffer {
  // Usar um ID único da máquina como "senha"
  const machineId = process.env.USERNAME || process.env.COMPUTERNAME || 'default-machine-id';
  return pbkdf2Sync(machineId, SALT, 10000, KEY_LENGTH, 'sha256');
}

export function encryptToken(token: string): string {
  try {
    const key = getKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Retornar: IV + AuthTag + Encrypted (tudo em hex)
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  } catch (error: any) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

export function decryptToken(encryptedToken: string): string {
  try {
    const parts = encryptedToken.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted token format');
    }

    const key = getKey();
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error: any) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}
