import type { Request, Response, NextFunction } from 'express'
import redis from '@config/redis'

export const cacheMiddleware = (expire = 60) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method !== 'GET') {
      next()
      return
    }

    const key = `cache:${req.originalUrl}`

    try {
      const cached = await redis.get(key)
      if (cached) {
        res.json(JSON.parse(cached))
        return
      }

      const originalJson = res.json.bind(res)
      res.json = (body: unknown) => {
        if (body && typeof body === 'object' && (body as Record<string, unknown>).code === 200) {
          redis.set(key, JSON.stringify(body), 'EX', expire).catch(() => {})
        }
        return originalJson(body)
      }

      next()
    } catch (error) {
      next()
    }
  }
}

export const clearCacheMiddleware = (prefix: string) => {
  return async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const keys = await redis.keys(`cache:${prefix}*`)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('[Cache] 清除缓存失败:', error)
    }
    next()
  }
}
