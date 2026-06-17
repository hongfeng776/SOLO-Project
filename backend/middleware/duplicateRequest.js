const { ValidationError } = require('../utils/error');

const requestCache = new Map();
const CACHE_DURATION = 5000;

const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, timestamp] of requestCache.entries()) {
    if (now - timestamp > CACHE_DURATION) {
      requestCache.delete(key);
    }
  }
};

const preventDuplicateTrace = (req, res, next) => {
  try {
    const { keyword } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return next();
    }

    cleanExpiredCache();

    const cacheKey = `${userId}_${keyword}_trace`;
    const now = Date.now();

    if (requestCache.has(cacheKey)) {
      const timestamp = requestCache.get(cacheKey);
      if (now - timestamp < CACHE_DURATION) {
        throw new ValidationError('请求过于频繁，请5秒后再试');
      }
    }

    requestCache.set(cacheKey, now);

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  preventDuplicateTrace
};
