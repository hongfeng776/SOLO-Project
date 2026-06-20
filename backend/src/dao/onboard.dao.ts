import { BaseDao } from './base.dao';
import { Onboard } from '../models';
import OnboardModel from '../models/onboard.model';
import { OnboardStatus, ONBOARD_LOCKED_STATUSES } from '../constants/recruitment.enum';
import { FindOptions, Op, Transaction, Sequelize } from 'sequelize';

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

  async paginateWithRelations(params: any = {}, options: FindOptions = {}): Promise<any> {
    return this.paginate(params, {
      include: ['resume', 'job'],
      order: [['expectOnboardDate', 'DESC']],
      ...options,
    });
  }

  async findByResumeId(resumeId: number, options?: FindOptions): Promise<OnboardModel | null> {
    return this.findOne({
      where: { resumeId },
      ...options,
    });
  }

  async findByResumeIdPhone(resumeId: number, phone: string, options?: FindOptions): Promise<OnboardModel | null> {
    return this.findOne({
      where: {
        [Op.or]: [
          { resumeId },
          { phone },
        ],
      },
      ...options,
    });
  }

  async checkDuplicate(
    resumeId?: number,
    phone?: string,
    idCard?: string,
    excludeId?: number
  ): Promise<OnboardModel | null> {
    const where: any = {
      [Op.or]: [],
    };

    if (resumeId) {
      (where[Op.or] as any[]).push({ resumeId });
    }
    if (phone) {
      (where[Op.or] as any[]).push({ phone });
    }
    if (idCard) {
      (where[Op.or] as any[]).push({ idCard });
    }

    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    if ((where[Op.or] as any[]).length === 0) {
      return null;
    }

    return this.findOne({ where });
  }

  async findByDateRangeJob(
    jobId: number,
    startDate: Date,
    endDate: Date,
    dateField: 'expectOnboardDate' | 'onboardDate' | 'actualOnboardDate' = 'expectOnboardDate',
    statuses?: OnboardStatus[]
  ): Promise<OnboardModel[]> {
    const where: any = {
      jobId,
      [dateField]: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (statuses && statuses.length > 0) {
      where.status = { [Op.in]: statuses };
    }

    return this.findAll({ where, order: [[dateField, 'ASC']] });
  }

  async findByJobId(jobId: number, options?: FindOptions): Promise<OnboardModel[]> {
    return this.findAll({
      where: { jobId },
      order: [['expectOnboardDate', 'DESC']],
      ...options,
    });
  }

  async findByHrOperatorId(hrOperatorId: number, options?: FindOptions): Promise<OnboardModel[]> {
    return this.findAll({
      where: { hrOperatorId },
      order: [['expectOnboardDate', 'DESC']],
      ...options,
    });
  }

  async findByStatus(status: OnboardStatus, options?: FindOptions): Promise<OnboardModel[]> {
    return this.findAll({
      where: { status },
      order: [['expectOnboardDate', 'DESC']],
      ...options,
    });
  }

  async findByIds(ids: number[], options?: FindOptions): Promise<OnboardModel[]> {
    return this.findAll({
      where: { id: { [Op.in]: ids } },
      ...options,
    });
  }

  async isEditable(id: number): Promise<boolean> {
    const onboard = await this.findById(id);
    if (!onboard) return false;
    return !ONBOARD_LOCKED_STATUSES.includes(onboard.status);
  }

  async incrementVersion(id: number, transaction?: Transaction): Promise<[number, OnboardModel[]]> {
    return this.update(
      { version: Sequelize.literal('version + 1') as any },
      { where: { id }, transaction }
    );
  }

  async updateWithVersion(
    id: number,
    data: any,
    currentVersion: number,
    transaction?: Transaction
  ): Promise<[number, OnboardModel[]]> {
    return this.update(data, {
      where: { id, version: currentVersion },
      transaction,
    });
  }

  async findWithOperationLogs(id: number, options?: FindOptions): Promise<OnboardModel | null> {
    return this.findById(id, {
      include: ['resume', 'job', 'operationLogs', 'ledger', 'hrOperator', 'auditUser'],
      ...options,
    });
  }

  async findWithLedger(id: number, options?: FindOptions): Promise<OnboardModel | null> {
    return this.findById(id, {
      include: ['ledger', 'resume', 'job'],
      ...options,
    });
  }

  async findPendingAudit(options?: FindOptions): Promise<OnboardModel[]> {
    return this.findAll({
      where: { status: OnboardStatus.PENDING_AUDIT },
      include: ['resume', 'job'],
      order: [['submitTime', 'ASC']],
      ...options,
    });
  }

  async findAuditPassed(options?: FindOptions): Promise<OnboardModel[]> {
    return this.findAll({
      where: { status: OnboardStatus.AUDIT_PASSED },
      include: ['resume', 'job'],
      order: [['auditTime', 'DESC']],
      ...options,
    });
  }

  async countByJobIdAndStatus(jobId: number, status: OnboardStatus): Promise<number> {
    return this.count({ where: { jobId, status } });
  }

  async countInProgressByJobId(jobId: number): Promise<number> {
    return this.count({
      where: {
        jobId,
        status: {
          [Op.in]: [OnboardStatus.PENDING_AUDIT, OnboardStatus.AUDIT_PASSED, OnboardStatus.AUDIT_REJECTED],
        },
      },
    });
  }

  async countCompletedByJobId(jobId: number): Promise<number> {
    return this.count({
      where: {
        jobId,
        status: OnboardStatus.ONBOARDED,
      },
    });
  }

  async findAllWithDetails(params: any = {}): Promise<any> {
    return this.paginateWithRelations(params, {
      include: [
      ],
    });
  }
}

export default new OnboardDao();
