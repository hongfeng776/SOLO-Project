import { BaseDao } from './base.dao';
import { Onboard } from '../models';
import OnboardModel from '../models/onboard.model';

class OnboardDao extends BaseDao<OnboardModel> {
  constructor() {
    super(Onboard);
  }

  async findWithRelations(options: any = {}) {
    return this.findAndCountAll({
      ...options,
      include: ['resume', 'job'],
    });
  }
}

export default new OnboardDao();
