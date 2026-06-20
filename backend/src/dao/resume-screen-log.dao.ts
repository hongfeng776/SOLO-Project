import { BaseDao } from './base.dao';
import { ResumeScreenLog } from '../models';
import ResumeScreenLogModel from '../models/resume-screen-log.model';

class ResumeScreenLogDao extends BaseDao<ResumeScreenLogModel> {
  constructor() {
    super(ResumeScreenLog);
  }

  async findByResumeId(resumeId: number) {
    return this.findAll({
      where: { resumeId },
      order: [['id', 'DESC']],
    });
  }

  async findByJobId(jobId: number) {
    return this.findAll({
      where: { jobId },
      order: [['id', 'DESC']],
    });
  }

  async findDuplicateScreen(resumeId: number, action: string, conditions: string) {
    return this.findOne({
      where: {
        resumeId,
        action,
        screenConditions: conditions,
        isDuplicateScreen: false,
      },
      order: [['id', 'DESC']],
    });
  }

  async createLog(data: Partial<ResumeScreenLogModel>) {
    return this.create(data);
  }
}

export default new ResumeScreenLogDao();
