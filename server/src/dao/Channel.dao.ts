import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, Op } from 'sequelize';
import Channel, { ChannelAttributes, ChannelCreationAttributes } from '../models/Channel.model';

interface ChannelQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  type?: string;
  status?: number;
}

class ChannelDao {
  public async create(data: ChannelCreationAttributes, options?: CreateOptions): Promise<Channel> {
    return Channel.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<Channel | null> {
    return Channel.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<Channel | null> {
    return Channel.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<Channel[]> {
    return Channel.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: Channel[]; count: number }> {
    return Channel.findAndCountAll(options);
  }

  public async update(data: Partial<ChannelAttributes>, options: UpdateOptions): Promise<[number, Channel[]]> {
    return Channel.update(data, options) as unknown as Promise<[number, Channel[]]>;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return Channel.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return Channel.count(options);
  }

  public async findById(id: string): Promise<Channel | null> {
    return this.findByPk(id);
  }

  public async findAllPaged(params: ChannelQueryParams): Promise<{ rows: Channel[]; count: number }> {
    const { page, pageSize, keyword, type, status } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (type) {
      where.type = type;
    }
    if (status !== undefined) {
      where.status = status;
    }

    return this.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['sort', 'ASC'], ['createdAt', 'DESC']],
    });
  }

  public async softDelete(id: string): Promise<number> {
    return this.destroy({ where: { id } });
  }

  public async bulkSoftDelete(ids: string[]): Promise<number> {
    return this.destroy({ where: { id: { [Op.in]: ids } } });
  }

  public async existsByCode(code: string): Promise<boolean> {
    const count = await this.count({ where: { code } });
    return count > 0;
  }

  public async existsByCodeAndId(code: string, excludeId: string): Promise<boolean> {
    const count = await this.count({ where: { code, id: { [Op.ne]: excludeId } } });
    return count > 0;
  }
}

export default new ChannelDao();
