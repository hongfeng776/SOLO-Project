import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, Op } from 'sequelize';
import Withdraw, { WithdrawAttributes, WithdrawCreationAttributes } from '../models/Withdraw.model';

interface WithdrawQueryParams {
  page: number;
  pageSize: number;
  promoterId?: string;
  status?: number;
}

class WithdrawDao {
  public async create(data: WithdrawCreationAttributes, options?: CreateOptions): Promise<Withdraw> {
    return Withdraw.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<Withdraw | null> {
    return Withdraw.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<Withdraw | null> {
    return Withdraw.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<Withdraw[]> {
    return Withdraw.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: Withdraw[]; count: number }> {
    return Withdraw.findAndCountAll(options);
  }

  public async update(data: Partial<WithdrawAttributes>, options: UpdateOptions): Promise<[number, Withdraw[]]> {
    return Withdraw.update(data, options) as unknown as Promise<[number, Withdraw[]]>;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return Withdraw.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return Withdraw.count(options);
  }

  public async findById(id: string): Promise<Withdraw | null> {
    return this.findByPk(id);
  }

  public async findAllPaged(params: WithdrawQueryParams): Promise<{ rows: Withdraw[]; count: number }> {
    const { page, pageSize, promoterId, status } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (promoterId) {
      where.promoterId = promoterId;
    }
    if (status !== undefined) {
      where.status = status;
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

  public async findByWithdrawNo(withdrawNo: string): Promise<Withdraw | null> {
    return this.findOne({ where: { withdrawNo } });
  }

  public async existsByWithdrawNo(withdrawNo: string): Promise<boolean> {
    const count = await this.count({ where: { withdrawNo } });
    return count > 0;
  }
}

export default new WithdrawDao();
