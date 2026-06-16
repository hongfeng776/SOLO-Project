import redis from '@config/redis'
import { CachePrefix, CacheTTL } from '@/enums/cache'

const DEFAULT_EXPIRE = CacheTTL.DEFAULT

export const getCache = async <T = unknown>(key: string): Promise<T | null> => {
  try {
    const data = await redis.get(key)
    if (!data) return null
    return JSON.parse(data) as T
  } catch (error) {
    console.error('[Cache] 获取缓存失败:', error)
    return null
  }
}

export const setCache = async (key: string, value: unknown, expire = DEFAULT_EXPIRE): Promise<void> => {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', expire)
  } catch (error) {
    console.error('[Cache] 设置缓存失败:', error)
  }
}

export const delCache = async (key: string): Promise<void> => {
  try {
    await redis.del(key)
  } catch (error) {
    console.error('[Cache] 删除缓存失败:', error)
  }
}

export const delCacheByPrefix = async (prefix: string): Promise<void> => {
  try {
    const keys = await redis.keys(`${prefix}*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('[Cache] 批量删除缓存失败:', error)
  }
}

export const getOrSetCache = async <T = unknown>(
  key: string,
  fn: () => Promise<T>,
  expire = DEFAULT_EXPIRE
): Promise<T> => {
  const cached = await getCache<T>(key)
  if (cached !== null) return cached

  const data = await fn()
  await setCache(key, data, expire)
  return data
}

export const getHot = async <T = unknown>(key: string): Promise<T | null> => {
  try {
    const data = await redis.get(`${CachePrefix.HOT_CONTENT}${key}`)
    if (!data) return null
    return JSON.parse(data) as T
  } catch (error) {
    console.error('[Cache] 获取热点数据失败:', error)
    return null
  }
}

export const setHot = async (key: string, value: unknown, ttl = CacheTTL.HOT_DATA): Promise<void> => {
  try {
    await redis.set(`${CachePrefix.HOT_CONTENT}${key}`, JSON.stringify(value), 'EX', ttl)
  } catch (error) {
    console.error('[Cache] 设置热点数据失败:', error)
  }
}

export const deleteHot = async (key: string): Promise<void> => {
  try {
    await redis.del(`${CachePrefix.HOT_CONTENT}${key}`)
  } catch (error) {
    console.error('[Cache] 删除热点数据失败:', error)
  }
}

export const getWithFallback = async <T = unknown>(
  key: string,
  fallbackFn: () => Promise<T>,
  ttl = DEFAULT_EXPIRE
): Promise<T> => {
  const cached = await getCache<T>(key)
  if (cached !== null) return cached

  const data = await fallbackFn()
  if (data !== null && data !== undefined) {
    await setCache(key, data, ttl)
  }
  return data
}

export const increment = async (key: string, delta = 1): Promise<number> => {
  try {
    const result = await redis.incrby(`${CachePrefix.COUNTER}${key}`, delta)
    return result
  } catch (error) {
    console.error('[Cache] 计数器递增失败:', error)
    return 0
  }
}

export const getCount = async (key: string): Promise<number> => {
  try {
    const result = await redis.get(`${CachePrefix.COUNTER}${key}`)
    return result ? parseInt(result, 10) : 0
  } catch (error) {
    console.error('[Cache] 获取计数器失败:', error)
    return 0
  }
}

export const zadd = async (key: string, score: number, member: string): Promise<void> => {
  try {
    await redis.zadd(`${CachePrefix.RANK}${key}`, score.toString(), member)
  } catch (error) {
    console.error('[Cache] 有序集合添加失败:', error)
  }
}

export const zrevrange = async (key: string, start: number, stop: number): Promise<string[]> => {
  try {
    const result = await redis.zrevrange(`${CachePrefix.RANK}${key}`, start, stop)
    return result
  } catch (error) {
    console.error('[Cache] 有序集合查询失败:', error)
    return []
  }
}

export const zincrby = async (key: string, increment: number, member: string): Promise<number> => {
  try {
    const result = await redis.zincrby(`${CachePrefix.RANK}${key}`, increment, member)
    return parseFloat(result)
  } catch (error) {
    console.error('[Cache] 有序集合分数递增失败:', error)
    return 0
  }
}
