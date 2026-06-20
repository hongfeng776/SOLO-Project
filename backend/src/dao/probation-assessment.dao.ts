import { BaseDao } from './base.dao';
import { ProbationAssessment } from '../models';
import ProbationAssessmentModel from '../models/probation-assessment.model';
import { FindOptions, Transaction, Op } from 'sequelize';

class ProbationAssessmentDao extends BaseDao<ProbationAssessmentModel> {
  constructor() {
    super(ProbationAssessment);
  }

  async findByProbationId(probationId: number, options?: FindOptions): Promise<ProbationAssessmentModel[]> {
    return this.findAll({
      where: { probationId },
      order: [['id', 'ASC']],
      ...options,
    });
  }

  async bulkCreateOrUpdate(
    probationId: number,
    assessments: Array<{
      id?: number;
      indicatorName: string;
      indicatorWeight: number;
      indicatorDesc?: string;
      targetValue?: string;
      actualValue?: string;
      score?: number;
      evaluatorId?: number;
      evaluatorName?: string;
      evaluationTime?: Date;
      remark?: string;
    }>,
    options?: { transaction?: Transaction }
  ): Promise<ProbationAssessmentModel[]> {
    const result: ProbationAssessmentModel[] = [];

    for (const item of assessments) {
      const data = { ...item, probationId };

      if (data.id) {
        const existing = await this.findById(data.id);
        if (existing) {
          const [, updated] = await this.update(data, {
            where: { id: data.id, probationId },
            transaction: options?.transaction,
          });
          if (updated && updated.length > 0) {
            result.push(updated[0]);
          }
        }
      } else {
        const created = await this.create(data, { transaction: options?.transaction });
        result.push(created);
      }
    }

    return result;
  }

  async deleteByProbationId(probationId: number, options?: { transaction?: Transaction }): Promise<number> {
    return this.destroy({
      where: { probationId },
      transaction: options?.transaction,
    });
  }

  async findByProbationIds(probationIds: number[], options?: FindOptions): Promise<ProbationAssessmentModel[]> {
    return this.findAll({
      where: { probationId: { [Op.in]: probationIds } },
      order: [['probationId', 'ASC'], ['id', 'ASC']],
      ...options,
    });
  }
}

export default new ProbationAssessmentDao();
