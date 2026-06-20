import { Op } from 'sequelize';
import { AppError } from '../middlewares/errorHandler';
import { daos } from '../dao';
import { marketingValidateService } from './MarketingValidateService';

const {
  marketingDao,
} = daos;

export interface BatchOperationResult {
  success: number;
  failed: number;
  total: number;
  errors: Array<{ id: number; message: string }>;
}

export interface BatchFilterParams {
  type?: number;
  status?: number;
  startTimeStart?: string;
  startTimeEnd?: string;
  endTimeStart?: string;
  endTimeEnd?: string;
  minDiscount?: number;
  maxDiscount?: number;
  discountType?: number;
}

class MarketingBatchService {
  async filterAndOperate(
    filterParams: BatchFilterParams,
    operation: 'online' | 'offline' | 'pause',
    operatorId: number,
    operatorName: string
  ): Promise<BatchOperationResult> {
    const where = this.buildFilterWhere(filterParams);

    const marketings = await marketingDao.findAll({ where });

    if (marketings.length === 0) {
      return {
        success: 0,
        failed: 0,
        total: 0,
        errors: [],
      };
    }

    const result: BatchOperationResult = {
      success: 0,
      failed: 0,
      total: marketings.length,
      errors: [],
    };

    for (const marketing of marketings) {
      try {
        await this.performOperation(marketing.id, operation, operatorId, operatorName);
        result.success++;
      } catch (err) {
        result.failed++;
        result.errors.push({
          id: marketing.id,
          message: (err as Error).message,
        });
      }
    }

    return result;
  }

  async batchOnline(
    ids: number[],
    operatorId: number,
    operatorName: string
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: 0,
      failed: 0,
      total: ids.length,
      errors: [],
    };

    for (const id of ids) {
      try {
        const marketing = await marketingDao.findById(id);
        if (!marketing) {
          throw new AppError('活动不存在', 404);
        }

        if (marketing.status !== 0) {
          throw new AppError('仅待启动的活动可上线');
        }

        await marketingDao.update(id, { status: 1 });

        marketingValidateService.logOperation(
          id,
          'status_change',
          operatorId,
          1,
          operatorName,
          [{ field: 'status', oldValue: '0', newValue: '1' }],
          '批量上线活动'
        );

        result.success++;
      } catch (err) {
        result.failed++;
        result.errors.push({
          id,
          message: (err as Error).message,
        });
      }
    }

    return result;
  }

  async batchOffline(
    ids: number[],
    operatorId: number,
    operatorName: string
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: 0,
      failed: 0,
      total: ids.length,
      errors: [],
    };

    for (const id of ids) {
      try {
        const marketing = await marketingDao.findById(id);
        if (!marketing) {
          throw new AppError('活动不存在', 404);
        }

        if (marketing.status !== 1) {
          throw new AppError('仅进行中的活动可下架');
        }

        await marketingDao.update(id, { status: 3 });

        marketingValidateService.logOperation(
          id,
          'status_change',
          operatorId,
          1,
          operatorName,
          [{ field: 'status', oldValue: '1', newValue: '3' }],
          '批量下架活动'
        );

        result.success++;
      } catch (err) {
        result.failed++;
        result.errors.push({
          id,
          message: (err as Error).message,
        });
      }
    }

    return result;
  }

  async batchPause(
    ids: number[],
    operatorId: number,
    operatorName: string
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: 0,
      failed: 0,
      total: ids.length,
      errors: [],
    };

    for (const id of ids) {
      try {
        const marketing = await marketingDao.findById(id);
        if (!marketing) {
          throw new AppError('活动不存在', 404);
        }

        if (marketing.status !== 1) {
          throw new AppError('仅进行中的活动可暂停');
        }

        await marketingDao.update(id, { is_violation: 1, status: 3 });

        marketingValidateService.logOperation(
          id,
          'violation',
          operatorId,
          1,
          operatorName,
          [{ field: 'status', oldValue: '1', newValue: '3' }],
          '批量暂停违规活动'
        );

        result.success++;
      } catch (err) {
        result.failed++;
        result.errors.push({
          id,
          message: (err as Error).message,
        });
      }
    }

    return result;
  }

  async batchOfflineExpired(
    operatorId: number,
    operatorName: string
  ): Promise<BatchOperationResult> {
    const now = new Date();

    const marketings = await marketingDao.findAll({
      where: {
        status: 1,
        end_time: { [Op.lt]: now },
      },
    });

    const result: BatchOperationResult = {
      success: 0,
      failed: 0,
      total: marketings.length,
      errors: [],
    };

    for (const marketing of marketings) {
      try {
        await marketingDao.update(marketing.id, { status: 2 });

        marketingValidateService.logOperation(
          marketing.id,
          'status_change',
          operatorId,
          2,
          operatorName,
          [{ field: 'status', oldValue: '1', newValue: '2' }],
          '系统自动下架过期活动'
        );

        result.success++;
      } catch (err) {
        result.failed++;
        result.errors.push({
          id: marketing.id,
          message: (err as Error).message,
        });
      }
    }

    return result;
  }

  async batchOnlinePending(
    operatorId: number,
    operatorName: string
  ): Promise<BatchOperationResult> {
    const now = new Date();

    const marketings = await marketingDao.findAll({
      where: {
        status: 0,
        start_time: { [Op.lte]: now },
        end_time: { [Op.gt]: now },
      },
    });

    const result: BatchOperationResult = {
      success: 0,
      failed: 0,
      total: marketings.length,
      errors: [],
    };

    for (const marketing of marketings) {
      try {
        await marketingDao.update(marketing.id, { status: 1 });

        marketingValidateService.logOperation(
          marketing.id,
          'status_change',
          operatorId,
          2,
          operatorName,
          [{ field: 'status', oldValue: '0', newValue: '1' }],
          '系统自动上线待启动活动'
        );

        result.success++;
      } catch (err) {
        result.failed++;
        result.errors.push({
          id: marketing.id,
          message: (err as Error).message,
        });
      }
    }

    return result;
  }

  private async performOperation(
    id: number,
    operation: 'online' | 'offline' | 'pause',
    operatorId: number,
    operatorName: string
  ) {
    const marketing = await marketingDao.findById(id);
    if (!marketing) {
      throw new AppError('活动不存在', 404);
    }

    switch (operation) {
      case 'online':
        if (marketing.status !== 0) {
          throw new AppError('仅待启动的活动可上线');
        }
        await marketingDao.update(id, { status: 1 });
        marketingValidateService.logOperation(
          id,
          'status_change',
          operatorId,
          1,
          operatorName,
          [{ field: 'status', oldValue: '0', newValue: '1' }],
          '筛选批量上线'
        );
        break;

      case 'offline':
        if (marketing.status !== 1) {
          throw new AppError('仅进行中的活动可下架');
        }
        await marketingDao.update(id, { status: 3 });
        marketingValidateService.logOperation(
          id,
          'status_change',
          operatorId,
          1,
          operatorName,
          [{ field: 'status', oldValue: '1', newValue: '3' }],
          '筛选批量下架'
        );
        break;

      case 'pause':
        if (marketing.status !== 1) {
          throw new AppError('仅进行中的活动可暂停');
        }
        await marketingDao.update(id, { is_violation: 1, status: 3 });
        marketingValidateService.logOperation(
          id,
          'violation',
          operatorId,
          1,
          operatorName,
          [{ field: 'status', oldValue: '1', newValue: '3' }],
          '筛选批量暂停违规'
        );
        break;
    }
  }

  private buildFilterWhere(params: BatchFilterParams): any {
    const where: any = {};

    if (params.type !== undefined) {
      where.type = params.type;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.startTimeStart || params.startTimeEnd) {
      where.start_time = {};
      if (params.startTimeStart) {
        where.start_time[Op.gte] = new Date(params.startTimeStart);
      }
      if (params.startTimeEnd) {
        where.start_time[Op.lte] = new Date(params.startTimeEnd);
      }
    }

    if (params.endTimeStart || params.endTimeEnd) {
      where.end_time = {};
      if (params.endTimeStart) {
        where.end_time[Op.gte] = new Date(params.endTimeStart);
      }
      if (params.endTimeEnd) {
        where.end_time[Op.lte] = new Date(params.endTimeEnd);
      }
    }

    if (params.discountType !== undefined) {
      where.discount_type = params.discountType;
    }

    if (params.minDiscount !== undefined || params.maxDiscount !== undefined) {
      where.discount_value = {};
      if (params.minDiscount !== undefined) {
        where.discount_value[Op.gte] = params.minDiscount;
      }
      if (params.maxDiscount !== undefined) {
        where.discount_value[Op.lte] = params.maxDiscount;
      }
    }

    return where;
  }
}

export const marketingBatchService = new MarketingBatchService();
export default MarketingBatchService;
