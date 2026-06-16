import interviewDao from '../dao/interview.dao';
import { NotFoundError } from '../utils/app-error';
import { IPaginationResult } from '../dao/base.dao';
import InterviewModel from '../models/interview.model';

class InterviewService {
  async getList(params: any): Promise<IPaginationResult<InterviewModel>> {
    const { resumeId, jobId, stage, result, ...rest } = params;
    const where: any = {};

    if (resumeId) {
      where.resumeId = resumeId;
    }
    if (jobId) {
      where.jobId = jobId;
    }
    if (stage) {
      where.stage = stage;
    }
    if (result) {
      where.result = result;
    }

    return interviewDao.paginate(rest, {
      where,
      include: ['resume', 'job'],
      order: [['interviewTime', 'DESC']],
    });
  }

  async getById(id: number): Promise<InterviewModel | null> {
    const interview = await interviewDao.findById(id, { include: ['resume', 'job'] });
    if (!interview) {
      throw new NotFoundError('面试记录不存在');
    }
    return interview;
  }

  async create(data: any): Promise<InterviewModel> {
    return interviewDao.create(data);
  }

  async update(id: number, data: any): Promise<[number, InterviewModel[]]> {
    await this.getById(id);
    return interviewDao.updateById(id, data);
  }

  async remove(id: number): Promise<number> {
    await this.getById(id);
    return interviewDao.destroyById(id);
  }

  async batchRemove(ids: number[]): Promise<number> {
    return interviewDao.destroy({ where: { id: ids } });
  }
}

export default new InterviewService();
