const cache = new Map()
const cacheTimers = new Map()

const cacheMiddleware = (ttl = 60) => {
  return (req, res, next) => {
    if (req.method !== 'GET') return next()

    const key = req.originalUrl + JSON.stringify(req.query)

    const cached = cache.get(key)
    if (cached) {
      return res.json(cached)
    }

    const originalJson = res.json.bind(res)
    res.json = (data) => {
      cache.set(key, data)

      if (cacheTimers.has(key)) {
        clearTimeout(cacheTimers.get(key))
      }
      cacheTimers.set(key, setTimeout(() => {
        cache.delete(key)
        cacheTimers.delete(key)
      }, ttl * 1000))

      return originalJson(data)
    }

    next()
  }
}

const clearCache = (pattern) => {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
      if (cacheTimers.has(key)) {
        clearTimeout(cacheTimers.get(key))
        cacheTimers.delete(key)
      }
    }
  }
}

const clearAllCache = () => {
  for (const timer of cacheTimers.values()) {
    clearTimeout(timer)
  }
  cache.clear()
  cacheTimers.clear()
}

module.exports = {
  cacheMiddleware,
  clearCache,
  clearAllCache
}
