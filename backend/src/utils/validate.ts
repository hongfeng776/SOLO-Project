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