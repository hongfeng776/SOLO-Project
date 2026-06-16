import { Op } from 'sequelize';
import probationDao from '../dao/probation.dao';
import { NotFoundError, ParamError } from '../utils/app-error';
import { IPaginationResult } from '../dao/base.dao';
import ProbationModel from '../models/probation.model';
import statusFlowEngine from '../utils/status-flow';

class ProbationService {
  async getList(params: any): Promise<IPaginationResult<ProbationModel>> {
    const { status, department, mentor, ...rest } = params;
    const where: any = {};

    if (status) {
      where.status = status;
    }
    if (department) {
      where.department = { [Op.like]: `%${department}%` };
    }
    if (mentor) {
      where.mentor = { [Op.like]: `%${mentor}%` };
    }

    return probationDao.paginate(rest, {
      where,
      order: [['startDate', 'DESC']],
    });
  }

  async getById(id: number): Promise<ProbationModel | null> {
    const probation = await probationDao.findById(id);
    if (!probation) {
      throw new NotFoundError('试用期记录不存在');
    }
    return probation;
  }

  async create(data: any): Promise<ProbationModel> {
    if (!data.startDate || !data.endDate) {
      throw new ParamError('请设置试用期起止日期');
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end <= start) {
      throw new ParamError('结束日期必须晚于开始日期');
    }

    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));

    return probationDao.create({
      ...data,
      duration,
      status: 'probation',
    });
  }

  async update(id: number, data: any): Promise<[number, ProbationModel[]]> {
    await this.getById(id);
    return probationDao.updateById(id, data);
  }

  async remove(id: number): Promise<number> {
    await this.getById(id);
    return probationDao.destroyById(id);
  }

  async startReview(id: number): Promise<[number, ProbationModel[]]> {
    const probation = await this.getById(id);
    if (!probation) throw new NotFoundError('试用期记录不存在');

    statusFlowEngine.validateTransition('probation', probation.status, 'reviewing');

    return probationDao.updateById(id, {
      status: 'reviewing',
      reviewDate: new Date(),
    });
  }

  async passProbation(id: number, reviewComment?: string): Promise<[number, ProbationModel[]]> {
    const probation = await this.getById(id);
    if (!probation) throw new NotFoundError('试用期记录不存在');

    return probationDao.updateById(id, {
      status: 'passed',
      reviewResult: 'passed',
      reviewComment,
      actualEndDate: new Date(),
    });
  }

  async failProbation(id: number, reviewComment?: string): Promise<[number, ProbationModel[]]> {
    const probation = await this.getById(id);
    if (!probation) throw new NotFoundError('试用期记录不存在');

    return probationDao.updateById(id, {
      status: 'failed',
      reviewResult: 'failed',
      reviewComment,
      actualEndDate: new Date(),
    });
  }

  async extendProbation(
    id: number,
    extendDays: number,
    reason?: string
  ): Promise<[number, ProbationModel[]]> {
    const probation = await this.getById(id);
    if (!probation) throw new NotFoundError('试用期记录不存在');

    if (extendDays <= 0 || extendDays > 90) {
      throw new ParamError('延长期限必须在1-90天之间');
    }

    const currentEnd = new Date(probation.endDate);
    const newEnd = new Date(currentEnd.getTime() + extendDays * 24 * 60 * 60 * 1000);

    return probationDao.updateById(id, {
      status: 'extended',
      endDate: newEnd,
      remark: reason ? `${probation.remark || ''} 延长原因：${reason}` : probation.remark,
    });
  }

  async getExpiringSoon(days: number = 7): Promise<ProbationModel[]> {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return probationDao.findAll({
      where: {
        status: { [Op.in]: ['probation', 'extended'] },
        endDate: {
          [Op.between]: [now, future],
        },
      },
      order: [['endDate', 'ASC']],
    });
  }
}

export default new ProbationService();
