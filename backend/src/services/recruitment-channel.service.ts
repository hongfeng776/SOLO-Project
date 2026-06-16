import { Op } from 'sequelize';
import recruitmentChannelDao from '../dao/recruitment-channel.dao';
import { NotFoundError, ConflictError } from '../utils/app-error';
import { IPaginationResult } from '../dao/base.dao';
import RecruitmentChannelModel from '../models/recruitment-channel.model';

class RecruitmentChannelService {
  async getList(params: any): Promise<IPaginationResult<RecruitmentChannelModel>> {
    const { name, type, status, ...rest } = params;
    const where: any = {};

    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }
    if (type) {
      where.type = type;
    }
    if (status !== undefined) {
      where.status = status;
    }

    return recruitmentChannelDao.paginate(rest, {
      where,
      order: [['sort', 'ASC'], ['id', 'DESC']],
    });
  }

  async getById(id: number): Promise<RecruitmentChannelModel | null> {
    const channel = await recruitmentChannelDao.findById(id);
    if (!channel) {
      throw new NotFoundError('招聘渠道不存在');
    }
    return channel;
  }

  async create(data: any): Promise<RecruitmentChannelModel> {
    const existing = await recruitmentChannelDao.findByCode(data.code);
    if (existing) {
      throw new ConflictError('渠道编码已存在');
    }
    return recruitmentChannelDao.create(data);
  }

  async update(id: number, data: any): Promise<[number, RecruitmentChannelModel[]]> {
    await this.getById(id);
    if (data.code) {
      const existing = await recruitmentChannelDao.findByCode(data.code);
      if (existing && existing.id !== id) {
        throw new ConflictError('渠道编码已存在');
      }
    }
    return recruitmentChannelDao.updateById(id, data);
  }

  async remove(id: number): Promise<number> {
    await this.getById(id);
    return recruitmentChannelDao.destroyById(id);
  }

  async batchRemove(ids: number[]): Promise<number> {
    return recruitmentChannelDao.destroy({ where: { id: ids } });
  }

  async getAllEnabled(): Promise<RecruitmentChannelModel[]> {
    return recruitmentChannelDao.findAll({
      where: { status: 1 },
      order: [['sort', 'ASC']],
    });
  }
}

export default new RecruitmentChannelService();
