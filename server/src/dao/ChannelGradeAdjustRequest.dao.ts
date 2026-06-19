import { FindOptions, CreateOptions, Op } from 'sequelize';
import ChannelGradeAdjustRequest, { ChannelGradeAdjustRequestAttributes, ChannelGradeAdjustRequestCreationAttributes } from '../models/ChannelGradeAdjustRequest.model';
import { ChannelLevelAdjustStatus, ChannelLevel } from '../constants/enum';

class ChannelGradeAdjustRequestDao {
  public async create(data: ChannelGradeAdjustRequestCreationAttributes, options?: CreateOptions): Promise<ChannelGradeAdjustRequest> {
    return ChannelGradeAdjustRequest.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<ChannelGradeAdjustRequest | null> {
    return ChannelGradeAdjustRequest.findByPk(id, options);
  }

  public async findAllPaged(params: {
    page: number;
    pageSize: number;
    channelId?: string;
    applicantId?: string;
    fromLevel?: ChannelLevel;
    toLevel?: ChannelLevel;
    approveStatus?: ChannelLevelAdjustStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<{ rows: ChannelGradeAdjustRequest[]; count: number }> {
    const { page, pageSize, channelId, applicantId, fromLevel, toLevel, approveStatus, startDate, endDate } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (channelId) {
      where.channelId = channelId;
    }
    if (applicantId) {
      where.applicantId = applicantId;
    }
    if (fromLevel) {
      where.fromLevel = fromLevel;
    }
    if (toLevel) {
      where.toLevel = toLevel;
    }
    if (approveStatus !== undefined) {
      where.approveStatus = approveStatus;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    return ChannelGradeAdjustRequest.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
    });
  }

  public async findByChannelId(channelId: string, options?: FindOptions): Promise<ChannelGradeAdjustRequest[]> {
    return ChannelGradeAdjustRequest.findAll({
      ...options,
      where: {
        ...(options?.where || {}),
        channelId,
      },
      order: [['createdAt', 'DESC']],
    });
  }

  public async update(id: string, data: Partial<ChannelGradeAdjustRequestAttributes>): Promise<[number, ChannelGradeAdjustRequest[]]> {
    return ChannelGradeAdjustRequest.update(data, {
      where: { id },
      returning: true,
    });
  }

  public async delete(id: string): Promise<number> {
    return ChannelGradeAdjustRequest.destroy({
      where: { id },
    });
  }
}

export default new ChannelGradeAdjustRequestDao();
