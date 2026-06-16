import { Request } from 'express';

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'] as string;
  if (forwarded) {
    const ips = forwarded.split(',');
    return ips[0].trim();
  }

  const realIp = req.headers['x-real-ip'] as string;
  if (realIp) {
    return realIp.trim();
  }

  const connection = req.connection;
  if (connection && connection.remoteAddress) {
    return connection.remoteAddress;
  }

  if (req.socket && req.socket.remoteAddress) {
    return req.socket.remoteAddress;
  }

  return '0.0.0.0';
}

export function getUserAgent(req: Request): string {
  return (req.headers['user-agent'] as string) || '';
}

export function getRequestUrl(req: Request): string {
  return req.originalUrl || req.url || '';
}

export function getRequestMethod(req: Request): string {
  return req.method || '';
}

export function maskSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sensitiveFields = ['password', 'token', 'secret', 'access_token', 'refresh_token'];
  const result: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (sensitiveFields.includes(key.toLowerCase()) && typeof value === 'string') {
        result[key] = '******';
      } else if (typeof value === 'object') {
        result[key] = maskSensitiveData(value);
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}