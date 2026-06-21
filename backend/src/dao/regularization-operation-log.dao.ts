import { BaseDao } from './base.dao';
import { RegularizationOperationLog } from '../models';
import RegularizationOperationLogModel from '../models/regularization-operation-log.model';
import { RegularizationOperationAction } from '../constants/recruitment.enum';
import { FindOptions, Transaction } from 'sequelize';

class RegularizationOperationLogDao extends BaseDao<RegularizationOperationLogModel> {
  constructor() {
    super(RegularizationOperationLog);
  }

  async findByRegularizationId(
    regularizationId: number,
    options?: FindOptions
  ): Promise<RegularizationOperationLogModel[]> {
    return this.findAll({
      where: { regularizationId },
      order: [['id', 'DESC']],
      ...options,
    });
  }

  async findByAction(
    action: RegularizationOperationAction,
    options?: FindOptions
  ): Promise<RegularizationOperationLogModel[]> {
    return this.findAll({
      where: { action },
      order: [['id', 'DESC']],
      ...options,
    });
  }

  async createLog(
    data: {
      regularizationId: number;
      action: RegularizationOperationAction;
      operatorId?: number;
      operatorName?: string;
      operatorRole?: string;
      beforeData?: any;
      afterData?: any;
      changedFields?: string[];
      remark?: string;
      ipAddress?: string;
      userAgent?: string;
    },
    options?: { transaction?: Transaction }
  ): Promise<RegularizationOperationLogModel> {
    const logData: any = {
      regularizationId: data.regularizationId,
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

export default new RegularizationOperationLogDao();
