import onboardDao from '../dao/onboard.dao';
import { NotFoundError } from '../utils/app-error';
import { IPaginationResult } from '../dao/base.dao';
import OnboardModel from '../models/onboard.model';
import { OnboardStatus } from '../constants/recruitment.enum';

class OnboardService {
  async getList(params: any): Promise<IPaginationResult<OnboardModel>> {
    const { resumeId, jobId, status, ...rest } = params;
    const where: any = {};

    if (resumeId) {
      where.resumeId = resumeId;
    }
    if (jobId) {
      where.jobId = jobId;
    }
    if (status) {
      where.status = status;
    }

    return onboardDao.paginate(rest, {
      where,
      include: ['resume', 'job'],
      order: [['expectOnboardDate', 'DESC']],
    });
  }

  async getById(id: number): Promise<OnboardModel | null> {
    const onboard = await onboardDao.findById(id, { include: ['resume', 'job'] });
    if (!onboard) {
      throw new NotFoundError('入职记录不存在');
    }
    return onboard;
  }

  async create(data: any): Promise<OnboardModel> {
    return onboardDao.create(data);
  }

  async update(id: number, data: any): Promise<[number, OnboardModel[]]> {
    await this.getById(id);
    return onboardDao.updateById(id, data);
  }

  async remove(id: number): Promise<number> {
    await this.getById(id);
    return onboardDao.destroyById(id);
  }

  async confirm(id: number): Promise<[number, OnboardModel[]]> {
    await this.getById(id);
    return onboardDao.updateById(id, { status: OnboardStatus.CONFIRMED });
  }

  async markOnboarded(id: number): Promise<[number, OnboardModel[]]> {
    await this.getById(id);
    return onboardDao.updateById(id, { status: OnboardStatus.ONBOARDED, actualOnboardDate: new Date() });
  }

  async cancel(id: number): Promise<[number, OnboardModel[]]> {
    await this.getById(id);
    return onboardDao.updateById(id, { status: OnboardStatus.CANCELLED });
  }
}

export default new OnboardService();
