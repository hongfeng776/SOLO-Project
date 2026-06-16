import redis from '../config/redis';
import { daos } from '../dao';
import { Op, fn, col, literal } from 'sequelize';
import { Goods } from '../models/Goods';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { Marketing } from '../models/Marketing';
import { Merchant } from '../models/Merchant';

const CACHE_KEYS = {
  HOT_GOODS: 'hotcache:goods:hot',
  ACTIVE_ORDERS: 'hotcache:orders:active',
  CORE_USERS: 'hotcache:users:core',
  ACTIVE_MARKETINGS: 'hotcache:marketings:active',
  MERCHANTS: 'hotcache:merchants:all',
  WARMUP_LOCK: 'hotcache:warmup:lock',
} as const;

const TTL = {
  HOT_GOODS: 300,
  ACTIVE_ORDERS: 1800,
  CORE_USERS: 3600,
  ACTIVE_MARKETINGS: 600,
  MERCHANTS: 3600,
  WARMUP_LOCK: 60,
} as const;

export interface HotGoodsOptions {
  topN?: number;
  sortBy?: 'sales' | 'views';
}

export interface CoreUsersOptions {
  topN?: number;
  minSpend?: number;
}

export interface CoreUser {
  id: number;
  username: string;
  phone?: string;
  email?: string;
  avatar?: string;
  status?: number;
  created_at?: Date;
  updated_at?: Date;
  totalSpend: number;
  orderCount: number;
}

export interface InvalidateOptions {
  type?: 'goods' | 'orders' | 'users' | 'marketings' | 'merchants' | 'all';
  id?: number | string;
}

class HotCacheService {
  private readonly goodsDao = daos.goodsDao;
  private readonly orderDao = daos.orderDao;
  private readonly marketingDao = daos.marketingDao;
  private readonly merchantDao = daos.merchantDao;

  async getHotGoods(options: HotGoodsOptions = {}): Promise<Goods[]> {
    const { topN = 20, sortBy = 'sales' } = options;
    const cacheKey = `${CACHE_KEYS.HOT_GOODS}:${sortBy}:${topN}`;

    const cached = await this.getFromCache<Goods[]>(cacheKey);
    if (cached) return cached;

    const orderField = sortBy === 'views' ? 'views' : 'sales';
    const goods = await this.goodsDao.findAll({
      where: { status: 1 },
      order: [[orderField, 'DESC']],
      limit: topN,
    });

    await this.setWithAtomic(cacheKey, goods, TTL.HOT_GOODS);
    return goods;
  }

  async getActiveOrders(hours: number = 24): Promise<Order[]> {
    const cacheKey = `${CACHE_KEYS.ACTIVE_ORDERS}:${hours}`;

    const cached = await this.getFromCache<Order[]>(cacheKey);
    if (cached) return cached;

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const orders = await this.orderDao.findAll({
      where: {
        updated_at: { [Op.gte]: since },
      },
      order: [['updated_at', 'DESC']],
    });

    await this.setWithAtomic(cacheKey, orders, TTL.ACTIVE_ORDERS);
    return orders;
  }

  async getCoreUsers(options: CoreUsersOptions = {}): Promise<CoreUser[]> {
    const { topN = 100, minSpend = 1000 } = options;
    const cacheKey = `${CACHE_KEYS.CORE_USERS}:${topN}:${minSpend}`;

    const cached = await this.getFromCache<CoreUser[]>(cacheKey);
    if (cached) return cached;

    const results = await Order.findAll({
      attributes: [
        'user_id',
        [fn('SUM', col('pay_amount')), 'totalSpend'],
        [fn('COUNT', col('id')), 'orderCount'],
      ],
      where: { status: { [Op.in]: [2, 3] } },
      group: ['user_id'],
      having: literal(`SUM(pay_amount) >= ${minSpend}`),
      order: [[literal('SUM(pay_amount)'), 'DESC']],
      limit: topN,
      raw: true,
    }) as unknown as Array<{ user_id: number; totalSpend: number; orderCount: number }>;

    const userIds = results.map((r) => r.user_id);
    const users = userIds.length > 0 ? await User.findAll({ where: { id: userIds } }) : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const coreUsers: CoreUser[] = results.map((r) => {
      const user = userMap.get(r.user_id);
      return {
        id: r.user_id,
        username: user?.username || '',
        phone: user?.phone,
        email: user?.email,
        avatar: user?.avatar,
        status: user?.status,
        created_at: user?.created_at,
        updated_at: user?.updated_at,
        totalSpend: Number(r.totalSpend),
        orderCount: Number(r.orderCount),
      };
    });

    await this.setWithAtomic(cacheKey, coreUsers, TTL.CORE_USERS);
    return coreUsers;
  }

  async getActiveMarketings(): Promise<Marketing[]> {
    const cacheKey = CACHE_KEYS.ACTIVE_MARKETINGS;

    const cached = await this.getFromCache<Marketing[]>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const marketings = await this.marketingDao.findAll({
      where: {
        status: 1,
        start_time: { [Op.lte]: now },
        end_time: { [Op.gte]: now },
      },
      order: [['start_time', 'ASC']],
    });

    await this.setWithAtomic(cacheKey, marketings, TTL.ACTIVE_MARKETINGS);
    return marketings;
  }

  async getMerchants(status?: number): Promise<Merchant[]> {
    const cacheKey = status !== undefined ? `${CACHE_KEYS.MERCHANTS}:${status}` : CACHE_KEYS.MERCHANTS;

    const cached = await this.getFromCache<Merchant[]>(cacheKey);
    if (cached) return cached;

    const where: Record<string, unknown> = {};
    if (status !== undefined) where.status = status;

    const merchants = await this.merchantDao.findAll({
      where,
      order: [['created_at', 'DESC']],
    });

    await this.setWithAtomic(cacheKey, merchants, TTL.MERCHANTS);
    return merchants;
  }

  async getMerchantById(id: number): Promise<Merchant | null> {
    const cacheKey = `${CACHE_KEYS.MERCHANTS}:id:${id}`;

    const cached = await this.getFromCache<Merchant>(cacheKey);
    if (cached) return cached;

    const merchant = await this.merchantDao.findById(id);
    if (merchant) {
      await this.setWithAtomic(cacheKey, merchant, TTL.MERCHANTS);
    }
    return merchant;
  }

  async warmupCache(): Promise<{ success: boolean; message: string; details: Record<string, number> }> {
    const lockAcquired = await redis.set(CACHE_KEYS.WARMUP_LOCK, '1', 'EX', TTL.WARMUP_LOCK, 'NX');
    if (!lockAcquired) {
      return { success: false, message: '缓存预热已在进行中', details: {} };
    }

    const details: Record<string, number> = {};

    try {
      const pipeline = redis.pipeline();

      const [hotGoods, activeOrders, coreUsers, activeMarketings, merchants] = await Promise.all([
        this.loadHotGoodsToPipeline(pipeline),
        this.loadActiveOrdersToPipeline(pipeline),
        this.loadCoreUsersToPipeline(pipeline),
        this.loadActiveMarketingsToPipeline(pipeline),
        this.loadMerchantsToPipeline(pipeline),
      ]);

      await pipeline.exec();

      details.hotGoods = hotGoods;
      details.activeOrders = activeOrders;
      details.coreUsers = coreUsers;
      details.activeMarketings = activeMarketings;
      details.merchants = merchants;

      return { success: true, message: '缓存预热完成', details };
    } finally {
      await redis.del(CACHE_KEYS.WARMUP_LOCK);
    }
  }

  async invalidateCache(options: InvalidateOptions = {}): Promise<{ deleted: number }> {
    const { type = 'all', id } = options;
    const patterns: string[] = [];

    if (type === 'goods' || type === 'all') patterns.push(`${CACHE_KEYS.HOT_GOODS}*`);
    if (type === 'orders' || type === 'all') patterns.push(`${CACHE_KEYS.ACTIVE_ORDERS}*`);
    if (type === 'users' || type === 'all') patterns.push(`${CACHE_KEYS.CORE_USERS}*`);
    if (type === 'marketings' || type === 'all') patterns.push(`${CACHE_KEYS.ACTIVE_MARKETINGS}*`);
    if (type === 'merchants' || type === 'all') {
      patterns.push(`${CACHE_KEYS.MERCHANTS}*`);
    }

    let deleted = 0;
    const pipeline = redis.pipeline();

    for (const pattern of patterns) {
      if (id && (type === 'merchants' || type === 'all')) {
        pipeline.del(`${CACHE_KEYS.MERCHANTS}:id:${id}`);
      }
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        pipeline.del(...keys);
        deleted += keys.length;
      }
    }

    await pipeline.exec();
    return { deleted };
  }

  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  private async setWithAtomic(key: string, value: unknown, ttl: number): Promise<void> {
    const strValue = JSON.stringify(value);
    await redis.set(key, strValue, 'EX', ttl);
  }

  private async loadHotGoodsToPipeline(pipeline: ReturnType<typeof redis.pipeline>): Promise<number> {
    for (const sortBy of ['sales', 'views'] as const) {
      for (const topN of [10, 20, 50]) {
        const orderField = sortBy === 'views' ? 'views' : 'sales';
        const goods = await this.goodsDao.findAll({
          where: { status: 1 },
          order: [[orderField, 'DESC']],
          limit: topN,
        });
        const cacheKey = `${CACHE_KEYS.HOT_GOODS}:${sortBy}:${topN}`;
        pipeline.set(cacheKey, JSON.stringify(goods), 'EX', TTL.HOT_GOODS);
      }
    }
    return 6;
  }

  private async loadActiveOrdersToPipeline(pipeline: ReturnType<typeof redis.pipeline>): Promise<number> {
    for (const hours of [1, 6, 12, 24]) {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      const orders = await this.orderDao.findAll({
        where: { updated_at: { [Op.gte]: since } },
        order: [['updated_at', 'DESC']],
      });
      const cacheKey = `${CACHE_KEYS.ACTIVE_ORDERS}:${hours}`;
      pipeline.set(cacheKey, JSON.stringify(orders), 'EX', TTL.ACTIVE_ORDERS);
    }
    return 4;
  }

  private async loadCoreUsersToPipeline(pipeline: ReturnType<typeof redis.pipeline>): Promise<number> {
    const configs: Array<{ topN: number; minSpend: number }> = [
      { topN: 50, minSpend: 500 },
      { topN: 100, minSpend: 1000 },
      { topN: 200, minSpend: 500 },
    ];

    for (const { topN, minSpend } of configs) {
      const results = await Order.findAll({
        attributes: [
          'user_id',
          [fn('SUM', col('pay_amount')), 'totalSpend'],
          [fn('COUNT', col('id')), 'orderCount'],
        ],
        where: { status: { [Op.in]: [2, 3] } },
        group: ['user_id'],
        having: literal(`SUM(pay_amount) >= ${minSpend}`),
        order: [[literal('SUM(pay_amount)'), 'DESC']],
        limit: topN,
        raw: true,
      }) as unknown as Array<{ user_id: number; totalSpend: number; orderCount: number }>;

      const userIds = results.map((r) => r.user_id);
      const users = userIds.length > 0 ? await User.findAll({ where: { id: userIds } }) : [];
      const userMap = new Map(users.map((u) => [u.id, u]));

      const coreUsers: CoreUser[] = results.map((r) => {
        const user = userMap.get(r.user_id);
        return {
          id: r.user_id,
          username: user?.username || '',
          phone: user?.phone,
          email: user?.email,
          avatar: user?.avatar,
          status: user?.status,
          created_at: user?.created_at,
          updated_at: user?.updated_at,
          totalSpend: Number(r.totalSpend),
          orderCount: Number(r.orderCount),
        };
      });

      const cacheKey = `${CACHE_KEYS.CORE_USERS}:${topN}:${minSpend}`;
      pipeline.set(cacheKey, JSON.stringify(coreUsers), 'EX', TTL.CORE_USERS);
    }
    return 3;
  }

  private async loadActiveMarketingsToPipeline(pipeline: ReturnType<typeof redis.pipeline>): Promise<number> {
    const now = new Date();
    const marketings = await this.marketingDao.findAll({
      where: {
        status: 1,
        start_time: { [Op.lte]: now },
        end_time: { [Op.gte]: now },
      },
      order: [['start_time', 'ASC']],
    });
    pipeline.set(CACHE_KEYS.ACTIVE_MARKETINGS, JSON.stringify(marketings), 'EX', TTL.ACTIVE_MARKETINGS);
    return 1;
  }

  private async loadMerchantsToPipeline(pipeline: ReturnType<typeof redis.pipeline>): Promise<number> {
    const allMerchants = await this.merchantDao.findAll({ order: [['created_at', 'DESC']] });
    pipeline.set(CACHE_KEYS.MERCHANTS, JSON.stringify(allMerchants), 'EX', TTL.MERCHANTS);

    const activeMerchants = allMerchants.filter((m) => m.status === 1);
    pipeline.set(`${CACHE_KEYS.MERCHANTS}:1`, JSON.stringify(activeMerchants), 'EX', TTL.MERCHANTS);

    const inactiveMerchants = allMerchants.filter((m) => m.status === 0);
    pipeline.set(`${CACHE_KEYS.MERCHANTS}:0`, JSON.stringify(inactiveMerchants), 'EX', TTL.MERCHANTS);

    for (const merchant of allMerchants) {
      pipeline.set(`${CACHE_KEYS.MERCHANTS}:id:${merchant.id}`, JSON.stringify(merchant), 'EX', TTL.MERCHANTS);
    }

    return 3 + allMerchants.length;
  }

  async batchRefresh(keys: Array<{ key: string; loader: () => Promise<unknown>; ttl: number }>): Promise<void> {
    const values = await Promise.all(keys.map((k) => k.loader()));
    const pipeline = redis.pipeline();

    keys.forEach((k, i) => {
      pipeline.set(k.key, JSON.stringify(values[i]), 'EX', k.ttl);
    });

    await pipeline.exec();
  }

  async getCacheStats(): Promise<Record<string, unknown>> {
    const patterns = [
      CACHE_KEYS.HOT_GOODS,
      CACHE_KEYS.ACTIVE_ORDERS,
      CACHE_KEYS.CORE_USERS,
      CACHE_KEYS.ACTIVE_MARKETINGS,
      CACHE_KEYS.MERCHANTS,
    ];

    const stats: Record<string, unknown> = {};

    for (const pattern of patterns) {
      const keys = await redis.keys(`${pattern}*`);
      const keyInfo = await Promise.all(
        keys.map(async (key) => ({
          key,
          ttl: await redis.ttl(key),
          size: (await redis.strlen(key)) || 0,
        }))
      );
      stats[pattern] = {
        count: keys.length,
        totalSize: keyInfo.reduce((sum, k) => sum + k.size, 0),
        keys: keyInfo,
      };
    }

    return stats;
  }
}

export const hotCacheService = new HotCacheService();
export default HotCacheService;
