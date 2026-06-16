import { Op } from 'sequelize';
import resumeDao from '../dao/resume.dao';
import { NotFoundError } from '../utils/app-error';
import { IPaginationResult } from '../dao/base.dao';
import ResumeModel from '../models/resume.model';
import { ResumeStatus } from '../constants/recruitment.enum';

class ResumeService {
  async getList(params: any): Promise<IPaginationResult<ResumeModel>> {
    const { name, status, jobId, ...rest } = params;
    const where: any = {};

    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }
    if (status) {
      where.status = status;
    }
    if (jobId) {
      where.jobId = jobId;
    }

    return resumeDao.paginate(rest, {
      where,
      include: ['job'],
      order: [['id', 'DESC']],
    });
  }

  async getById(id: number): Promise<ResumeModel | null> {
    const resume = await resumeDao.findById(id, { include: ['job'] });
    if (!resume) {
      throw new NotFoundError('简历不存在');
    }
    return resume;
  }

  async create(data: any): Promise<ResumeModel> {
    return resumeDao.create(data);
  }

  async update(id: number, data: any): Promise<[number, ResumeModel[]]> {
    await this.getById(id);
    return resumeDao.updateById(id, data);
  }

  async remove(id: number): Promise<number> {
    await this.getById(id);
    return resumeDao.destroyById(id);
  }

  async batchRemove(ids: number[]): Promise<number> {
    return resumeDao.destroy({ where: { id: ids } });
  }

  async updateStatus(id: number, status: ResumeStatus): Promise<[number, ResumeModel[]]> {
    await this.getById(id);
    return resumeDao.updateById(id, { status });
  }
}

export default new ResumeService();
