import redis from '@config/redis'

const DEFAULT_EXPIRE = 3600

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
