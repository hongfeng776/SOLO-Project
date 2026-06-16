import redis from '../config/redis';

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function setCache(
  key: string,
  value: unknown,
  expireSeconds?: number
): Promise<void> {
  const strValue = JSON.stringify(value);
  if (expireSeconds) {
    await redis.setex(key, expireSeconds, strValue);
  } else {
    await redis.set(key, strValue);
  }
}

export async function delCache(key: string): Promise<void> {
  await redis.del(key);
}

export async function delCacheByPattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export async function existsCache(key: string): Promise<boolean> {
  const result = await redis.exists(key);
  return result > 0;
}

export async function expireCache(
  key: string,
  expireSeconds: number
): Promise<void> {
  await redis.expire(key, expireSeconds);
}

export async function ttlCache(key: string): Promise<number> {
  return redis.ttl(key);
}

export async function incrCache(key: string, amount: number = 1): Promise<number> {
  return redis.incrby(key, amount);
}

export async function decrCache(key: string, amount: number = 1): Promise<number> {
  return redis.decrby(key, amount);
}

export async function hGetCache<T>(key: string, field: string): Promise<T | null> {
  try {
    const value = await redis.hget(key, field);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function hSetCache(
  key: string,
  field: string,
  value: unknown
): Promise<void> {
  const strValue = JSON.stringify(value);
  await redis.hset(key, field, strValue);
}

export async function hDelCache(key: string, ...fields: string[]): Promise<void> {
  await redis.hdel(key, ...fields);
}

export async function hGetAllCache<T>(key: string): Promise<Record<string, T> | null> {
  try {
    const values = await redis.hgetall(key);
    if (Object.keys(values).length === 0) return null;
    const result: Record<string, T> = {};
    for (const [field, value] of Object.entries(values)) {
      result[field] = JSON.parse(value) as T;
    }
    return result;
  } catch {
    return null;
  }
}

export async function hExistsCache(key: string, field: string): Promise<boolean> {
  const result = await redis.hexists(key, field);
  return result > 0;
}

export async function hLenCache(key: string): Promise<number> {
  return redis.hlen(key);
}
