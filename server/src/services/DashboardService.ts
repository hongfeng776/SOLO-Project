import { Op, fn, col, literal } from 'sequelize';
import { db } from '@models/index';
import { CacheUtil } from '@utils/cache';

const STATS_CACHE_TTL = 30;
const TREND_CACHE_TTL = 60;
const RECENT_CACHE_TTL = 15;

type TrendItem = { date: string; totalAsset: number };

class DashboardService {
  async getStats() {
    const cacheKey = 'dashboard:stats';
    return CacheUtil.getOrSet(cacheKey, STATS_CACHE_TTL, async () => {
      const [totalAssetResult, todayTradeResult, customerCountResult, productCountResult, pendingAuditTradeResult, pendingAuditComplianceResult, pendingAlertResult] = await Promise.all([
        db.CustomerAsset.findAll({
          attributes: [[fn('SUM', col('total_asset')), 'totalAsset']],
          raw: true,
        }),
        db.Trade.findAll({
          attributes: [[fn('SUM', col('trade_amount')), 'todayAmount']],
          where: {
            trade_status: 'success',
            created_at: {
              [Op.gte]: literal('CURRENT_DATE'),
            },
          },
          raw: true,
        }),
        db.CustomerAsset.count(),
        db.AssetProduct.count(),
        db.Trade.count({ where: { trade_status: 'auditing' } }),
        db.ComplianceAudit.count({ where: { audit_status: 'pending' } }),
        db.RiskAlert.count({ where: { alert_status: { [Op.in]: ['pending', 'confirmed'] } } }),
      ]);

      const totalAsset = Number((totalAssetResult as any)[0]?.totalAsset) || 0;
      const todayTradeAmount = Number((todayTradeResult as any)[0]?.todayAmount) || 0;
      const customerCount = Number(customerCountResult) || 0;
      const productCount = Number(productCountResult) || 0;
      const pendingAuditCount = (Number(pendingAuditTradeResult) || 0) + (Number(pendingAuditComplianceResult) || 0);
      const pendingAlertCount = Number(pendingAlertResult) || 0;

      return {
        totalAsset,
        todayTradeAmount,
        customerCount,
        productCount,
        pendingAuditCount,
        pendingAlertCount,
      };
    });
  }

  async getRecentFlows(limit: number = 10) {
    const cacheKey = `dashboard:recent-flows:${limit}`;
    return CacheUtil.getOrSet(cacheKey, RECENT_CACHE_TTL, async () => {
      const flows = await db.FundFlow.findAll({
        limit,
        order: [['created_at', 'DESC']],
      });
      return flows;
    });
  }

  async getRecentAlerts(limit: number = 10) {
    const cacheKey = `dashboard:recent-alerts:${limit}`;
    return CacheUtil.getOrSet(cacheKey, RECENT_CACHE_TTL, async () => {
      const alerts = await db.RiskAlert.findAll({
        limit,
        order: [['created_at', 'DESC']],
      });
      return alerts;
    });
  }

  async getAssetTrend(days: number = 7) {
    const cacheKey = `dashboard:asset-trend:${days}`;
    return CacheUtil.getOrSet(cacheKey, TREND_CACHE_TTL, async () => {
      const result: TrendItem[] = [];
      const now = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const holdings = await db.CustomerHolding.findAll({
          attributes: [[fn('SUM', col('market_value')), 'dayTotal']],
          where: {
            created_at: {
              [Op.lte]: new Date(dateStr + ' 23:59:59'),
            },
          },
          raw: true,
        });

        const customers = await db.CustomerAsset.findAll({
          attributes: [[fn('SUM', col('total_asset')), 'dayCustomerTotal']],
          where: {
            created_at: {
              [Op.lte]: new Date(dateStr + ' 23:59:59'),
            },
          },
          raw: true,
        });

        const holdingTotal = Number((holdings as any)[0]?.dayTotal) || 0;
        const customerTotal = Number((customers as any)[0]?.dayCustomerTotal) || 0;
        const totalAsset = holdingTotal > 0 ? holdingTotal : customerTotal;

        result.push({
          date: dateStr,
          totalAsset: Number(totalAsset.toFixed(2)),
        });
      }

      return result;
    });
  }
}

export default new DashboardService();
