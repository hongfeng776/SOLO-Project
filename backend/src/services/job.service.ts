import { Op } from 'sequelize';
import jobDao from '../dao/job.dao';
import { NotFoundError } from '../utils/app-error';
import { IPaginationResult } from '../dao/base.dao';
import JobModel from '../models/job.model';
import { JobStatus } from '../constants/recruitment.enum';

class JobService {
  async getList(params: any): Promise<IPaginationResult<JobModel>> {
    const { title, status, companyId, ...rest } = params;
    const where: any = {};

    if (title) {
      where.title = { [Op.like]: `%${title}%` };
    }
    if (status) {
      where.status = status;
    }
    if (companyId) {
      where.companyId = companyId;
    }

    return jobDao.paginate(rest, {
      where,
      include: ['company'],
      order: [['sort', 'ASC'], ['id', 'DESC']],
    });
  }

  async getById(id: number): Promise<JobModel | null> {
    const job = await jobDao.findById(id, { include: ['company'] });
    if (!job) {
      throw new NotFoundError('岗位不存在');
    }
    return job;
  }

  async create(data: any): Promise<JobModel> {
    return jobDao.create(data);
  }

  async update(id: number, data: any): Promise<[number, JobModel[]]> {
    await this.getById(id);
    return jobDao.updateById(id, data);
  }

  async remove(id: number): Promise<number> {
    await this.getById(id);
    return jobDao.destroyById(id);
  }

  async batchRemove(ids: number[]): Promise<number> {
    return jobDao.destroy({ where: { id: ids } });
  }

  async publish(id: number): Promise<[number, JobModel[]]> {
    await this.getById(id);
    return jobDao.updateById(id, { status: JobStatus.PUBLISHED, publishTime: new Date() });
  }

  async close(id: number): Promise<[number, JobModel[]]> {
    await this.getById(id);
    return jobDao.updateById(id, { status: JobStatus.CLOSED });
  }
}

export default new JobService();
