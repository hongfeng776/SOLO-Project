import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
const SECRET_KEY = process.env.ENCRYPT_SECRET || 'annotation-project-secret-key-2025';

class EncryptUtil {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  md5(str: string): string {
    return crypto.createHash('md5').update(str).digest('hex');
  }

  sha256(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.sha256(SECRET_KEY).slice(0, 32)),
      iv,
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(encrypted: string): string {
    const parts = encrypted.split(':');
    const ivHex = parts[0];
    const encryptedHex = parts.slice(1).join(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.sha256(SECRET_KEY).slice(0, 32)),
      iv,
    );
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  randomString(length = 32): string {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  }

  uuid(): string {
    return crypto.randomUUID();
  }
}

export const encryptUtil = new EncryptUtil();
export default encryptUtil;
