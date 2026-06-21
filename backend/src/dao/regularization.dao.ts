import { BaseDao } from './base.dao';
import { Regularization, Probation, Onboard, Job, Resume, OnboardLedger } from '../models';
import RegularizationModel from '../models/regularization.model';
import {
  RegularizationStatus,
  REGULARIZATION_PREREQUISITE_DAYS,
} from '../constants/recruitment.enum';
import { FindOptions, Op, Transaction, Sequelize, QueryTypes } from 'sequelize';
import sequelize from '../config/database';

class RegularizationDao extends BaseDao<RegularizationModel> {
  constructor() {
    super(Regularization);
  }

  async findByProbationId(probationId: number, options?: FindOptions): Promise<RegularizationModel | null> {
    return this.findOne({
      where: { probationId },
      ...options,
    });
  }

  async findActiveByProbationId(probationId: number): Promise<RegularizationModel | null> {
    return this.findOne({
      where: {
        probationId,
        status: { [Op.in]: [RegularizationStatus.IN_APPROVAL, RegularizationStatus.PENDING_APPLY] },
      },
    });
  }

  async hasActiveRegularization(probationId: number): Promise<boolean> {
    const count = await this.count({
      where: {
        probationId,
        status: RegularizationStatus.IN_APPROVAL,
      },
    });
    return count > 0;
  }

  async updateWithVersion(
    id: number,
    data: any,
    currentVersion: number,
    transaction?: Transaction
  ): Promise<[number, RegularizationModel[]]> {
    const updateData = { ...data, version: Sequelize.literal('version + 1') as any };
    return this.update(updateData, {
      where: { id, version: currentVersion },
      transaction,
    });
  }

  async findByStatus(status: RegularizationStatus, options?: FindOptions): Promise<RegularizationModel[]> {
    return this.findAll({
      where: { status },
      order: [['applyDate', 'DESC']],
      ...options,
    });
  }

  async findByIds(ids: number[], options?: FindOptions): Promise<RegularizationModel[]> {
    return this.findAll({
      where: { id: { [Op.in]: ids } },
      ...options,
    });
  }

  async findPendingApplyList(options?: FindOptions): Promise<RegularizationModel[]> {
    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(now.getDate() + REGULARIZATION_PREREQUISITE_DAYS);

    return this.findAll({
      where: {
        status: RegularizationStatus.PENDING_APPLY,
      },
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async paginateWithRelations(params: any = {}, options: FindOptions = {}): Promise<any> {
    return this.paginate(params, {
      include: [
        { association: 'probation', required: false },
        { association: 'onboard', required: false },
        { association: 'job', required: false },
        { association: 'resume', required: false },
      ],
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findDetailById(id: number): Promise<RegularizationModel | null> {
    return this.findById(id, {
      include: [
        { association: 'probation', required: false },
        { association: 'onboard', required: false },
        { association: 'job', required: false },
        { association: 'resume', required: false },
        { association: 'ledger', required: false },
        {
          association: 'approvalNodes',
          order: [['nodeIndex', 'ASC']],
        },
        {
          association: 'operationLogs',
          order: [['created_at', 'DESC']],
        },
      ],
    });
  }

  async getPassRateStats(filters?: {
    department?: string;
    jobCategory?: string;
    onboardBatch?: string;
    recruiterHrId?: number;
  }): Promise<{
    overall: { total: number; approved: number; rejected: number; passRate: number };
    byDepartment: any[];
    byJobCategory: any[];
    byOnboardBatch: any[];
    byRecruiter: any[];
    fitGradeDistribution: { grade: string; count: number }[];
  }> {
    const whereConditions: string[] = ['r.deleted_at IS NULL'];
    const replacements: Record<string, any> = {
      approved: RegularizationStatus.APPROVED,
      rejected: RegularizationStatus.REJECTED,
    };

    if (filters?.department) {
      whereConditions.push('r.department = :department');
      replacements.department = filters.department;
    }
    if (filters?.jobCategory) {
      whereConditions.push('r.job_category = :jobCategory');
      replacements.jobCategory = filters.jobCategory;
    }
    if (filters?.onboardBatch) {
      whereConditions.push('r.onboard_batch = :onboardBatch');
      replacements.onboardBatch = filters.onboardBatch;
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const overallSql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN r.status = :approved THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN r.status = :rejected THEN 1 ELSE 0 END) as rejected
      FROM regularization r
      ${whereClause}
    `;

    const byDeptSql = `
      SELECT
        r.department,
        COUNT(*) as total,
        SUM(CASE WHEN r.status = :approved THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN r.status = :rejected THEN 1 ELSE 0 END) as rejected
      FROM regularization r
      ${whereClause ? whereClause + ' AND' : 'WHERE'} r.department IS NOT NULL
      GROUP BY r.department
      ORDER BY r.department
    `;

    const byJobCatSql = `
      SELECT
        r.job_category as jobCategory,
        COUNT(*) as total,
        SUM(CASE WHEN r.status = :approved THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN r.status = :rejected THEN 1 ELSE 0 END) as rejected
      FROM regularization r
      ${whereClause ? whereClause + ' AND' : 'WHERE'} r.job_category IS NOT NULL
      GROUP BY r.job_category
      ORDER BY r.job_category
    `;

    const byBatchSql = `
      SELECT
        r.onboard_batch as onboardBatch,
        COUNT(*) as total,
        SUM(CASE WHEN r.status = :approved THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN r.status = :rejected THEN 1 ELSE 0 END) as rejected
      FROM regularization r
      ${whereClause ? whereClause + ' AND' : 'WHERE'} r.onboard_batch IS NOT NULL
      GROUP BY r.onboard_batch
      ORDER BY r.onboard_batch DESC
    `;

    const byRecruiterSql = `
      SELECT
        r.hr_operator_id as hrOperatorId,
        r.hr_operator_name as hrOperatorName,
        COUNT(*) as total,
        SUM(CASE WHEN r.status = :approved THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN r.status = :rejected THEN 1 ELSE 0 END) as rejected
      FROM regularization r
      ${whereClause ? whereClause + ' AND' : 'WHERE'} r.hr_operator_id IS NOT NULL
      GROUP BY r.hr_operator_id, r.hr_operator_name
      ORDER BY total DESC
    `;

    const fitGradeSql = `
      SELECT
        r.recruitment_fit_grade as grade,
        COUNT(*) as count
      FROM regularization r
      ${whereClause ? whereClause + ' AND' : 'WHERE'} r.recruitment_fit_grade IS NOT NULL
      GROUP BY r.recruitment_fit_grade
      ORDER BY r.recruitment_fit_grade
    `;

    const [overallRaw, byDeptRaw, byJobCatRaw, byBatchRaw, byRecruiterRaw, fitGradeRaw] =
      await Promise.all([
        sequelize.query(overallSql, { replacements, type: QueryTypes.SELECT }),
        sequelize.query(byDeptSql, { replacements, type: QueryTypes.SELECT }),
        sequelize.query(byJobCatSql, { replacements, type: QueryTypes.SELECT }),
        sequelize.query(byBatchSql, { replacements, type: QueryTypes.SELECT }),
        sequelize.query(byRecruiterSql, { replacements, type: QueryTypes.SELECT }),
        sequelize.query(fitGradeSql, { replacements, type: QueryTypes.SELECT }),
      ]);

    const calcRate = (item: any) => ({
      ...item,
      total: Number(item.total),
      approved: Number(item.approved),
      rejected: Number(item.rejected),
      passRate:
        Number(item.total) > 0
          ? Math.round((Number(item.approved) / Number(item.total)) * 10000) / 100
          : 0,
    });

    const overall = (overallRaw as any[])[0] || { total: 0, approved: 0, rejected: 0 };
    const overallCalc = calcRate(overall);

    return {
      overall: overallCalc,
      byDepartment: (byDeptRaw as any[]).map(calcRate),
      byJobCategory: (byJobCatRaw as any[]).map(calcRate),
      byOnboardBatch: (byBatchRaw as any[]).map(calcRate),
      byRecruiter: (byRecruiterRaw as any[]).map(calcRate),
      fitGradeDistribution: (fitGradeRaw as any[]).map((g: any) => ({
        grade: g.grade,
        count: Number(g.count),
      })),
    };
  }

  async countByStatus(): Promise<Record<RegularizationStatus, number>> {
    const result: any = {};
    const statuses = Object.values(RegularizationStatus);

    for (const status of statuses) {
      result[status] = await this.count({ where: { status } });
    }

    return result as Record<RegularizationStatus, number>;
  }
}

export default new RegularizationDao();
