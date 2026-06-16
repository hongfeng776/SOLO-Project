import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, Op, fn, col, literal } from 'sequelize';
import Commission, { CommissionAttributes, CommissionCreationAttributes } from '../models/Commission.model';
import { Promoter } from '../models';
import { Channel } from '../models';

interface CommissionQueryParams {
  page: number;
  pageSize: number;
  promoterId?: string;
  status?: number;
  type?: number;
  startTime?: string;
  endTime?: string;
}

export interface CommissionSummary {
  totalAmount: number;
  pendingAmount: number;
  settledAmount: number;
  withdrawnAmount: number;
  deductedAmount: number;
  totalCount: number;
}

class CommissionDao {
  public async create(data: CommissionCreationAttributes, options?: CreateOptions): Promise<Commission> {
    return Commission.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<Commission | null> {
    return Commission.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<Commission | null> {
    return Commission.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<Commission[]> {
    return Commission.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: Commission[]; count: number }> {
    return Commission.findAndCountAll(options);
  }

  public async update(data: Partial<CommissionAttributes>, options: UpdateOptions): Promise<[number, Commission[]]> {
    return Commission.update(data, options) as unknown as Promise<[number, Commission[]]>;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return Commission.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return Commission.count(options);
  }

  public async findById(id: string): Promise<Commission | null> {
    return this.findByPk(id);
  }

  public async findAllPaged(params: CommissionQueryParams): Promise<{ rows: Commission[]; count: number }> {
    const { page, pageSize, promoterId, status, type, startTime, endTime } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (promoterId) {
      where.promoterId = promoterId;
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (type !== undefined) {
      where.type = type;
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

    return this.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Promoter,
          as: 'promoter',
          attributes: ['id', 'name', 'code'],
          required: false,
        },
        {
          model: Channel,
          as: 'channel',
          attributes: ['id', 'name'],
          required: false,
        },
      ],
    });
  }

  public async softDelete(id: string): Promise<number> {
    return this.destroy({ where: { id } });
  }

  public async bulkSoftDelete(ids: string[]): Promise<number> {
    return this.destroy({ where: { id: { [Op.in]: ids } } });
  }

  public async summary(params: Partial<CommissionQueryParams>): Promise<CommissionSummary> {
    const { promoterId, startTime, endTime } = params;
    const where: any = {};

    if (promoterId) {
      where.promoterId = promoterId;
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

    const result = await Commission.findAll({
      attributes: [
        [fn('IFNULL', fn('SUM', col('amount')), 0), 'totalAmount'],
        [fn('IFNULL', fn('SUM', literal('CASE WHEN status = 0 THEN amount ELSE 0 END')), 0), 'pendingAmount'],
        [fn('IFNULL', fn('SUM', literal('CASE WHEN status = 2 THEN amount ELSE 0 END')), 0), 'settledAmount'],
        [fn('IFNULL', fn('SUM', literal('CASE WHEN status = 3 THEN amount ELSE 0 END')), 0), 'withdrawnAmount'],
        [fn('IFNULL', fn('SUM', literal('CASE WHEN status = 4 THEN amount ELSE 0 END')), 0), 'deductedAmount'],
        [fn('COUNT', col('id')), 'totalCount'],
      ],
      where,
      raw: true,
    }) as any;

    return {
      totalAmount: parseFloat(result[0]?.totalAmount || 0),
      pendingAmount: parseFloat(result[0]?.pendingAmount || 0),
      settledAmount: parseFloat(result[0]?.settledAmount || 0),
      withdrawnAmount: parseFloat(result[0]?.withdrawnAmount || 0),
      deductedAmount: parseFloat(result[0]?.deductedAmount || 0),
      totalCount: parseInt(result[0]?.totalCount || 0, 10),
    };
  }

  public async findByOrderId(orderId: string): Promise<Commission[]> {
    return this.findAll({ where: { orderId } });
  }

  public async findByOrderIds(orderIds: string[]): Promise<Commission[]> {
    return this.findAll({ where: { orderId: { [Op.in]: orderIds } } });
  }

  public async bulkUpdate(ids: string[], data: Partial<CommissionAttributes>): Promise<[number, Commission[]]> {
    return this.update(data, { where: { id: { [Op.in]: ids } } });
  }
}

export default new CommissionDao();
