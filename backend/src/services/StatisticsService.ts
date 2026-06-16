import { Op, fn, col, literal } from 'sequelize';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { Goods } from '../models/Goods';
import { User } from '../models/User';
import { Marketing } from '../models/Marketing';
import { MarketingUser } from '../models/MarketingUser';
import { AfterSale } from '../models/AfterSale';
import { Merchant } from '../models/Merchant';
import { getCache, setCache } from '../utils/cache';

export type TimeRange = 'day' | 'week' | 'month';

export interface SalesStats {
  gmv: number;
  orderCount: number;
  avgOrderValue: number;
  comparedPrev: {
    gmv: number;
    orderCount: number;
    avgOrderValue: number;
  };
}

export interface GoodsStats {
  hotList: Array<{
    id: number;
    name: string;
    sales: number;
    revenue: number;
  }>;
  categoryDistribution: Array<{
    category_id: number | null;
    count: number;
    percentage: number;
  }>;
  onShelfCount: number;
  offShelfCount: number;
}

export interface UserStats {
  newUsers: number;
  activeUsers: number;
  retentionRate: number;
  levelDistribution: Array<{
    level: number;
    count: number;
    percentage: number;
  }>;
}

export interface OrderStats {
  statusDistribution: Array<{
    status: number;
    count: number;
    percentage: number;
  }>;
  avgFulfillmentHours: number;
  refundRate: number;
}

export interface MarketingStats {
  roi: number;
  couponRedeemRate: number;
  newUserFromCampaign: number;
}

export interface AfterSaleStats {
  applicationCount: number;
  avgProcessingHours: number;
  disputeRate: number;
}

export interface MerchantStats {
  totalCount: number;
  activeCount: number;
  ratingDistribution: Array<{
    rating: number;
    count: number;
    percentage: number;
  }>;
}

export interface DashboardData {
  sales: SalesStats;
  goods: GoodsStats;
  users: UserStats;
  orders: OrderStats;
  marketing: MarketingStats;
  afterSale: AfterSaleStats;
  merchants: MerchantStats;
  timestamp: number;
}

const CACHE_TTL = 300;

class StatisticsService {

  async getSalesStats(range: TimeRange = 'day'): Promise<SalesStats> {
    const cacheKey = `stats:sales:${range}`;
    const cached = await getCache<SalesStats>(cacheKey);
    if (cached) return cached;

    const { start, end, prevStart, prevEnd } = this.getTimeRanges(range);

    const [currentData, prevData] = await Promise.all([
      this.calculateSalesRange(start, end),
      this.calculateSalesRange(prevStart, prevEnd),
    ]);

    const result: SalesStats = {
      gmv: currentData.gmv,
      orderCount: currentData.orderCount,
      avgOrderValue: currentData.orderCount > 0 ? currentData.gmv / currentData.orderCount : 0,
      comparedPrev: {
        gmv: this.calcPercentChange(prevData.gmv, currentData.gmv),
        orderCount: this.calcPercentChange(prevData.orderCount, currentData.orderCount),
        avgOrderValue: this.calcPercentChange(
          prevData.orderCount > 0 ? prevData.gmv / prevData.orderCount : 0,
          currentData.orderCount > 0 ? currentData.gmv / currentData.orderCount : 0
        ),
      },
    };

    await setCache(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getGoodsStats(topN: number = 10): Promise<GoodsStats> {
    const cacheKey = `stats:goods:${topN}`;
    const cached = await getCache<GoodsStats>(cacheKey);
    if (cached) return cached;

    const [hotListResult, allGoods, onShelfCount, offShelfCount] = await Promise.all([
      OrderItem.findAll({
        attributes: [
          'goods_id',
          'goods_name',
          [fn('SUM', col('quantity')), 'totalSales'],
          [fn('SUM', col('subtotal')), 'totalRevenue'],
        ],
        include: [
          {
            model: Order,
            attributes: [],
            where: { status: { [Op.in]: [2, 3] } },
          },
        ],
        group: ['goods_id', 'goods_name'],
        order: [[literal('SUM(quantity)'), 'DESC']],
        limit: topN,
        raw: true,
      }) as unknown as Array<{ goods_id: number; goods_name: string; totalSales: number; totalRevenue: number }>,
      Goods.findAll({ attributes: ['id', 'category_id'], raw: true }),
      Goods.count({ where: { status: 1 } }),
      Goods.count({ where: { status: 0 } }),
    ]);

    const hotList = hotListResult.map((item) => ({
      id: item.goods_id,
      name: item.goods_name,
      sales: Number(item.totalSales),
      revenue: Number(item.totalRevenue),
    }));

    const categoryMap = new Map<number | null, number>();
    for (const goods of allGoods) {
      const key = goods.category_id ?? null;
      categoryMap.set(key, (categoryMap.get(key) || 0) + 1);
    }

    const totalGoods = allGoods.length;
    const categoryDistribution = Array.from(categoryMap.entries()).map(([category_id, count]) => ({
      category_id,
      count,
      percentage: totalGoods > 0 ? (count / totalGoods) * 100 : 0,
    }));

    const result: GoodsStats = {
      hotList,
      categoryDistribution,
      onShelfCount,
      offShelfCount,
    };

    await setCache(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getUserStats(range: TimeRange = 'day'): Promise<UserStats> {
    const cacheKey = `stats:users:${range}`;
    const cached = await getCache<UserStats>(cacheKey);
    if (cached) return cached;

    const { start, end } = this.getTimeRanges(range);
    const retentionStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
    const retentionEnd = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [newUsers, activeUsers, weekOldUsers] = await Promise.all([
      User.count({ where: { created_at: { [Op.between]: [start, end] } } }),
      Order.count({
        where: { created_at: { [Op.between]: [start, end] } },
        distinct: true,
        col: 'user_id',
      }),
      User.findAll({
        attributes: ['id'],
        where: { created_at: { [Op.between]: [retentionStart, retentionEnd] } },
        raw: true,
      }) as unknown as Array<{ id: number }>,
    ]);

    const weekOldUserIds = weekOldUsers.map((u) => u.id);
    let actualRetainedCount = 0;
    if (weekOldUserIds.length > 0) {
      actualRetainedCount = await Order.count({
        where: {
          user_id: { [Op.in]: weekOldUserIds },
          created_at: { [Op.between]: [start, end] },
        },
        distinct: true,
        col: 'user_id',
      });
    }

    const retentionRate = weekOldUsers.length > 0 ? (actualRetainedCount / weekOldUsers.length) * 100 : 0;

    const allUsers = await User.findAll({ attributes: ['id', 'status'], raw: true });
    const levelMap = new Map<number, number>();
    for (const user of allUsers) {
      const level = user.status ?? 0;
      levelMap.set(level, (levelMap.get(level) || 0) + 1);
    }

    const levelDistribution = Array.from(levelMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([level, count]) => ({
        level,
        count,
        percentage: allUsers.length > 0 ? (count / allUsers.length) * 100 : 0,
      }));

    const result: UserStats = {
      newUsers,
      activeUsers,
      retentionRate,
      levelDistribution,
    };

    await setCache(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getOrderStats(range: TimeRange = 'day'): Promise<OrderStats> {
    const cacheKey = `stats:orders:${range}`;
    const cached = await getCache<OrderStats>(cacheKey);
    if (cached) return cached;

    const { start, end } = this.getTimeRanges(range);

    const orders = await Order.findAll({
      attributes: ['id', 'status', 'created_at', 'pay_time', 'updated_at'],
      where: { created_at: { [Op.between]: [start, end] } },
      raw: true,
    }) as unknown as Array<{ id: number; status: number; created_at: Date; pay_time?: Date; updated_at: Date }>;

    const statusMap = new Map<number, number>();
    for (const order of orders) {
      const status = order.status ?? 0;
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    }

    const totalOrders = orders.length;
    const statusDistribution = Array.from(statusMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([status, count]) => ({
        status,
        count,
        percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0,
      }));

    let totalFulfillmentHours = 0;
    let fulfilledCount = 0;
    for (const order of orders) {
      if (order.pay_time && (order.status === 2 || order.status === 3)) {
        const diff = new Date(order.updated_at).getTime() - new Date(order.pay_time).getTime();
        if (diff > 0) {
          totalFulfillmentHours += diff / (1000 * 60 * 60);
          fulfilledCount++;
        }
      }
    }
    const avgFulfillmentHours = fulfilledCount > 0 ? totalFulfillmentHours / fulfilledCount : 0;

    const refundedCount = statusMap.get(4) || 0;
    const refundRate = totalOrders > 0 ? (refundedCount / totalOrders) * 100 : 0;

    const result: OrderStats = {
      statusDistribution,
      avgFulfillmentHours,
      refundRate,
    };

    await setCache(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getMarketingStats(range: TimeRange = 'day'): Promise<MarketingStats> {
    const cacheKey = `stats:marketing:${range}`;
    const cached = await getCache<MarketingStats>(cacheKey);
    if (cached) return cached;

    const { start, end } = this.getTimeRanges(range);

    const [activeCampaigns, totalCoupons, redeemedCoupons] = await Promise.all([
      Marketing.findAll({
        where: {
          status: 1,
          start_time: { [Op.lte]: end },
          end_time: { [Op.gte]: start },
        },
        raw: true,
      }) as unknown as Array<{ id: number; discount: number }>,
      MarketingUser.count({ where: { created_at: { [Op.between]: [start, end] } } }),
      MarketingUser.count({
        where: {
          status: 1,
          used_time: { [Op.between]: [start, end] },
        },
      }),
    ]);

    let totalInvestment = 0;
    for (const campaign of activeCampaigns) {
      totalInvestment += Number(campaign.discount) || 0;
    }

    const campaignIds = activeCampaigns.map((c) => c.id);
    let campaignRevenue = 0;
    if (campaignIds.length > 0) {
      const revenueResult = await Order.findAll({
        attributes: [[fn('SUM', col('pay_amount')), 'total']],
        where: {
          status: { [Op.in]: [2, 3] },
          created_at: { [Op.between]: [start, end] },
        },
        raw: true,
      }) as unknown as Array<{ total: number | null }>;
      campaignRevenue = Number(revenueResult[0]?.total) || 0;
    }

    const roi = totalInvestment > 0 ? (campaignRevenue - totalInvestment) / totalInvestment : 0;
    const couponRedeemRate = totalCoupons > 0 ? (redeemedCoupons / totalCoupons) * 100 : 0;

    const newUserFromCampaign = await this.countNewUsersFromMarketing(start, end);

    const result: MarketingStats = {
      roi,
      couponRedeemRate,
      newUserFromCampaign,
    };

    await setCache(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getAfterSaleStats(range: TimeRange = 'day'): Promise<AfterSaleStats> {
    const cacheKey = `stats:aftersale:${range}`;
    const cached = await getCache<AfterSaleStats>(cacheKey);
    if (cached) return cached;

    const { start, end } = this.getTimeRanges(range);

    const afterSales = await AfterSale.findAll({
      attributes: ['id', 'status', 'created_at', 'updated_at'],
      where: { created_at: { [Op.between]: [start, end] } },
      raw: true,
    }) as unknown as Array<{ id: number; status: number; created_at: Date; updated_at: Date }>;

    const applicationCount = afterSales.length;

    let totalProcessingHours = 0;
    let processedCount = 0;
    let disputeCount = 0;

    for (const as of afterSales) {
      const status = as.status ?? 0;
      if (status === 2 || status === 3) {
        const diff = new Date(as.updated_at).getTime() - new Date(as.created_at).getTime();
        if (diff > 0) {
          totalProcessingHours += diff / (1000 * 60 * 60);
          processedCount++;
        }
      }
      if (status === 3) disputeCount++;
    }

    const avgProcessingHours = processedCount > 0 ? totalProcessingHours / processedCount : 0;
    const disputeRate = applicationCount > 0 ? (disputeCount / applicationCount) * 100 : 0;

    const result: AfterSaleStats = {
      applicationCount,
      avgProcessingHours,
      disputeRate,
    };

    await setCache(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getMerchantStats(): Promise<MerchantStats> {
    const cacheKey = 'stats:merchants';
    const cached = await getCache<MerchantStats>(cacheKey);
    if (cached) return cached;

    const [totalCount, activeCount, allMerchants] = await Promise.all([
      Merchant.count(),
      Merchant.count({ where: { status: 1 } }),
      Merchant.findAll({ attributes: ['id', 'status'], raw: true }) as unknown as Array<{ id: number; status: number }>,
    ]);

    const ratingMap = new Map<number, number>();
    for (const m of allMerchants) {
      const rating = m.status ?? 0;
      ratingMap.set(rating, (ratingMap.get(rating) || 0) + 1);
    }

    const ratingDistribution = Array.from(ratingMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([rating, count]) => ({
        rating,
        count,
        percentage: allMerchants.length > 0 ? (count / allMerchants.length) * 100 : 0,
      }));

    const result: MerchantStats = {
      totalCount,
      activeCount,
      ratingDistribution,
    };

    await setCache(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getDashboardData(): Promise<DashboardData> {
    const cacheKey = 'stats:dashboard';
    const cached = await getCache<DashboardData>(cacheKey);
    if (cached) return cached;

    const [sales, goods, users, orders, marketing, afterSale, merchants] = await Promise.all([
      this.getSalesStats('day'),
      this.getGoodsStats(10),
      this.getUserStats('day'),
      this.getOrderStats('day'),
      this.getMarketingStats('day'),
      this.getAfterSaleStats('day'),
      this.getMerchantStats(),
    ]);

    const result: DashboardData = {
      sales,
      goods,
      users,
      orders,
      marketing,
      afterSale,
      merchants,
      timestamp: Date.now(),
    };

    await setCache(cacheKey, result, 180);
    return result;
  }

  private getTimeRanges(range: TimeRange): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
    const end = new Date();
    let start: Date;
    let prevStart: Date;
    let prevEnd: Date;

    switch (range) {
      case 'day':
        start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        prevEnd = new Date(start.getTime() - 1);
        prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth(), prevEnd.getDate());
        break;
      case 'week':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        prevEnd = new Date(start.getTime() - 1);
        prevStart = new Date(prevEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(end.getFullYear(), end.getMonth(), 1);
        prevEnd = new Date(start.getTime() - 1);
        prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth(), 1);
        break;
    }

    return { start, end, prevStart, prevEnd };
  }

  private async calculateSalesRange(start: Date, end: Date): Promise<{ gmv: number; orderCount: number }> {
    const result = await Order.findAll({
      attributes: [
        [fn('SUM', col('pay_amount')), 'gmv'],
        [fn('COUNT', col('id')), 'orderCount'],
      ],
      where: {
        status: { [Op.in]: [1, 2, 3] },
        pay_status: 1,
        created_at: { [Op.between]: [start, end] },
      },
      raw: true,
    }) as unknown as Array<{ gmv: number | null; orderCount: number }>;

    return {
      gmv: Number(result[0]?.gmv) || 0,
      orderCount: Number(result[0]?.orderCount) || 0,
    };
  }

  private calcPercentChange(prev: number, curr: number): number {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  }

  private async countNewUsersFromMarketing(start: Date, end: Date): Promise<number> {
    const usedCoupons = await MarketingUser.findAll({
      attributes: ['user_id'],
      where: {
        status: 1,
        used_time: { [Op.between]: [start, end] },
      },
      raw: true,
    }) as unknown as Array<{ user_id: number }>;

    const userIds = [...new Set(usedCoupons.map((u) => u.user_id))];
    if (userIds.length === 0) return 0;

    const newUsers = await User.count({
      where: {
        id: { [Op.in]: userIds },
        created_at: { [Op.between]: [start, end] },
      },
    });

    return newUsers;
  }

  async invalidateStats(type?: 'sales' | 'goods' | 'users' | 'orders' | 'marketing' | 'aftersale' | 'merchants' | 'dashboard' | 'all'): Promise<void> {
    const patterns: string[] = [];

    if (type === 'all') {
      patterns.push('stats:*');
    } else if (type) {
      patterns.push(`stats:${type}*`);
    }

    for (const pattern of patterns) {
      const { delCacheByPattern } = await import('../utils/cache');
      await delCacheByPattern(pattern);
    }
  }
}

export const statisticsService = new StatisticsService();
export default StatisticsService;
