import { getRedisClient } from '@config/redis';

export class CacheUtil {
  static async get<T>(key: string): Promise<T | null> {
    const client = await getRedisClient();
    const value = await client.get(key);

    if (value === null) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  static async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const client = await getRedisClient();
    const serialized = JSON.stringify(value);

    if (ttlSeconds && ttlSeconds > 0) {
      await client.setEx(key, ttlSeconds, serialized);
    } else {
      await client.set(key, serialized);
    }
  }

  static async del(key: string): Promise<void> {
    const client = await getRedisClient();
    await client.del(key);
  }

  static async delByPattern(pattern: string): Promise<void> {
    const client = await getRedisClient();
    const keys = await client.keys(pattern);

    if (keys.length > 0) {
      await client.del(keys);
    }
  }

  static async deleteByPattern(pattern: string): Promise<void> {
    return CacheUtil.delByPattern(pattern);
  }

  static async flush(): Promise<void> {
    const client = await getRedisClient();
    await client.flushDb();
  }

  static async exists(key: string): Promise<boolean> {
    const client = await getRedisClient();
    const result = await client.exists(key);
    return result === 1;
  }

  static async ttl(key: string): Promise<number> {
    const client = await getRedisClient();
    return client.ttl(key);
  }

  static async getOrSet<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
    const cached = await CacheUtil.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fn();
    await CacheUtil.set(key, value, ttlSeconds);
    return value;
  }

  static async increment(key: string, delta: number = 1, ttlSeconds?: number): Promise<number> {
    const client = await getRedisClient();
    const value = await client.incrBy(key, delta);

    if (ttlSeconds && ttlSeconds > 0 && value === delta) {
      await client.expire(key, ttlSeconds);
    }

    return value;
  }
}
