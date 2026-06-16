import { BaseDao } from './base.dao';
import { Resume } from '../models';
import ResumeModel from '../models/resume.model';

class ResumeDao extends BaseDao<ResumeModel> {
  constructor() {
    super(Resume);
  }

  async findWithJob(options: any = {}) {
    return this.findAndCountAll({
      ...options,
      include: ['job'],
    });
  }
}

export default new ResumeDao();
