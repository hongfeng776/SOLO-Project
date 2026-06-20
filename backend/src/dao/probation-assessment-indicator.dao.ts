import { BaseDao } from './base.dao';
import ProbationAssessmentIndicatorModel from '../models/probation-assessment-indicator.model';
import { Transaction, Op } from 'sequelize';

class ProbationAssessmentIndicatorDao extends BaseDao<ProbationAssessmentIndicatorModel> {
  constructor() {
    super(ProbationAssessmentIndicatorModel);
  }

  async findByProbationId(probationId: number) {
    return this.findAll({
      where: { probationId },
      order: [['sortOrder', 'ASC'], ['id', 'ASC']],
    });
  }

  async deleteByProbationId(probationId: number, transaction?: Transaction) {
    return this.destroy({
      where: { probationId },
      transaction,
    });
  }

  async bulkCreateForProbation(
    probationId: number,
    indicators: Array<Partial<ProbationAssessmentIndicatorModel>>,
    transaction?: Transaction
  ) {
    const data = indicators.map((ind, idx) => ({
      ...ind,
      probationId,
      sortOrder: ind.sortOrder ?? idx,
    }));
    return this.bulkCreate(data, transaction ? { transaction } : undefined);
  }

  async findByProbationIds(probationIds: number[]) {
    return this.findAll({
      where: { probationId: { [Op.in]: probationIds } },
      order: [['probationId', 'ASC'], ['sortOrder', 'ASC']],
    });
  }
}

export default new ProbationAssessmentIndicatorDao();
