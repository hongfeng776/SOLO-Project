import { BaseDao } from './base.dao';
import { Probation, Job } from '../models';
import ProbationModel from '../models/probation.model';
import { ProbationStatus, PROBATION_LOCKED_STATUSES, PROBATION_WARNING_DAYS } from '../constants/recruitment.enum';
import { FindOptions, Op, Transaction, Sequelize, QueryTypes } from 'sequelize';
import sequelize from '../config/database';

class ProbationDao extends BaseDao<ProbationModel> {
  constructor() {
    super(Probation);
  }

  async findByOnboardId(onboardId: number, options?: FindOptions): Promise<ProbationModel | null> {
    return this.findOne({
      where: { onboardId },
      ...options,
    });
  }

  async findByEmployeeNo(employeeNo: string, options?: FindOptions): Promise<ProbationModel | null> {
    return this.findOne({
      where: { employeeNo },
      ...options,
    });
  }

  async findExpiringSoon(days: number = PROBATION_WARNING_DAYS, options?: FindOptions): Promise<ProbationModel[]> {
    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(now.getDate() + days);

    return this.findAll({
      where: {
        status: {
          [Op.in]: [ProbationStatus.IN_PROBATION, ProbationStatus.EXPIRING_SOON],
        },
        endDate: {
          [Op.between]: [now, warningDate],
        },
      },
      order: [['endDate', 'ASC']],
      ...options,
    });
  }

  async findInProbation(options?: FindOptions): Promise<ProbationModel[]> {
    return this.findAll({
      where: {
        status: {
          [Op.in]: [ProbationStatus.IN_PROBATION, ProbationStatus.EXPIRING_SOON],
        },
      },
      order: [['startDate', 'DESC']],
      ...options,
    });
  }

  async listByBatch(onboardBatch: string, options?: FindOptions): Promise<ProbationModel[]> {
    return this.findAll({
      where: { onboardBatch },
      order: [['endDate', 'ASC']],
      ...options,
    });
  }

  async listByJobCategory(jobCategory: string, options?: FindOptions): Promise<ProbationModel[]> {
    return this.findAll({
      include: [
        {
          model: Job,
          as: 'job',
          where: { category: jobCategory },
          required: true,
          attributes: [],
        },
      ],
      order: [['startDate', 'DESC']],
      ...options,
    });
  }

  async updateWithVersion(
    id: number,
    data: any,
    currentVersion: number,
    transaction?: Transaction
  ): Promise<[number, ProbationModel[]]> {
    const updateData = { ...data, version: Sequelize.literal('version + 1') as any };
    return this.update(updateData, {
      where: { id, version: currentVersion },
      transaction,
    });
  }

  async countByStatus(): Promise<Record<ProbationStatus, number>> {
    const result: any = {};
    const statuses = Object.values(ProbationStatus);

    for (const status of statuses) {
      result[status] = await this.count({ where: { status } });
    }

    return result as Record<ProbationStatus, number>;
  }

  async getPassRateStats(filters?: {
    department?: string;
    jobCategory?: string;
    onboardBatch?: string;
  }): Promise<{
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    byDepartment: Array<{ department: string; total: number; passed: number; failed: number; passRate: number }>;
    byJobCategory: Array<{ jobCategory: string; total: number; passed: number; failed: number; passRate: number }>;
    byOnboardBatch: Array<{ onboardBatch: string; total: number; passed: number; failed: number; passRate: number }>;
  }> {
    const whereConditions: string[] = ['deleted_at IS NULL'];
    const replacements: Record<string, any> = {
      passed: ProbationStatus.PASSED,
      failed: ProbationStatus.FAILED,
    };

    if (filters?.department) {
      whereConditions.push('department = :department');
      replacements.department = filters.department;
    }
    if (filters?.jobCategory) {
      whereConditions.push('job_category = :jobCategory');
      replacements.jobCategory = filters.jobCategory;
    }
    if (filters?.onboardBatch) {
      whereConditions.push('onboard_batch = :onboardBatch');
      replacements.onboardBatch = filters.onboardBatch;
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const overallSql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = :passed THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN status = :failed THEN 1 ELSE 0 END) as failed
      FROM probation
      ${whereClause}
    `;

    const byDeptSql = `
      SELECT
        department,
        COUNT(*) as total,
        SUM(CASE WHEN status = :passed THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN status = :failed THEN 1 ELSE 0 END) as failed
      FROM probation
      ${whereClause ? whereClause + ' AND' : 'WHERE'} department IS NOT NULL
      GROUP BY department
      ORDER BY department
    `;

    const byJobCatSql = `
      SELECT
        job_category as jobCategory,
        COUNT(*) as total,
        SUM(CASE WHEN status = :passed THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN status = :failed THEN 1 ELSE 0 END) as failed
      FROM probation
      ${whereClause ? whereClause + ' AND' : 'WHERE'} job_category IS NOT NULL
      GROUP BY job_category
      ORDER BY job_category
    `;

    const byBatchSql = `
      SELECT
        onboard_batch as onboardBatch,
        COUNT(*) as total,
        SUM(CASE WHEN status = :passed THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN status = :failed THEN 1 ELSE 0 END) as failed
      FROM probation
      ${whereClause ? whereClause + ' AND' : 'WHERE'} onboard_batch IS NOT NULL
      GROUP BY onboard_batch
      ORDER BY onboard_batch DESC
    `;

    const [overallRaw, byDeptRaw, byJobCatRaw, byBatchRaw] = await Promise.all([
      sequelize.query(overallSql, { replacements, type: QueryTypes.SELECT }),
      sequelize.query(byDeptSql, { replacements, type: QueryTypes.SELECT }),
      sequelize.query(byJobCatSql, { replacements, type: QueryTypes.SELECT }),
      sequelize.query(byBatchSql, { replacements, type: QueryTypes.SELECT }),
    ]);

    const calcRate = (item: any) => ({
      ...item,
      total: Number(item.total),
      passed: Number(item.passed),
      failed: Number(item.failed),
      passRate: Number(item.total) > 0 ? Math.round((Number(item.passed) / Number(item.total)) * 10000) / 100 : 0,
    });

    const overall = (overallRaw as any[])[0] || { total: 0, passed: 0, failed: 0 };
    const overallCalc = calcRate(overall);

    return {
      total: overallCalc.total,
      passed: overallCalc.passed,
      failed: overallCalc.failed,
      passRate: overallCalc.passRate,
      byDepartment: (byDeptRaw as any[]).map(calcRate),
      byJobCategory: (byJobCatRaw as any[]).map(calcRate),
      byOnboardBatch: (byBatchRaw as any[]).map(calcRate),
    };
  }

  async getStatsByDimension(dimension: 'department' | 'jobCategory' | 'onboardBatch'): Promise<any[]> {
    const dimensionFieldMap: Record<string, string> = {
      department: 'department',
      jobCategory: 'job_category',
      onboardBatch: 'onboard_batch',
    };
    const field = dimensionFieldMap[dimension];
    if (!field) return [];

    const sql = `
      SELECT
        ${field} as dimensionValue,
        COUNT(*) as total,
        SUM(CASE WHEN status = :passed THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN status = :failed THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = :inProbation THEN 1 ELSE 0 END) as inProbation,
        SUM(CASE WHEN status = :expiringSoon THEN 1 ELSE 0 END) as expiringSoon
      FROM probation
      WHERE deleted_at IS NULL
      AND ${field} IS NOT NULL
      GROUP BY ${field}
      ORDER BY ${field}
    `;

    const replacements = {
      passed: ProbationStatus.PASSED,
      failed: ProbationStatus.FAILED,
      inProbation: ProbationStatus.IN_PROBATION,
      expiringSoon: ProbationStatus.EXPIRING_SOON,
    };

    const raw = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
    return (raw as any[]).map(item => ({
      dimension: dimension,
      dimensionValue: item.dimensionValue,
      total: Number(item.total),
      passed: Number(item.passed),
      failed: Number(item.failed),
      inProbation: Number(item.inProbation),
      expiringSoon: Number(item.expiringSoon),
      passRate: Number(item.total) > 0 ? Math.round((Number(item.passed) / Number(item.total)) * 10000) / 100 : 0,
    }));
  }

  async findWithAssessmentsAndLogs(id: number, options?: FindOptions): Promise<ProbationModel | null> {
    return this.findById(id, {
      include: [
        { association: 'assessments' },
        { association: 'operationLogs', separate: true, order: [['id', 'DESC']] },
        { association: 'job' },
        { association: 'resume' },
        { association: 'onboard' },
        { association: 'assessorUser' },
        { association: 'hrOperator' },
      ],
      ...options,
    });
  }

  async isEditable(id: number): Promise<boolean> {
    const probation = await this.findById(id);
    if (!probation) return false;
    return !PROBATION_LOCKED_STATUSES.includes(probation.status);
  }

  async findByIds(ids: number[], options?: FindOptions): Promise<ProbationModel[]> {
    return this.findAll({
      where: { id: { [Op.in]: ids } },
      ...options,
    });
  }

  async findByStatus(status: ProbationStatus, options?: FindOptions): Promise<ProbationModel[]> {
    return this.findAll({
      where: { status },
      order: [['endDate', 'ASC']],
      ...options,
    });
  }

  async paginateWithRelations(params: any = {}, options: FindOptions = {}): Promise<any> {
    return this.paginate(params, {
      include: ['job', 'onboard'],
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByDepartment(department: string, options?: FindOptions): Promise<ProbationModel[]> {
    return this.findAll({
      where: { department },
      order: [['endDate', 'ASC']],
      ...options,
    });
  }

  async countByDepartment(department: string, status?: ProbationStatus): Promise<number> {
    const where: any = { department };
    if (status) {
      where.status = status;
    }
    return this.count({ where });
  }
}

export default new ProbationDao();
