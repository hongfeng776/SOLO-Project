import { Transaction, AuditRecord, User, Product, Customer, ViolationRecord, Organization } from '../models';
import { Op, fn, col, literal } from 'sequelize';
import dayjs from 'dayjs';

const channelNameMap: Record<string, string> = {
  counter: '柜面',
  mobile: '手机银行',
  ebank: '网上银行',
  atm: '自助终端',
  phone: '电话银行',
  smart: '智慧柜员机',
  pos: 'POS',
  wechat: '微信',
  alipay: '支付宝'
};

const auditStatusMap: Record<number, string> = {
  0: '待审核',
  1: '审核中',
  10: '通过',
  11: '拒绝'
};

const riskLevelMap: Record<number, string> = {
  0: '无风险',
  1: '低',
  2: '中低',
  3: '中',
  4: '中高',
  5: '高'
};

const violationTypeMap: Record<number, string> = {
  1: '资金异常',
  2: '可疑账户',
  3: '操作违规',
  4: '资料不全',
  5: '反洗钱',
  6: '监管违规',
  7: '其他'
};

const customerLevelMap: Record<number, string> = {
  1: '普通',
  2: '银卡',
  3: '金卡',
  4: '白金',
  5: '钻石'
};

function buildTimeRange(startTime?: string, endTime?: string) {
  const start = startTime ? dayjs(startTime).startOf('day').toDate() : dayjs().startOf('month').toDate();
  const end = endTime ? dayjs(endTime).endOf('day').toDate() : dayjs().endOf('day').toDate();
  return { start, end };
}

function addOrgFilter(where: any, orgId?: string, orgField: string = 'org_id') {
  if (orgId) {
    where[orgField] = orgId;
  }
  return where;
}

export class DashboardService {
  async getOverviewStatistics(startTime?: string, endTime?: string, orgId?: string) {
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();
    const { start, end } = buildTimeRange(startTime, endTime);

    const todayTxWhere: any = {
      transaction_time: { [Op.gte]: todayStart, [Op.lte]: todayEnd },
      status: 2
    };
    addOrgFilter(todayTxWhere, orgId);

    const txWhere: any = {
      transaction_time: { [Op.gte]: start, [Op.lte]: end },
      status: 2
    };
    addOrgFilter(txWhere, orgId);

    const pendingAuditWhere: any = {
      status: 0
    };
    addOrgFilter(pendingAuditWhere, orgId, 'submitter_org_id');

    const violationPendingWhere: any = {
      status: 0
    };
    addOrgFilter(violationPendingWhere, orgId, 'discoverer_org_id');

    const activeUserWhere: any = {
      status: 1,
      last_login_at: { [Op.gte]: dayjs().subtract(7, 'day').toDate() }
    };
    addOrgFilter(activeUserWhere, orgId);

    const productWhere: any = { status: 1 };

    const [
      todayTxResult,
      pendingAuditCount,
      activeUserCount,
      totalProductCount,
      totalCustomerCount,
      violationPendingCount
    ] = await Promise.all([
      Transaction.findOne({
        where: todayTxWhere,
        attributes: [
          [fn('SUM', col('amount')), 'totalAmount'],
          [fn('COUNT', col('id')), 'totalCount']
        ],
        raw: true
      }),
      AuditRecord.count({ where: pendingAuditWhere }),
      User.count({ where: activeUserWhere }),
      Product.count({ where: productWhere }),
      Customer.count(),
      ViolationRecord.count({ where: violationPendingWhere })
    ]);

    const channels = await Transaction.findAll({
      where: txWhere,
      attributes: [[fn('DISTINCT', col('channel_code')), 'channel_code']],
      raw: true
    });
    const totalChannelCount = channels.filter((c: any) => c.channel_code).length;

    return {
      todayTransactionAmount: Number((todayTxResult as any)?.totalAmount || 0),
      todayTransactionCount: Number((todayTxResult as any)?.totalCount || 0),
      pendingAuditCount,
      activeUserCount,
      totalProductCount,
      totalChannelCount,
      totalCustomerCount,
      violationPendingCount
    };
  }

  async getChannelStatistics(startTime?: string, endTime?: string, orgId?: string) {
    const { start, end } = buildTimeRange(startTime, endTime);

    const where: any = {
      transaction_time: { [Op.gte]: start, [Op.lte]: end },
      status: 2,
      channel_code: { [Op.ne]: null }
    };
    addOrgFilter(where, orgId);

    const rows: any = await Transaction.findAll({
      where,
      attributes: [
        'channel_code',
        [fn('SUM', col('amount')), 'amount'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['channel_code'],
      raw: true
    });

    const totalCount = rows.reduce((sum: number, r: any) => sum + Number(r.count || 0), 0);

    return rows.map((r: any) => ({
      channelCode: r.channel_code,
      channelName: channelNameMap[r.channel_code] || r.channel_code,
      amount: Number(r.amount || 0),
      count: Number(r.count || 0),
      percentage: totalCount > 0 ? Number(((Number(r.count || 0) / totalCount) * 100).toFixed(2)) : 0
    })).sort((a: any, b: any) => b.count - a.count);
  }

  async getBusinessTrend(days: number = 7, orgId?: string) {
    const start = dayjs().subtract(days - 1, 'day').startOf('day').toDate();
    const end = dayjs().endOf('day').toDate();

    const where: any = {
      transaction_time: { [Op.gte]: start, [Op.lte]: end },
      status: 2
    };
    addOrgFilter(where, orgId);

    const rows: any = await Transaction.findAll({
      where,
      attributes: [
        [literal('DATE(transaction_time)'), 'date'],
        [fn('SUM', col('amount')), 'amount'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['date'],
      order: [['date', 'ASC']],
      raw: true
    } as any);

    const dateMap = new Map<string, { amount: number; count: number }>();
    rows.forEach((r: any) => {
      dateMap.set(dayjs(r.date).format('YYYY-MM-DD'), {
        amount: Number(r.amount || 0),
        count: Number(r.count || 0)
      });
    });

    const result: Array<{ date: string; amount: number; count: number }> = [];
    for (let i = 0; i < days; i++) {
      const d = dayjs().subtract(days - 1 - i, 'day').format('YYYY-MM-DD');
      const data = dateMap.get(d) || { amount: 0, count: 0 };
      result.push({ date: d, ...data });
    }

    return result;
  }

  async getAuditStatistics(startTime?: string, endTime?: string, orgId?: string) {
    const { start, end } = buildTimeRange(startTime, endTime);

    const where: any = {
      submit_time: { [Op.gte]: start, [Op.lte]: end }
    };
    addOrgFilter(where, orgId, 'submitter_org_id');

    const rows: any = await AuditRecord.findAll({
      where,
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const merged: Record<number, number> = { 0: 0, 1: 0, 10: 0, 11: 0 };
    rows.forEach((r: any) => {
      const s = Number(r.status);
      if (s === 0) merged[0] += Number(r.count || 0);
      else if (s === 1 || s === 2 || s === 3) merged[1] += Number(r.count || 0);
      else if (s === 10) merged[10] += Number(r.count || 0);
      else if (s === 11) merged[11] += Number(r.count || 0);
    });

    const totalCount = Object.values(merged).reduce((sum, c) => sum + c, 0);

    return (Object.keys(merged) as unknown as number[]).map((statusKey: any) => {
      const status = Number(statusKey);
      const count = merged[status];
      return {
        status,
        statusText: auditStatusMap[status] || String(status),
        count,
        percentage: totalCount > 0 ? Number(((count / totalCount) * 100).toFixed(2)) : 0
      };
    });
  }

  async getRiskStatistics(startTime?: string, endTime?: string, orgId?: string) {
    const { start, end } = buildTimeRange(startTime, endTime);

    const txWhere: any = {
      transaction_time: { [Op.gte]: start, [Op.lte]: end },
      status: 2,
      risk_level: { [Op.ne]: null }
    };
    addOrgFilter(txWhere, orgId);

    const violationWhere: any = {
      discover_time: { [Op.gte]: start, [Op.lte]: end }
    };
    addOrgFilter(violationWhere, orgId, 'discoverer_org_id');

    const [riskRows, violationRows]: any = await Promise.all([
      Transaction.findAll({
        where: txWhere,
        attributes: [
          'risk_level',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['risk_level'],
        raw: true
      }),
      ViolationRecord.findAll({
        where: violationWhere,
        attributes: [
          'violation_type',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['violation_type'],
        raw: true
      })
    ]);

    const totalRiskCount = riskRows.reduce((sum: number, r: any) => sum + Number(r.count || 0), 0);
    const riskLevelDistribution = Object.keys(riskLevelMap).map(key => {
      const level = Number(key);
      const found = riskRows.find((r: any) => Number(r.risk_level) === level);
      const count = found ? Number(found.count || 0) : 0;
      return {
        level,
        levelText: riskLevelMap[level],
        count,
        percentage: totalRiskCount > 0 ? Number(((count / totalRiskCount) * 100).toFixed(2)) : 0
      };
    });

    const totalViolationCount = violationRows.reduce((sum: number, r: any) => sum + Number(r.count || 0), 0);
    const violationTypeDistribution = Object.keys(violationTypeMap).map(key => {
      const type = Number(key);
      const found = violationRows.find((r: any) => Number(r.violation_type) === type);
      const count = found ? Number(found.count || 0) : 0;
      return {
        type,
        typeText: violationTypeMap[type],
        count,
        percentage: totalViolationCount > 0 ? Number(((count / totalViolationCount) * 100).toFixed(2)) : 0
      };
    });

    return {
      riskLevelDistribution,
      violationTypeDistribution
    };
  }

  async getOrgStatistics(orgId?: string) {
    const where: any = { status: 2 };
    addOrgFilter(where, orgId);

    const rows: any = await Transaction.findAll({
      where,
      attributes: [
        'org_id',
        [fn('SUM', col('amount')), 'amount'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['org_id'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    const orgIds = rows.map((r: any) => r.org_id).filter(Boolean);
    const orgs = await Organization.findAll({
      where: { id: { [Op.in]: orgIds } },
      attributes: ['id', 'name'],
      raw: true
    });
    const orgMap = new Map(orgs.map((o: any) => [o.id, o.name]));

    return rows.map((r: any) => ({
      orgId: r.org_id,
      orgName: orgMap.get(r.org_id) || '未知机构',
      amount: Number(r.amount || 0),
      count: Number(r.count || 0)
    }));
  }

  async getCustomerStatistics(startTime?: string, endTime?: string) {
    const { start, end } = buildTimeRange(startTime, endTime);

    const [newCustomerCount, levelRows, activeCustomerRows]: any = await Promise.all([
      Customer.count({
        where: {
          open_date: { [Op.gte]: start, [Op.lte]: end }
        } as any
      }),
      Customer.findAll({
        where: { status: 1, customer_level: { [Op.ne]: null } } as any,
        attributes: [
          'customer_level',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['customer_level'],
        raw: true
      }),
      Transaction.findAll({
        where: {
          transaction_time: { [Op.gte]: start, [Op.lte]: end },
          status: 2,
          customer_id: { [Op.ne]: null }
        } as any,
        attributes: [[fn('DISTINCT', col('customer_id')), 'customer_id']],
        raw: true
      })
    ]);

    const activeCustomerCount = activeCustomerRows.filter((r: any) => r.customer_id).length;

    const totalLevelCount = levelRows.reduce((sum: number, r: any) => sum + Number(r.count || 0), 0);
    const customerLevelDistribution = Object.keys(customerLevelMap).map(key => {
      const level = Number(key);
      const found = levelRows.find((r: any) => Number(r.customer_level) === level);
      const count = found ? Number(found.count || 0) : 0;
      return {
        level,
        levelText: customerLevelMap[level],
        count,
        percentage: totalLevelCount > 0 ? Number(((count / totalLevelCount) * 100).toFixed(2)) : 0
      };
    });

    return {
      newCustomerCount,
      activeCustomerCount,
      customerLevelDistribution
    };
  }
}
