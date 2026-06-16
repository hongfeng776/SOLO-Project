import { BaseDao } from './base.dao';
import { Job } from '../models';
import JobModel from '../models/job.model';

class JobDao extends BaseDao<JobModel> {
  constructor() {
    super(Job);
  }

  async findWithCompany(options: any = {}) {
    return this.findAndCountAll({
      ...options,
      include: ['company'],
    });
  }
}

export default new JobDao();
