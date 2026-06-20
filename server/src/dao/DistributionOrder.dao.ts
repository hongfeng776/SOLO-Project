import { FindOptions, Op, fn, col, literal } from 'sequelize';
import Order, { OrderAttributes } from '../models/Order.model';
import { Channel, Promoter, Commission, Product } from '../models';
import { OrderStatus, CommissionStatus } from '../constants/enum';

export interface DistributionOrderQueryParams {
  page: number;
  pageSize: number;
  orderNo?: string;
  channelId?: string;
  promoterId?: string;
  productId?: string;
  productName?: string;
  status?: OrderStatus | OrderStatus[];
  isAbnormal?: boolean;
  isPendingReview?: boolean;
  isUnsettled?: boolean;
  startTime?: string;
  endTime?: string;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
  ids?: string[];
}

export interface OrderStatistics {
  total: number;
  totalAmount: number;
  totalCommission: number;
  statusBreakdown: { status: OrderStatus; count: number; amount: number }[];
  abnormalCount: number;
  pendingReviewCount: number;
  unsettledCount: number;
}

class DistributionOrderDao {
  private buildWhereClause(params: DistributionOrderQueryParams): any {
    const {
      orderNo,
      channelId,
      promoterId,
      productId,
      productName,
      status,
      isAbnormal,
      isPendingReview,
      isUnsettled,
      startTime,
      endTime,
      ids,
    } = params;

    const where: any = {};

    if (ids && ids.length > 0) {
      where.id = { [Op.in]: ids };
    }

    if (orderNo) {
      where.orderNo = { [Op.like]: `%${orderNo.trim()}%` };
    }

    if (channelId) {
      where.channelId = channelId;
    }

    if (promoterId) {
      where.promoterId = promoterId;
    }

    if (productId) {
      where.productSku = { [Op.like]: `%${productId}%` };
    }

    if (productName) {
      where.productName = { [Op.like]: `%${productName.trim()}%` };
    }

    if (status !== undefined) {
      if (Array.isArray(status)) {
        where.status = { [Op.in]: status };
      } else {
        where.status = status;
      }
    }

    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) {
        where.createdAt[Op.gte] = new Date(startTime);
      }
      if (endTime) {
        const end = new Date(endTime);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    return where;
  }

  public async findAllPaged(
    params: DistributionOrderQueryParams
  ): Promise<{ rows: any[]; count: number }> {
    const { page, pageSize, sortField = 'createdAt', sortOrder = 'DESC' } = params;
    const offset = (page - 1) * pageSize;
    const where = this.buildWhereClause(params);

    const include: any[] = [
      {
        model: Channel,
        as: 'channel',
        attributes: ['id', 'name'],
        required: false,
      },
      {
        model: Promoter,
        as: 'promoter',
        attributes: ['id', 'name', 'code', 'phone'],
        required: false,
      },
      {
        model: Commission,
        as: 'commission',
        attributes: ['id', 'status', 'amount', 'settleTime'],
        required: false,
      },
    ];

    const order: any = [[sortField, sortOrder]];

    const result = await Order.findAndCountAll({
      where,
      include,
      offset,
      limit: pageSize,
      order,
      distinct: true,
    });

    const rows = result.rows.map((row: any) => {
      const data = row.toJSON();
      data.isAbnormal = this.checkIsAbnormal(data);
      data.isPendingReview = this.checkIsPendingReview(data);
      data.isUnsettled = this.checkIsUnsettled(data);
      return data;
    });

    return { rows, count: result.count };
  }

  public async findAllForExport(
    params: DistributionOrderQueryParams,
    fields?: string[],
    sortField?: string,
    sortOrder?: 'ASC' | 'DESC'
  ): Promise<any[]> {
    const where = this.buildWhereClause(params);

    const include: any[] = [
      {
        model: Channel,
        as: 'channel',
        attributes: ['id', 'name'],
        required: false,
      },
      {
        model: Promoter,
        as: 'promoter',
        attributes: ['id', 'name', 'code', 'phone'],
        required: false,
      },
      {
        model: Commission,
        as: 'commission',
        attributes: ['id', 'status', 'amount', 'settleTime'],
        required: false,
      },
    ];

    const order: any = [[sortField || 'createdAt', sortOrder || 'DESC']];

    const rows = await Order.findAll({
      where,
      include,
      order,
    });

    return rows.map((row: any) => {
      const data = row.toJSON();
      data.isAbnormal = this.checkIsAbnormal(data);
      data.isPendingReview = this.checkIsPendingReview(data);
      data.isUnsettled = this.checkIsUnsettled(data);
      if (fields && fields.length > 0) {
        const filtered: any = {};
        fields.forEach((field) => {
          if (data[field] !== undefined) {
            filtered[field] = data[field];
          }
        });
        filtered.channelName = data.channel?.name;
        filtered.promoterName = data.promoter?.name;
        filtered.promoterCode = data.promoter?.code;
        filtered.commissionStatus = data.commission?.status;
        return filtered;
      }
      data.channelName = data.channel?.name;
      data.promoterName = data.promoter?.name;
      data.promoterCode = data.promoter?.code;
      data.commissionStatus = data.commission?.status;
      return data;
    });
  }

  public async getStatistics(
    params: DistributionOrderQueryParams
  ): Promise<OrderStatistics> {
    const where = this.buildWhereClause(params);

    const baseOptions: FindOptions = { where };

    const totalResult = await Order.findAndCountAll(baseOptions);
    const total = totalResult.count;

    const aggResult = await Order.findOne({
      where,
      attributes: [
        [fn('SUM', col('pay_amount')), 'totalAmount'],
        [fn('SUM', col('commission_amount')), 'totalCommission'],
      ],
      raw: true,
    } as any);

    const statusBreakdown: { status: OrderStatus; count: number; amount: number }[] = [];
    const statusGroup = await Order.findAll({
      where,
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('pay_amount')), 'amount'],
      ],
      group: ['status'],
      raw: true,
    } as any);

    statusGroup.forEach((item: any) => {
      statusBreakdown.push({
        status: item.status,
        count: parseInt(item.count, 10),
        amount: parseFloat(item.amount) || 0,
      });
    });

    const abnormalCount = await this.countAbnormal(where);
    const pendingReviewCount = await this.countPendingReview(where);
    const unsettledCount = await this.countUnsettled(where);

    return {
      total,
      totalAmount: parseFloat((aggResult as any).totalAmount) || 0,
      totalCommission: parseFloat((aggResult as any).totalCommission) || 0,
      statusBreakdown,
      abnormalCount,
      pendingReviewCount,
      unsettledCount,
    };
  }

  private async countAbnormal(where: any): Promise<number> {
    const abnormalStatuses = [OrderStatus.REFUNDING, OrderStatus.REFUNDED, OrderStatus.CANCELLED];
    const abnormalWhere = {
      ...where,
      status: { [Op.in]: abnormalStatuses },
    };
    return Order.count({ where: abnormalWhere });
  }

  private async countPendingReview(where: any): Promise<number> {
    const pendingWhere = {
      ...where,
      [Op.or]: [
        { status: OrderStatus.PAID },
        { status: OrderStatus.SHIPPED },
      ],
    };
    return Order.count({ where: pendingWhere });
  }

  private async countUnsettled(where: any): Promise<number> {
    return Order.count({
      where,
      include: [
        {
          model: Commission,
          as: 'commission',
          required: true,
          where: {
            status: { [Op.in]: [CommissionStatus.PENDING, CommissionStatus.SETTLING] },
          },
        },
      ],
    });
  }

  private checkIsAbnormal(order: any): boolean {
    const abnormalStatuses = [OrderStatus.REFUNDING, OrderStatus.REFUNDED, OrderStatus.CANCELLED];
    return abnormalStatuses.includes(order.status);
  }

  private checkIsPendingReview(order: any): boolean {
    return order.status === OrderStatus.PAID || order.status === OrderStatus.SHIPPED;
  }

  private checkIsUnsettled(order: any): boolean {
    if (!order.commission) return false;
    return (
      order.commission.status === CommissionStatus.PENDING ||
      order.commission.status === CommissionStatus.SETTLING
    );
  }

  public async bulkMark(
    ids: string[],
    data: Partial<OrderAttributes>
  ): Promise<[number, Order[]]> {
    return Order.update(data, { where: { id: { [Op.in]: ids } } }) as unknown as Promise<
      [number, Order[]]
    >;
  }

  public async findByIds(ids: string[]): Promise<any[]> {
    const rows = await Order.findAll({
      where: { id: { [Op.in]: ids } },
      include: [
        {
          model: Channel,
          as: 'channel',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: Promoter,
          as: 'promoter',
          attributes: ['id', 'name', 'code'],
          required: false,
        },
      ],
    });
    return rows.map((row: any) => row.toJSON());
  }

  public async validateDataConsistency(ids: string[]): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    const rows = await this.findByIds(ids);

    const idSet = new Set(rows.map((r) => r.id));
    if (idSet.size !== rows.length) {
      issues.push('存在重复订单数据');
    }

    const missingIds = ids.filter((id) => !idSet.has(id));
    if (missingIds.length > 0) {
      issues.push(`订单数据缺失: ${missingIds.length} 条`);
    }

    return { valid: issues.length === 0, issues };
  }
}

export default new DistributionOrderDao();
