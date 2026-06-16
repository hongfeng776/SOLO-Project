const { setCache, getCache, deleteCache, getRedisClient } = require('../config/redis');

const CACHE_KEYS = {
  HOT_CONTENTS: (category) => `content:hot:${category}`,
  CONTENT_DETAIL: (id) => `content:detail:${id}`,
  CONTENT_LIST: (hash) => `content:list:${hash}`,
  DASHBOARD_STATS: 'dashboard:stats',
  ACTIVITY_DETAIL: (id) => `activity:detail:${id}`,
  ACTIVITY_LIST: (hash) => `activity:list:${hash}`,
  ADVERTISEMENT_LIST: (position) => `advertisement:list:${position}`,
  COPYRIGHT_EXPIRING: 'copyright:expiring',
  COMMENT_RATE: (identifier) => `comment:rate:${identifier}`,
  USER_ACTION: (userId, action) => `user:action:${userId}:${action}`,
};

const CACHE_TTL = {
  HOT_CONTENTS: 600,
  CONTENT_DETAIL: 1800,
  CONTENT_LIST: 300,
  DASHBOARD_STATS: 1800,
  ACTIVITY_DETAIL: 1800,
  ACTIVITY_LIST: 300,
  ADVERTISEMENT_LIST: 300,
  COPYRIGHT_EXPIRING: 3600,
  COMMENT_RATE_USER: 300,
  COMMENT_RATE_IP: 3600,
  USER_ACTION: 60,
};

class CacheService {
  async get(key) {
    try {
      return await getCache(key);
    } catch {
      return null;
    }
  }

  async set(key, value, ttl) {
    try {
      await setCache(key, value, ttl);
    } catch {
      // cache write failure should not block business
    }
  }

  async del(key) {
    try {
      await deleteCache(key);
    } catch {
      // cache delete failure should not block business
    }
  }

  async delByPattern(pattern) {
    try {
      const client = getRedisClient();
      let cursor = 0;
      do {
        const reply = await client.scan(cursor, { MATCH: pattern, COUNT: 100 });
        cursor = reply.cursor;
        const keys = reply.keys;
        if (keys.length > 0) {
          await client.del(keys);
        }
      } while (cursor !== 0);
    } catch {
      // cache delete failure should not block business
    }
  }

  async getHotContents(category) {
    return this.get(CACHE_KEYS.HOT_CONTENTS(category));
  }

  async setHotContents(category, data) {
    await this.set(CACHE_KEYS.HOT_CONTENTS(category), data, CACHE_TTL.HOT_CONTENTS);
  }

  async getContentDetail(id) {
    return this.get(CACHE_KEYS.CONTENT_DETAIL(id));
  }

  async setContentDetail(id, data) {
    await this.set(CACHE_KEYS.CONTENT_DETAIL(id), data, CACHE_TTL.CONTENT_DETAIL);
  }

  async getDashboardStats() {
    return this.get(CACHE_KEYS.DASHBOARD_STATS);
  }

  async setDashboardStats(data) {
    await this.set(CACHE_KEYS.DASHBOARD_STATS, data, CACHE_TTL.DASHBOARD_STATS);
  }

  async getActivityDetail(id) {
    return this.get(CACHE_KEYS.ACTIVITY_DETAIL(id));
  }

  async setActivityDetail(id, data) {
    await this.set(CACHE_KEYS.ACTIVITY_DETAIL(id), data, CACHE_TTL.ACTIVITY_DETAIL);
  }

  async invalidateContent(id) {
    await Promise.all([
      this.del(CACHE_KEYS.CONTENT_DETAIL(id)),
      this.delByPattern('content:hot:*'),
      this.delByPattern('content:list:*'),
      this.del(CACHE_KEYS.DASHBOARD_STATS),
    ]);
  }

  async invalidateActivity(id) {
    await Promise.all([
      this.del(CACHE_KEYS.ACTIVITY_DETAIL(id)),
      this.delByPattern('activity:list:*'),
      this.del(CACHE_KEYS.DASHBOARD_STATS),
    ]);
  }

  async invalidateAdvertisement() {
    await Promise.all([
      this.delByPattern('advertisement:list:*'),
      this.del(CACHE_KEYS.DASHBOARD_STATS),
    ]);
  }

  async invalidateCopyright() {
    await Promise.all([
      this.del(CACHE_KEYS.COPYRIGHT_EXPIRING),
      this.del(CACHE_KEYS.DASHBOARD_STATS),
    ]);
  }

  async invalidateDashboard() {
    await this.del(CACHE_KEYS.DASHBOARD_STATS);
  }

  async checkCommentRate(userId, ip) {
    const userKey = CACHE_KEYS.COMMENT_RATE(userId);
    const ipKey = CACHE_KEYS.COMMENT_RATE(ip);

    const [userCount, ipCount] = await Promise.all([
      this.get(userKey),
      this.get(ipKey),
    ]);

    const userCurrent = userCount || 0;
    const ipCurrent = ipCount || 0;

    const userLimit = 3;
    const ipLimit = 10;

    const userAllowed = userCurrent < userLimit;
    const ipAllowed = ipCurrent < ipLimit;
    const allowed = userAllowed && ipAllowed;

    if (allowed) {
      await Promise.all([
        this.set(userKey, userCurrent + 1, CACHE_TTL.COMMENT_RATE_USER),
        this.set(ipKey, ipCurrent + 1, CACHE_TTL.COMMENT_RATE_IP),
      ]);
    }

    return {
      allowed,
      remaining: allowed
        ? { user: userLimit - userCurrent - 1, ip: ipLimit - ipCurrent - 1 }
        : { user: 0, ip: 0 },
    };
  }

  async checkActionRate(userId, action, limit, window) {
    const key = CACHE_KEYS.USER_ACTION(userId, action);
    const current = (await this.get(key)) || 0;

    if (current >= limit) {
      return { allowed: false, remaining: 0 };
    }

    await this.set(key, current + 1, window || CACHE_TTL.USER_ACTION);

    return { allowed: true, remaining: limit - current - 1 };
  }
}

module.exports = new CacheService();
