import { BaseDao } from './base.dao';
import { ProbationOperationLog } from '../models';
import ProbationOperationLogModel from '../models/probation-operation-log.model';
import { ProbationOperationAction } from '../constants/recruitment.enum';
import { FindOptions, Transaction } from 'sequelize';

class ProbationOperationLogDao extends BaseDao<ProbationOperationLogModel> {
  constructor() {
    super(ProbationOperationLog);
  }

  async findByProbationId(probationId: number, options?: FindOptions): Promise<ProbationOperationLogModel[]> {
    return this.findAll({
      where: { probationId },
      order: [['id', 'DESC']],
      ...options,
    });
  }

  async findByAction(action: ProbationOperationAction, options?: FindOptions): Promise<ProbationOperationLogModel[]> {
    return this.findAll({
      where: { action },
      order: [['id', 'DESC']],
      ...options,
    });
  }

  async createLog(data: {
    probationId: number;
    action: ProbationOperationAction;
    operatorId?: number;
    operatorName?: string;
    operatorRole?: string;
    beforeData?: any;
    afterData?: any;
    changedFields?: string[];
    remark?: string;
    ipAddress?: string;
    userAgent?: string;
  }, options?: { transaction?: Transaction }): Promise<ProbationOperationLogModel> {
    const logData: any = {
      probationId: data.probationId,
      action: data.action,
      operatorId: data.operatorId,
      operatorName: data.operatorName,
      operatorRole: data.operatorRole,
      remark: data.remark,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    };

    if (data.beforeData !== undefined) {
      logData.beforeData = data.beforeData;
    }
    if (data.afterData !== undefined) {
      logData.afterData = data.afterData;
    }
    if (data.changedFields !== undefined) {
      logData.changedFields = data.changedFields;
    }

    return this.create(logData, options);
  }
}

export default new ProbationOperationLogDao();
