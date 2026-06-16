import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, Op, fn, col } from 'sequelize';
import Commission, { CommissionAttributes, CommissionCreationAttributes } from '../models/Commission.model';

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

    const [totalResult, pendingResult, settledResult, withdrawnResult, deductedResult, countResult] = await Promise.all([
      Commission.findAll({
        attributes: [[fn('IFNULL', fn('SUM', col('amount')), 0), 'total']],
        where,
        raw: true,
      }) as any,
      Commission.findAll({
        attributes: [[fn('IFNULL', fn('SUM', col('amount')), 0), 'total']],
        where: { ...where, status: 0 },
        raw: true,
      }) as any,
      Commission.findAll({
        attributes: [[fn('IFNULL', fn('SUM', col('amount')), 0), 'total']],
        where: { ...where, status: 2 },
        raw: true,
      }) as any,
      Commission.findAll({
        attributes: [[fn('IFNULL', fn('SUM', col('amount')), 0), 'total']],
        where: { ...where, status: 3 },
        raw: true,
      }) as any,
      Commission.findAll({
        attributes: [[fn('IFNULL', fn('SUM', col('amount')), 0), 'total']],
        where: { ...where, status: 4 },
        raw: true,
      }) as any,
      this.count({ where }),
    ]);

    return {
      totalAmount: parseFloat(totalResult[0]?.total || 0),
      pendingAmount: parseFloat(pendingResult[0]?.total || 0),
      settledAmount: parseFloat(settledResult[0]?.total || 0),
      withdrawnAmount: parseFloat(withdrawnResult[0]?.total || 0),
      deductedAmount: parseFloat(deductedResult[0]?.total || 0),
      totalCount: countResult,
    };
  }

  public async bulkUpdate(ids: string[], data: Partial<CommissionAttributes>): Promise<[number, Commission[]]> {
    return this.update(data, { where: { id: { [Op.in]: ids } } });
  }
}

export default new CommissionDao();
