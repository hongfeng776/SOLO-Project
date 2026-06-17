import { ObjectSchema, ValidationResult } from 'joi';
import { ValidationError } from './error';

export function validateData<T = any>(
  data: T,
  schema: ObjectSchema
): T {
  const result: ValidationResult = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (result.error) {
    const errors = result.error.details.map(d => ({
      field: d.path.join('.'),
      message: d.message
    }));
    const message = errors.map(e => e.message).join('; ');
    throw new ValidationError(message, errors);
  }

  return result.value as T;
}

export function validatePartial<T = any>(
  data: Partial<T>,
  schema: ObjectSchema,
  options?: {
    presence?: 'optional' | 'required';
  }
): Partial<T> {
  const presence = options?.presence || 'optional';
  const result: ValidationResult = schema.fork(
    Object.keys(schema.describe().keys),
    (schema) => schema.presence(presence)
  ).validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (result.error) {
    const errors = result.error.details.map(d => ({
      field: d.path.join('.'),
      message: d.message
    }));
    const message = errors.map(e => e.message).join('; ');
    throw new ValidationError(message, errors);
  }

  return result.value as Partial<T>;
}

export function isValidId(id: string): boolean {
  if (!id) return false;
  const idRegex = /^[a-zA-Z0-9_-]{1,64}$/;
  return idRegex.test(id);
}

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

export function isValidAmount(amount: number): boolean {
  if (typeof amount !== 'number' || isNaN(amount)) return false;
  return amount >= 0 && amount <= 999999999999.99;
}

export function isValidUsername(username: string): boolean {
  if (!username) return false;
  const usernameRegex = /^[a-zA-Z0-9_]{4,32}$/;
  return usernameRegex.test(username);
}

export function isValidMobile(mobile: string): boolean {
  return isValidPhone(mobile);
}

export function isValidIdCard(idCard: string): boolean {
  if (!idCard) return false;
  const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
  if (!idCardRegex.test(idCard)) return false;
  if (idCard.length === 18) {
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(idCard[i], 10) * weights[i];
    }
    return codes[sum % 11].toUpperCase() === idCard[17].toUpperCase();
  }
  return true;
}