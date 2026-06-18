import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, Op } from 'sequelize';
import ChannelQualification, { ChannelQualificationAttributes, ChannelQualificationCreationAttributes } from '../models/ChannelQualification.model';

class ChannelQualificationDao {
  public async create(data: ChannelQualificationCreationAttributes, options?: CreateOptions): Promise<ChannelQualification> {
    return ChannelQualification.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<ChannelQualification | null> {
    return ChannelQualification.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<ChannelQualification | null> {
    return ChannelQualification.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<ChannelQualification[]> {
    return ChannelQualification.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: ChannelQualification[]; count: number }> {
    return ChannelQualification.findAndCountAll(options);
  }

  public async update(data: Partial<ChannelQualificationAttributes>, options: UpdateOptions): Promise<[number, ChannelQualification[]]> {
    return ChannelQualification.update(data, options) as unknown as Promise<[number, ChannelQualification[]]>;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return ChannelQualification.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return ChannelQualification.count(options);
  }

  public async findByChannelAuditId(channelAuditId: string): Promise<ChannelQualification[]> {
    return this.findAll({
      where: { channelAuditId },
      order: [['createdAt', 'DESC']],
    });
  }
}

export default new ChannelQualificationDao();
