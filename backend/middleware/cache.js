const memoryCache = require('../utils/cache');

const cache = (ttl) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `api:${req.originalUrl}`;

    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (data && data.code === 200) {
        memoryCache.set(cacheKey, data, ttl);
      }
      return originalJson(data);
    };

    next();
  };
};

const invalidateCache = (prefix) => {
  const keysToInvalidate = [];
  for (const key of memoryCache.cache.keys()) {
    if (!prefix || key.startsWith(prefix)) {
      keysToInvalidate.push(key);
    }
  }
  keysToInvalidate.forEach(key => memoryCache.delete(key));
};

module.exports = { cache, invalidateCache };
