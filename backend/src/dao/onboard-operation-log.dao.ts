import { BaseDao } from './base.dao';
import { OnboardOperationLog } from '../models';
import OnboardOperationLogModel from '../models/onboard-operation-log.model';
import { OnboardOperationAction } from '../constants/recruitment.enum';
import { FindOptions, Op } from 'sequelize';

class OnboardOperationLogDao extends BaseDao<OnboardOperationLogModel> {
  constructor() {
    super(OnboardOperationLog);
  }

  async findByOnboardId(onboardId: number, options?: FindOptions): Promise<OnboardOperationLogModel[]> {
    return this.findAll({
      where: { onboardId },
      order: [['id', 'DESC']],
      ...options,
    });
  }

  async findByOnboardIds(onboardIds: number[], options?: FindOptions): Promise<OnboardOperationLogModel[]> {
    return this.findAll({
      where: { onboardId: { [Op.in]: onboardIds } },
      order: [['id', 'DESC']],
      ...options,
    });
  }

  async findByAction(action: OnboardOperationAction, options?: FindOptions): Promise<OnboardOperationLogModel[]> {
    return this.findAll({
      where: { action },
      order: [['id', 'DESC']],
      ...options,
    });
  }

  async findByOperatorId(operatorId: number, options?: FindOptions): Promise<OnboardOperationLogModel[]> {
    return this.findAll({
      where: { operatorId },
      order: [['id', 'DESC']],
      ...options,
    });
  }

  async paginateByOnboardId(onboardId: number, params: any = {}, options: FindOptions = {}): Promise<any> {
    return this.paginate(params, {
      where: { onboardId },
      order: [['id', 'DESC']],
      ...options,
    });
  }

  async createLog(data: {
    onboardId: number;
    action: OnboardOperationAction;
    operatorId?: number;
    operatorName?: string;
    operatorRole?: string;
    beforeData?: any;
    afterData?: any;
    changedFields?: string[];
    remark?: string;
    ipAddress?: string;
    userAgent?: string;
  }, options?: any): Promise<OnboardOperationLogModel> {
    const logData: any = {
      onboardId: data.onboardId,
      action: data.action,
      operatorId: data.operatorId,
      operatorName: data.operatorName,
      operatorRole: data.operatorRole,
      remark: data.remark,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    };

    if (data.beforeData !== undefined) {
      logData.beforeData = typeof data.beforeData === 'string' ? data.beforeData : JSON.stringify(data.beforeData);
    }
    if (data.afterData !== undefined) {
      logData.afterData = typeof data.afterData === 'string' ? data.afterData : JSON.stringify(data.afterData);
    }
    if (data.changedFields !== undefined) {
      logData.changedFields = typeof data.changedFields === 'string' ? data.changedFields : JSON.stringify(data.changedFields);
    }

    return this.create(logData, options);
  }
}

export default new OnboardOperationLogDao();
