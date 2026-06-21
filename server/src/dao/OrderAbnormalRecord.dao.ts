import { FindOptions, Op } from 'sequelize';
import OrderAbnormalRecord, {
  OrderAbnormalRecordAttributes,
  OrderAbnormalRecordCreationAttributes,
} from '../models/OrderAbnormalRecord.model';
import {
  OrderAbnormalStatus,
  OrderAbnormalType,
  OrderAbnormalSeverity,
} from '../constants/enum';

export interface AbnormalRecordQueryParams {
  page: number;
  pageSize: number;
  orderId?: string;
  orderNo?: string;
  abnormalType?: OrderAbnormalType;
  severity?: OrderAbnormalSeverity;
  status?: OrderAbnormalStatus;
  promoterId?: string;
  channelId?: string;
  isLocked?: boolean;
  startTime?: string;
  endTime?: string;
  ids?: string[];
}

class OrderAbnormalRecordDao {
  public async create(
    data: OrderAbnormalRecordCreationAttributes
  ): Promise<OrderAbnormalRecord> {
    return OrderAbnormalRecord.create(data);
  }

  public async bulkCreate(
    dataList: OrderAbnormalRecordCreationAttributes[]
  ): Promise<OrderAbnormalRecord[]> {
    return OrderAbnormalRecord.bulkCreate(dataList);
  }

  public async findById(id: string): Promise<OrderAbnormalRecord | null> {
    return OrderAbnormalRecord.findByPk(id);
  }

  public async findByOrderId(orderId: string): Promise<OrderAbnormalRecord[]> {
    return OrderAbnormalRecord.findAll({
      where: { orderId },
      order: [['detectedAt', 'DESC']],
    });
  }

  public async findByOrderNo(orderNo: string): Promise<OrderAbnormalRecord[]> {
    return OrderAbnormalRecord.findAll({
      where: { orderNo },
      order: [['detectedAt', 'DESC']],
    });
  }

  public async findActiveByOrderId(orderId: string): Promise<OrderAbnormalRecord[]> {
    return OrderAbnormalRecord.findAll({
      where: {
        orderId,
        isLocked: true,
        status: {
          [Op.in]: [OrderAbnormalStatus.PENDING_REVIEW, OrderAbnormalStatus.REVIEWING],
        },
      },
      order: [['detectedAt', 'DESC']],
    });
  }

  public async findAndCountAll(
    options: FindOptions
  ): Promise<{ rows: OrderAbnormalRecord[]; count: number }> {
    return OrderAbnormalRecord.findAndCountAll(options);
  }

  public async query(params: AbnormalRecordQueryParams): Promise<{
    rows: OrderAbnormalRecord[];
    count: number;
  }> {
    const {
      page,
      pageSize,
      orderId,
      orderNo,
      abnormalType,
      severity,
      status,
      promoterId,
      channelId,
      isLocked,
      startTime,
      endTime,
      ids,
    } = params;

    const where: any = {};

    if (ids && ids.length > 0) {
      where.id = { [Op.in]: ids };
    }
    if (orderId) {
      where.orderId = orderId;
    }
    if (orderNo) {
      where.orderNo = { [Op.like]: `%${orderNo.trim()}%` };
    }
    if (abnormalType) {
      where.abnormalTypes = { [Op.like]: `%${abnormalType}%` };
    }
    if (severity) {
      where.severity = severity;
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (promoterId) {
      where.promoterId = promoterId;
    }
    if (channelId) {
      where.channelId = channelId;
    }
    if (isLocked !== undefined) {
      where.isLocked = isLocked;
    }
    if (startTime && endTime) {
      where.detectedAt = { [Op.gte]: startTime, [Op.lte]: endTime };
    } else if (startTime) {
      where.detectedAt = { [Op.gte]: startTime };
    } else if (endTime) {
      where.detectedAt = { [Op.lte]: endTime };
    }

    const offset = (page - 1) * pageSize;
    return OrderAbnormalRecord.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['detectedAt', 'DESC']],
    });
  }

  public async update(
    id: string,
    data: Partial<OrderAbnormalRecordAttributes>
  ): Promise<[number, OrderAbnormalRecord[]]> {
    return OrderAbnormalRecord.update(data, {
      where: { id },
      returning: true,
    });
  }

  public async bulkUpdate(
    ids: string[],
    data: Partial<OrderAbnormalRecordAttributes>
  ): Promise<number> {
    const [count] = await OrderAbnormalRecord.update(data, {
      where: { id: { [Op.in]: ids } },
    });
    return count;
  }

  public async unlockByOrderId(orderId: string): Promise<number> {
    const [count] = await OrderAbnormalRecord.update(
      { isLocked: false, autoSettleBlocked: false, commissionBlocked: false },
      { where: { orderId, isLocked: true } }
    );
    return count;
  }

  public async countByPromoterInTimeWindow(
    promoterId: string,
    startTime: Date,
    endTime: Date,
    abnormalType?: OrderAbnormalType
  ): Promise<number> {
    const where: any = {
      promoterId,
      detectedAt: { [Op.gte]: startTime, [Op.lte]: endTime },
    };
    if (abnormalType) {
      where.abnormalTypes = { [Op.like]: `%${abnormalType}%` } as any;
    }
    const result = await OrderAbnormalRecord.count({ where } as any);
    return (typeof result === 'number' ? result : 0) as number;
  }

  public async countByChannelInTimeWindow(
    channelId: string,
    startTime: Date,
    endTime: Date,
    abnormalType?: OrderAbnormalType
  ): Promise<number> {
    const where: any = {
      channelId,
      detectedAt: { [Op.gte]: startTime, [Op.lte]: endTime },
    };
    if (abnormalType) {
      where.abnormalTypes = { [Op.like]: `%${abnormalType}%` } as any;
    }
    const result = await OrderAbnormalRecord.count({ where } as any);
    return (typeof result === 'number' ? result : 0) as number;
  }

  public async countByTypeInTimeWindow(
    abnormalType: OrderAbnormalType,
    startTime: Date,
    endTime: Date
  ): Promise<number> {
    const result = await OrderAbnormalRecord.count({
      where: {
        abnormalTypes: { [Op.like]: `%${abnormalType}%` } as any,
        detectedAt: { [Op.gte]: startTime, [Op.lte]: endTime },
      },
    } as any);
    return (typeof result === 'number' ? result : 0) as number;
  }

  public async existsActiveAbnormal(orderId: string): Promise<boolean> {
    const count = await OrderAbnormalRecord.count({
      where: {
        orderId,
        isLocked: true,
        status: {
          [Op.in]: [OrderAbnormalStatus.PENDING_REVIEW, OrderAbnormalStatus.REVIEWING],
        },
      },
    });
    return count > 0;
  }

  public async getStatistics(
    startTime?: string,
    endTime?: string
  ): Promise<{
    total: number;
    pending: number;
    reviewing: number;
    resolved: number;
    rejected: number;
    locked: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const where: any = {};
    if (startTime && endTime) {
      where.detectedAt = { [Op.gte]: startTime, [Op.lte]: endTime };
    }

    const all = await OrderAbnormalRecord.findAll({ where });

    const stats = {
      total: all.length,
      pending: all.filter((r) => r.status === OrderAbnormalStatus.PENDING_REVIEW).length,
      reviewing: all.filter((r) => r.status === OrderAbnormalStatus.REVIEWING).length,
      resolved: all.filter((r) => r.status === OrderAbnormalStatus.RESOLVED).length,
      rejected: all.filter((r) => r.status === OrderAbnormalStatus.REJECTED).length,
      locked: all.filter((r) => r.isLocked).length,
      bySeverity: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    };

    all.forEach((r) => {
      stats.bySeverity[r.severity] = (stats.bySeverity[r.severity] || 0) + 1;
      (r.abnormalTypes || []).forEach((t) => {
        stats.byType[t] = (stats.byType[t] || 0) + 1;
      });
    });

    return stats;
  }
}

export default new OrderAbnormalRecordDao();
