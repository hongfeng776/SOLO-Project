import { BaseDao } from './base.dao';
import { Interview } from '../models';
import InterviewModel from '../models/interview.model';

class InterviewDao extends BaseDao<InterviewModel> {
  constructor() {
    super(Interview);
  }

  async findWithRelations(options: any = {}) {
    return this.findAndCountAll({
      ...options,
      include: ['resume', 'job'],
    });
  }
}

export default new InterviewDao();
