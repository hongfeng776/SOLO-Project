const DEFAULT_TTL = 5 * 60 * 1000;

class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  set(key, value, ttl = DEFAULT_TTL) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }
    this.cache.set(key, {
      value,
      expireTime: Date.now() + ttl
    });
    if (ttl > 0) {
      this.timers.set(key, setTimeout(() => {
        this.cache.delete(key);
        this.timers.delete(key);
      }, ttl));
    }
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (item.expireTime && Date.now() > item.expireTime) {
      this.delete(key);
      return null;
    }
    return item.value;
  }

  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    return this.cache.delete(key);
  }

  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.cache.clear();
  }

  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    if (item.expireTime && Date.now() > item.expireTime) {
      this.delete(key);
      return false;
    }
    return true;
  }

  getSize() {
    return this.cache.size;
  }
}

const memoryCache = new MemoryCache();

module.exports = memoryCache;
