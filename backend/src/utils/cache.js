class CacheManager {
  constructor(maxSize = 100, defaultTTL = 300000) {
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
    this.cache = new Map()
  }

  set(key, value, ttl = this.defaultTTL) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      value,
      expireAt: Date.now() + ttl
    })
  }

  get(key) {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expireAt) {
      this.cache.delete(key)
      return null
    }

    this.cache.delete(key)
    this.cache.set(key, entry)

    return entry.value
  }

  delete(key) {
    return this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  has(key) {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (Date.now() > entry.expireAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  cleanup() {
    for (const [key, entry] of this.cache) {
      if (Date.now() > entry.expireAt) {
        this.cache.delete(key)
      }
    }
  }

  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    if (this.has(key)) {
      return this.get(key)
    }

    const value = await fetchFn()
    this.set(key, value, ttl)
    return value
  }

  deleteByPrefix(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
      }
    }
  }
}

module.exports = new CacheManager()
