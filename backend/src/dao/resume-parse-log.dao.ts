import { BaseDao } from './base.dao';
import { ResumeParseLog } from '../models';
import ResumeParseLogModel from '../models/resume-parse-log.model';

class ResumeParseLogDao extends BaseDao<ResumeParseLogModel> {
  constructor() {
    super(ResumeParseLog);
  }

  async findByResumeId(resumeId: number) {
    return this.findAll({
      where: { resumeId },
      order: [['id', 'DESC']],
    });
  }

  async getLatestByResumeId(resumeId: number) {
    return this.findOne({
      where: { resumeId },
      order: [['id', 'DESC']],
    });
  }

  async createLog(data: Partial<ResumeParseLogModel>) {
    return this.create(data);
  }
}

export default new ResumeParseLogDao();
