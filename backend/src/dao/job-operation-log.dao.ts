import { BaseDao } from './base.dao';
import { JobOperationLog } from '../models';
import JobOperationLogModel from '../models/job-operation-log.model';

class JobOperationLogDao extends BaseDao<JobOperationLogModel> {
  constructor() {
    super(JobOperationLog);
  }

  async findByJobId(jobId: number) {
    return this.findAll({
      where: { jobId },
      order: [['id', 'DESC']],
    });
  }

  async findByJobIds(jobIds: number[]) {
    return this.findAll({
      where: { jobId: jobIds },
      order: [['id', 'DESC']],
    });
  }
}

export default new JobOperationLogDao();
