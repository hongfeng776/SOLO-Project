import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';
import { ApiResponse, ResponseCode } from '../utils/response';

export interface CacheHitOptions {
  ttl?: number;
  includeAuth?: boolean;
  keyPrefix?: string;
  methods?: string[];
  statusCodes?: number[];
  cacheablePaths?: string[];
  skipPaths?: string[];
  useCompression?: boolean;
}

interface CachedResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  contentType: string;
  cachedAt: number;
}

const DEFAULT_OPTIONS: Required<CacheHitOptions> = {
  ttl: 300,
  includeAuth: false,
  keyPrefix: 'apicache',
  methods: ['GET'],
  statusCodes: [200, 201],
  cacheablePaths: [],
  skipPaths: [],
  useCompression: false,
};

export function cacheHit(options: CacheHitOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!shouldCache(req, config)) {
        next();
        return;
      }

      const cacheKey = generateCacheKey(req, config);
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        const parsed: CachedResponse = JSON.parse(cachedData);

        if (parsed.headers) {
          for (const [key, value] of Object.entries(parsed.headers)) {
            res.setHeader(key, value);
          }
        }

        res.setHeader('X-Cache-Hit', 'true');
        res.setHeader('X-Cache-Key', cacheKey);
        res.setHeader('X-Cache-Age', String(Math.floor((Date.now() - parsed.cachedAt) / 1000)));

        if (parsed.contentType && parsed.contentType.includes('application/json')) {
          res.status(parsed.status).json(JSON.parse(parsed.body));
        } else {
          res.status(parsed.status).send(parsed.body);
        }
        return;
      }

      res.setHeader('X-Cache-Hit', 'false');
      res.setHeader('X-Cache-Key', cacheKey);

      captureResponse(res, async (status, headers, body, contentType) => {
        if (!config.statusCodes.includes(status)) return;

        if (contentType && contentType.includes('application/json')) {
          try {
            const jsonBody = JSON.parse(body) as ApiResponse;
            if (jsonBody.code !== ResponseCode.SUCCESS && jsonBody.code !== 201) return;
          } catch {
            return;
          }
        }

        const cacheEntry: CachedResponse = {
          status,
          headers: filterHeaders(headers),
          body,
          contentType,
          cachedAt: Date.now(),
        };

        try {
          const ttl = config.ttl;
          await redis.setex(cacheKey, ttl, JSON.stringify(cacheEntry));
        } catch (cacheErr) {
          console.warn('Failed to write cache:', cacheErr);
        }
      });

      next();
    } catch (err) {
      console.warn('Cache middleware error:', err);
      next();
    }
  };
}

function shouldCache(req: Request, config: Required<CacheHitOptions>): boolean {
  if (!config.methods.includes(req.method)) return false;

  if (config.skipPaths.length > 0) {
    if (config.skipPaths.some((pattern) => req.path.match(pattern))) {
      return false;
    }
  }

  if (config.cacheablePaths.length > 0) {
    if (!config.cacheablePaths.some((pattern) => req.path.match(pattern))) {
      return false;
    }
  }

  return true;
}

function generateCacheKey(req: Request, config: Required<CacheHitOptions>): string {
  const parts: string[] = [config.keyPrefix, req.method, req.baseUrl || '', req.path];

  const queryKeys = Object.keys(req.query).sort();
  if (queryKeys.length > 0) {
    const queryStr = queryKeys.map((k) => `${k}=${encodeURIComponent(String(req.query[k]))}`).join('&');
    parts.push(queryStr);
  }

  if (config.includeAuth && req.headers.authorization) {
    const token = req.headers.authorization.replace('Bearer ', '').slice(0, 32);
    parts.push(`auth:${token}`);
  }

  return parts.join(':').replace(/:/g, ':');
}

function filterHeaders(headers: Record<string, string>): Record<string, string> {
  const filtered: Record<string, string> = {};
  const skipHeaders = [
    'set-cookie',
    'x-cache-hit',
    'x-cache-key',
    'x-cache-age',
    'content-length',
    'etag',
    'date',
  ];

  for (const [key, value] of Object.entries(headers)) {
    if (!skipHeaders.includes(key.toLowerCase())) {
      filtered[key] = value;
    }
  }

  return filtered;
}

type CaptureCallback = (status: number, headers: Record<string, string>, body: string, contentType: string) => void;

function captureResponse(res: Response, callback: CaptureCallback): void {
  const originalEnd = res.end.bind(res);
  const originalJson = res.json.bind(res);

  const chunks: Buffer[] = [];
  let capturedStatus = res.statusCode;
  let capturedHeaders: Record<string, string> = {};
  let contentType = '';
  let captured = false;

  const doCallback = () => {
    if (captured) return;
    captured = true;

    const body = Buffer.concat(chunks).toString('utf8');
    contentType = (capturedHeaders['content-type'] as string) || res.getHeader('content-type') as string || '';

    try {
      const headers: Record<string, string> = {};
      const resHeaders = res.getHeaders();
      for (const [k, v] of Object.entries(resHeaders)) {
        headers[k] = String(v);
      }
      capturedHeaders = { ...capturedHeaders, ...headers };

      callback(capturedStatus, capturedHeaders, body, contentType);
    } catch (err) {
      console.warn('Cache callback error:', err);
    }
  };

  res.status = function (code: number) {
    capturedStatus = code;
    return res;
  } as typeof res.status;

  res.setHeader = function (name: string, value: string | number | string[]) {
    capturedHeaders[name.toLowerCase()] = String(value);
    return res;
  } as typeof res.setHeader;

  res.write = function (chunk: unknown, encoding?: unknown, cb?: unknown) {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), encoding as BufferEncoding));
    }
    if (typeof cb === 'function') cb();
    else if (typeof encoding === 'function') encoding();
    return true;
  } as typeof res.write;

  res.end = function (chunk?: unknown, encoding?: unknown, cb?: unknown) {
    if (chunk && typeof chunk !== 'function') {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), encoding as BufferEncoding));
    }
    doCallback();
    return originalEnd(chunk as any, encoding as any, cb as any);
  } as typeof res.end;

  res.json = function (body: unknown) {
    const jsonStr = JSON.stringify(body);
    chunks.push(Buffer.from(jsonStr, 'utf8'));
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    doCallback();
    return originalJson(body as any);
  } as typeof res.json;

  res.on('finish', doCallback);
  res.on('close', doCallback);
}

export async function invalidateCacheByPrefix(prefix: string): Promise<number> {
  const keys = await redis.keys(`${prefix}*`);
  if (keys.length === 0) return 0;
  const result = await redis.del(...keys);
  return result;
}

export async function invalidateCacheByPath(path: string, method: string = 'GET', prefix: string = 'apicache'): Promise<number> {
  const pattern = `${prefix}:${method}:*:${path}*`;
  const keys = await redis.keys(pattern);
  if (keys.length === 0) return 0;
  const result = await redis.del(...keys);
  return result;
}

export async function getCacheInfo(prefix: string = 'apicache'): Promise<{ count: number; keys: Array<{ key: string; ttl: number }> }> {
  const keys = await redis.keys(`${prefix}*`);
  const keyInfo = await Promise.all(
    keys.map(async (key) => ({
      key,
      ttl: await redis.ttl(key),
    }))
  );
  return { count: keys.length, keys: keyInfo };
}
