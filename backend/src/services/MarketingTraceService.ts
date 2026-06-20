import { Op } from 'sequelize';
import { AppError } from '../middlewares/errorHandler';
import { daos } from '../dao';
import { MarketingLog } from '../models/MarketingLog';

const {
  marketingDao,
  marketingLogDao,
  marketingProductDao,
  marketingMerchantQualificationDao,
} = daos;

export interface MarketingTraceData {
  basicInfo: any;
  createLogs: MarketingLog[];
  updateLogs: MarketingLog[];
  auditLogs: MarketingLog[];
  statusLogs: MarketingLog[];
  products: any[];
  merchantQualifications: any[];
  allLogs: MarketingLog[];
}

class MarketingTraceService {
  async getTraceData(marketingId: number): Promise<MarketingTraceData> {
    const marketing = await marketingDao.findById(marketingId);
    if (!marketing) {
      throw new AppError('营销活动不存在', 404);
    }

    const logs = await marketingLogDao.findAll({
      where: { marketing_id: marketingId },
      order: [['created_at', 'DESC']],
    });

    const createLogs = logs.filter(log => log.action === 'create');
    const updateLogs = logs.filter(log => log.action === 'update');
    const auditLogs = logs.filter(log => log.action === 'audit');
    const statusLogs = logs.filter(log => log.action === 'status_change' || log.action === 'violation');

    const products = await marketingProductDao.findAll({
      where: { marketing_id: marketingId },
      order: [['sort_order', 'ASC'], ['id', 'DESC']],
    });

    const merchantQualifications = await marketingMerchantQualificationDao.findAll({
      where: { marketing_id: marketingId },
      order: [['created_at', 'DESC']],
    });

    return {
      basicInfo: marketing,
      createLogs,
      updateLogs,
      auditLogs,
      statusLogs,
      products,
      merchantQualifications,
      allLogs: logs,
    };
  }

  async getOperationLogs(
    marketingId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ list: MarketingLog[]; total: number }> {
    const marketing = await marketingDao.findById(marketingId);
    if (!marketing) {
      throw new AppError('营销活动不存在', 404);
    }

    return marketingLogDao.findPage({
      page,
      pageSize,
      where: { marketing_id: marketingId },
      order: [['created_at', 'DESC']],
    });
  }

  async getProductLedger(
    marketingId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ list: any[]; total: number }> {
    const marketing = await marketingDao.findById(marketingId);
    if (!marketing) {
      throw new AppError('营销活动不存在', 404);
    }

    return marketingProductDao.findPage({
      page,
      pageSize,
      where: { marketing_id: marketingId },
      order: [['sort_order', 'ASC'], ['id', 'DESC']],
    });
  }

  async getCreateInfo(marketingId: number): Promise<{
    marketing: any;
    createLog: MarketingLog | null;
    fieldChanges: Array<{ field: string; oldValue?: string; newValue?: string; createdAt: Date }>;
  }> {
    const marketing = await marketingDao.findById(marketingId);
    if (!marketing) {
      throw new AppError('营销活动不存在', 404);
    }

    const createLogs = await marketingLogDao.findAll({
      where: {
        marketing_id: marketingId,
        action: 'create',
      },
      order: [['created_at', 'ASC']],
      limit: 1,
    });

    const createLog = createLogs.length > 0 ? createLogs[0] : null;

    const allLogs = await marketingLogDao.findAll({
      where: { marketing_id: marketingId },
      order: [['created_at', 'ASC']],
    });

    const fieldChanges: Array<{ field: string; oldValue?: string; newValue?: string; createdAt: Date }> = [];

    for (const log of allLogs) {
      if (log.field_name) {
        fieldChanges.push({
          field: log.field_name,
          oldValue: log.old_value ?? undefined,
          newValue: log.new_value ?? undefined,
          createdAt: log.created_at,
        });
      }
    }

    return {
      marketing,
      createLog,
      fieldChanges,
    };
  }

  async checkDuplicateConfig(params: {
    type?: number;
    startTime?: string | Date;
    endTime?: string | Date;
    categoryIds?: string;
    merchantIds?: string;
    discountValue?: number;
    excludeId?: number;
  }): Promise<{ isDuplicate: boolean; duplicateActivities: any[] }> {
    const { type, startTime, endTime, categoryIds, merchantIds, discountValue, excludeId } = params;

    const where: any = {
      status: { [Op.in]: [0, 1] },
    };

    if (type !== undefined) {
      where.type = type;
    }

    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      where[Op.and] = [
        { start_time: { [Op.lte]: end } },
        { end_time: { [Op.gte]: start } },
      ];
    }

    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    const activities = await marketingDao.findAll({ where });

    const duplicateActivities: any[] = [];

    for (const activity of activities) {
      let isDuplicate = false;
      let duplicateReason = '';

      if (categoryIds && (activity as any).category_ids) {
        const activityCategories = (activity as any).category_ids.split(',').map(Number);
        const newCategories = categoryIds.split(',').map(Number);
        const hasOverlap = activityCategories.some((c: number) => newCategories.includes(c));
        if (hasOverlap) {
          isDuplicate = true;
          duplicateReason += '类目范围重叠；';
        }
      }

      if (merchantIds && (activity as any).merchant_ids) {
        const activityMerchants = (activity as any).merchant_ids.split(',').map(Number);
        const newMerchants = merchantIds.split(',').map(Number);
        const hasOverlap = activityMerchants.some((m: number) => newMerchants.includes(m));
        if (hasOverlap) {
          isDuplicate = true;
          duplicateReason += '商家范围重叠；';
        }
      }

      if (discountValue !== undefined && (activity as any).discount_value === discountValue) {
        isDuplicate = true;
        duplicateReason += '优惠力度相同；';
      }

      if (isDuplicate) {
        duplicateActivities.push({
          id: activity.id,
          name: (activity as any).name,
          startTime: (activity as any).start_time,
          endTime: (activity as any).end_time,
          status: activity.status,
          duplicateReason,
        });
      }
    }

    return {
      isDuplicate: duplicateActivities.length > 0,
      duplicateActivities,
    };
  }
}

export const marketingTraceService = new MarketingTraceService();
export default MarketingTraceService;
