import { BaseDao } from './base.dao';
import ProbationModel from '../models/probation.model';

class ProbationDao extends BaseDao<ProbationModel> {
  constructor() {
    super(ProbationModel);
  }

  async findByOnboardId(onboardId: number) {
    return this.findOne({ where: { onboardId } });
  }
}

export default new ProbationDao();
