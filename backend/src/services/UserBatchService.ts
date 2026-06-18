import { Op } from 'sequelize';
import { User } from '../models/User';
import { AppError } from '../middlewares/errorHandler';
import { daos } from '../dao';
import { USER_STATUS } from './UserValidateService';
import { userStatisticService } from './UserStatisticService';

export interface BatchUpdateTagsPayload {
  ids: number[];
  tags: string;
  mode: 'append' | 'replace' | 'remove';
  scope?: 'global' | 'partial';
  operator_id?: number;
  operator_name?: string;
  operate_ip?: string;
}

export interface BatchFreezePayload {
  ids: number[];
  reason: string;
  scope?: 'global' | 'partial';
  operator_id?: number;
  operator_name?: string;
  operate_ip?: string;
}

export interface BatchResetPermissionsPayload {
  ids: number[];
  permissions: string[];
  scope?: 'global' | 'partial';
  operator_id?: number;
  operator_name?: string;
  operate_ip?: string;
}

export interface BatchResult {
  successCount: number;
  failCount: number;
  failDetails: { id: number; message: string }[];
  updatedUsers: User[];
}

class UserBatchService {
  private userDao = daos.userDao;
  private userProfileDao = daos.userProfileDao;

  async batchUpdateTags(payload: BatchUpdateTagsPayload): Promise<BatchResult> {
    const { ids, tags, mode, scope = 'partial' } = payload;
    const result: BatchResult = {
      successCount: 0,
      failCount: 0,
      failDetails: [],
      updatedUsers: [],
    };

    if (!ids || ids.length === 0) {
      throw new AppError('请选择要操作的用户', 400);
    }

    const users = await this.userDao.findAll({
      where: { id: { [Op.in]: ids } },
    });

    for (const user of users) {
      try {
        if (user.status === USER_STATUS.CANCELED) {
          result.failCount++;
          result.failDetails.push({ id: user.id, message: '注销用户无法修改标签' });
          continue;
        }

        let newTags = user.tags || '';
        const tagArray = newTags ? newTags.split(',').filter(t => t.trim()) : [];

        switch (mode) {
          case 'append':
            const addTags = tags.split(',').filter(t => t.trim());
            for (const tag of addTags) {
              if (!tagArray.includes(tag)) {
                tagArray.push(tag);
              }
            }
            newTags = tagArray.join(',');
            break;
          case 'replace':
            newTags = tags;
            break;
          case 'remove':
            const removeTags = tags.split(',').map(t => t.trim());
            newTags = tagArray.filter(t => !removeTags.includes(t)).join(',');
            break;
        }

        await this.userDao.update(user.id, { tags: newTags } as any);
        await this.recordProfileLog(user.id, 'tags', user.tags, newTags, payload);

        const updatedUser = await this.userDao.findById(user.id);
        if (updatedUser) {
          result.successCount++;
          result.updatedUsers.push(updatedUser);
        }
      } catch (err: any) {
        result.failCount++;
        result.failDetails.push({ id: user.id, message: err.message });
      }
    }

    if (scope === 'global') {
      await userStatisticService.updateStatistics();
    }

    return result;
  }

  async batchFreeze(payload: BatchFreezePayload): Promise<BatchResult> {
    const { ids, reason, scope = 'partial' } = payload;
    const result: BatchResult = {
      successCount: 0,
      failCount: 0,
      failDetails: [],
      updatedUsers: [],
    };

    if (!ids || ids.length === 0) {
      throw new AppError('请选择要冻结的用户', 400);
    }

    const users = await this.userDao.findAll({
      where: { id: { [Op.in]: ids } },
    });

    for (const user of users) {
      try {
        if (user.status === USER_STATUS.CANCELED) {
          result.failCount++;
          result.failDetails.push({ id: user.id, message: '注销用户无法冻结' });
          continue;
        }

        if (user.status === USER_STATUS.FROZEN) {
          result.failCount++;
          result.failDetails.push({ id: user.id, message: '用户已冻结' });
          continue;
        }

        await this.userDao.update(user.id, {
          status: USER_STATUS.FROZEN,
          frozen_time: new Date(),
          frozen_reason: reason || '批量冻结',
        } as any);

        await this.recordProfileLog(user.id, 'status', String(user.status), String(USER_STATUS.FROZEN), payload);
        await this.recordProfileLog(user.id, 'frozen_reason', user.frozen_reason, reason, payload);

        const updatedUser = await this.userDao.findById(user.id);
        if (updatedUser) {
          result.successCount++;
          result.updatedUsers.push(updatedUser);
        }
      } catch (err: any) {
        result.failCount++;
        result.failDetails.push({ id: user.id, message: err.message });
      }
    }

    if (scope === 'global') {
      await userStatisticService.updateStatistics();
    }

    return result;
  }

  async batchUnfreeze(ids: number[], scope: 'global' | 'partial' = 'partial', operator?: { operator_id?: number; operator_name?: string; operate_ip?: string }): Promise<BatchResult> {
    const result: BatchResult = {
      successCount: 0,
      failCount: 0,
      failDetails: [],
      updatedUsers: [],
    };

    if (!ids || ids.length === 0) {
      throw new AppError('请选择要解冻的用户', 400);
    }

    const users = await this.userDao.findAll({
      where: { id: { [Op.in]: ids } },
    });

    for (const user of users) {
      try {
        if (user.status !== USER_STATUS.FROZEN) {
          result.failCount++;
          result.failDetails.push({ id: user.id, message: '用户未冻结' });
          continue;
        }

        await this.userDao.update(user.id, {
          status: USER_STATUS.NORMAL,
          frozen_time: null,
          frozen_reason: null,
        } as any);

        await this.recordProfileLog(user.id, 'status', String(USER_STATUS.FROZEN), String(USER_STATUS.NORMAL), operator || {});

        const updatedUser = await this.userDao.findById(user.id);
        if (updatedUser) {
          result.successCount++;
          result.updatedUsers.push(updatedUser);
        }
      } catch (err: any) {
        result.failCount++;
        result.failDetails.push({ id: user.id, message: err.message });
      }
    }

    if (scope === 'global') {
      await userStatisticService.updateStatistics();
    }

    return result;
  }

  async batchResetPermissions(payload: BatchResetPermissionsPayload): Promise<BatchResult> {
    const { ids, scope = 'partial' } = payload;
    const result: BatchResult = {
      successCount: 0,
      failCount: 0,
      failDetails: [],
      updatedUsers: [],
    };

    if (!ids || ids.length === 0) {
      throw new AppError('请选择要操作的用户', 400);
    }

    const users = await this.userDao.findAll({
      where: { id: { [Op.in]: ids } },
    });

    for (const user of users) {
      try {
        if (user.status === USER_STATUS.CANCELED) {
          result.failCount++;
          result.failDetails.push({ id: user.id, message: '注销用户无法重置权限' });
          continue;
        }

        await this.userDao.update(user.id, {
          level: 1,
          credit_level: 3,
          credit_score: 100,
          risk_warning: 0,
          risk_level: 0,
        } as any);

        await this.recordProfileLog(user.id, 'level', String(user.level), '1', payload);
        await this.recordProfileLog(user.id, 'credit_level', String(user.credit_level), '3', payload);
        await this.recordProfileLog(user.id, 'credit_score', String(user.credit_score), '100', payload);
        await this.recordProfileLog(user.id, 'risk_warning', String(user.risk_warning), '0', payload);

        const updatedUser = await this.userDao.findById(user.id);
        if (updatedUser) {
          result.successCount++;
          result.updatedUsers.push(updatedUser);
        }
      } catch (err: any) {
        result.failCount++;
        result.failDetails.push({ id: user.id, message: err.message });
      }
    }

    if (scope === 'global') {
      await userStatisticService.updateStatistics();
    }

    return result;
  }

  async batchUpdateStatus(ids: number[], status: number, scope: 'global' | 'partial' = 'partial', operator?: { operator_id?: number; operator_name?: string; operate_ip?: string }): Promise<BatchResult> {
    const result: BatchResult = {
      successCount: 0,
      failCount: 0,
      failDetails: [],
      updatedUsers: [],
    };

    if (!ids || ids.length === 0) {
      throw new AppError('请选择要操作的用户', 400);
    }

    if (![USER_STATUS.NORMAL, USER_STATUS.FROZEN, USER_STATUS.CANCELED].includes(status)) {
      throw new AppError('状态值无效', 400);
    }

    const users = await this.userDao.findAll({
      where: { id: { [Op.in]: ids } },
    });

    for (const user of users) {
      try {
        if (user.status === USER_STATUS.CANCELED && status !== USER_STATUS.CANCELED) {
          result.failCount++;
          result.failDetails.push({ id: user.id, message: '注销用户无法恢复' });
          continue;
        }

        const updateData: any = { status };
        if (status === USER_STATUS.FROZEN) {
          updateData.frozen_time = new Date();
          updateData.frozen_reason = '批量冻结';
        } else if (status === USER_STATUS.CANCELED) {
          updateData.cancel_time = new Date();
        }

        await this.userDao.update(user.id, updateData);
        await this.recordProfileLog(user.id, 'status', String(user.status), String(status), operator || {});

        const updatedUser = await this.userDao.findById(user.id);
        if (updatedUser) {
          result.successCount++;
          result.updatedUsers.push(updatedUser);
        }
      } catch (err: any) {
        result.failCount++;
        result.failDetails.push({ id: user.id, message: err.message });
      }
    }

    if (scope === 'global') {
      await userStatisticService.updateStatistics();
    }

    return result;
  }

  private async recordProfileLog(
    userId: number,
    fieldName: string,
    oldValue: string | undefined,
    newValue: string,
    payload: { operator_id?: number; operator_name?: string; operate_ip?: string }
  ) {
    return this.userProfileDao.create({
      user_id: userId,
      field_name: fieldName,
      old_value: oldValue,
      new_value: newValue,
      operator_id: payload.operator_id,
      operator_name: payload.operator_name,
      operate_ip: payload.operate_ip,
    });
  }
}

export const userBatchService = new UserBatchService();
export default UserBatchService;
