import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

export function hashPasswordSync(password: string): string {
  const salt = bcrypt.genSaltSync(SALT_ROUNDS);
  return bcrypt.hashSync(password, salt);
}

export async function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function comparePasswordSync(plainPassword: string, hashedPassword: string): boolean {
  return bcrypt.compareSync(plainPassword, hashedPassword);
}

export function validatePasswordStrength(password: string): {
  valid: boolean;
  message: string;
  level: number;
} {
  if (!password || password.length < 6) {
    return { valid: false, message: '密码长度不能少于6位', level: 0 };
  }
  if (password.length > 32) {
    return { valid: false, message: '密码长度不能超过32位', level: 0 };
  }

  let level = 0;
  const hasNumber = /\d/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\\/\[\]]/.test(password);

  if (hasNumber) level++;
  if (hasLower) level++;
  if (hasUpper) level++;
  if (hasSpecial) level++;

  if (password.length >= 12 && level >= 4) {
    return { valid: true, message: '密码强度: 强', level: 4 };
  }
  if (password.length >= 8 && level >= 3) {
    return { valid: true, message: '密码强度: 中', level: 3 };
  }
  if (password.length >= 6 && level >= 2) {
    return { valid: true, message: '密码强度: 弱', level: 2 };
  }

  return { valid: false, message: '密码过于简单，建议包含大小写字母、数字和特殊字符', level: 1 };
}

export function generateRandomPassword(length: number = 8): string {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const all = lower + upper + numbers + special;

  let password = '';
  password += lower[Math.floor(Math.random() * lower.length)];
  password += upper[Math.floor(Math.random() * upper.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = 4; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password.split('').sort(() => Math.random() - 0.5).join('');
}