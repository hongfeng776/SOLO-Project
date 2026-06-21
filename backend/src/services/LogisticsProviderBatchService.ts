import { daos } from '../dao';
import { Op, Transaction, WhereOptions } from 'sequelize';
import sequelize from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { LogisticsProvider, CooperationStatus, LogisticsProviderStatus } from '../models/LogisticsProvider';
import { PageResult } from '../dao/BaseDao';
import { logisticsProviderValidateService } from './LogisticsProviderValidateService';
import { LogisticsProviderQueryParams } from './LogisticsProviderService';

export interface BatchOperationResult {
  success: boolean;
  total: number;
  successCount: number;
  failCount: number;
  successIds: number[];
  failItems: Array<{ id: number; reason: string }>;
  messages?: string[];
}

export interface BatchFeeUpdateData {
  first_weight_fee?: number;
  additional_weight_fee?: number;
  base_service_fee?: number;
  reason?: string;
}

class LogisticsProviderBatchService {
  private readonly providerDao = daos.logisticsProviderDao;
  private readonly operationLogDao = daos.logisticsProviderOperationLogDao;
  private readonly feeStandardDao = daos.logisticsFeeStandardDao;
  private readonly feeChangeLogDao = daos.logisticsFeeChangeLogDao;

  async getIdsByQuery(params: LogisticsProviderQueryParams): Promise<{ ids: number[]; count: number }> {
    const { page, pageSize, ...queryParams } = params;
    const where: WhereOptions<LogisticsProvider> = {};

    if (queryParams.provider_code) {
      (where as any).provider_code = { [Op.like]: `%${queryParams.provider_code}%` };
    }
    if (queryParams.provider_name) {
      (where as any).provider_name = { [Op.like]: `%${queryParams.provider_name}%` };
    }
    if (queryParams.level !== undefined) {
      (where as any).level = queryParams.level;
    }
    if (queryParams.status !== undefined) {
      (where as any).status = queryParams.status;
    }
    if (queryParams.cooperation_status !== undefined) {
      (where as any).cooperation_status = queryParams.cooperation_status;
    }
    if (queryParams.service_province) {
      (where as any).service_province = { [Op.like]: `%${queryParams.service_province}%` };
    }
    if (queryParams.service_city) {
      (where as any).service_cities = { [Op.like]: `%${queryParams.service_city}%` };
    }
    if (queryParams.support_cod !== undefined) {
      (where as any).support_cod = queryParams.support_cod;
    }
    if (queryParams.support_cold_chain !== undefined) {
      (where as any).support_cold_chain = queryParams.support_cold_chain;
    }
    if (queryParams.keyword) {
      (where as any)[Op.or] = [
        { provider_code: { [Op.like]: `%${queryParams.keyword}%` } },
        { provider_name: { [Op.like]: `%${queryParams.keyword}%` } },
        { contact_person: { [Op.like]: `%${queryParams.keyword}%` } },
      ];
    }

    const result = await this.providerDao.findAndCountAll({
      where,
      attributes: ['id'],
    });

    return {
      ids: result.rows.map(r => r.id),
      count: result.count,
    };
  }

  async batchEnable(
    ids: number[],
    operatorId?: number,
    operatorName?: string
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: true,
      total: ids.length,
      successCount: 0,
      failCount: 0,
      successIds: [],
      failItems: [],
    };

    const transaction: Transaction = await sequelize.transaction();
    try {
      for (const id of ids) {
        try {
          const provider = await this.providerDao.findById(id);
          if (!provider) {
            result.failCount++;
            result.failItems.push({ id, reason: '服务商不存在' });
            continue;
          }
          if (provider.cooperation_status === CooperationStatus.COOPERATION_TERMINATED) {
            result.failCount++;
            result.failItems.push({ id, reason: '合作已终止，不可启用' });
            continue;
          }

          const preCheck = await logisticsProviderValidateService.runProviderPreCheck(id);
          if (!preCheck.passed) {
            result.failCount++;
            result.failItems.push({ id, reason: `启用拦截：${preCheck.blockingIssues[0] || '前置校验不通过'}` });
            continue;
          }

          await this.providerDao.update(id, {
            status: LogisticsProviderStatus.ENABLED,
            updated_by: operatorId,
            updated_by_name: operatorName,
          }, { transaction });

          result.successCount++;
          result.successIds.push(id);
        } catch (error) {
          result.failCount++;
          result.failItems.push({
            id,
            reason: error instanceof Error ? error.message : '未知错误',
          });
        }
      }

      await this.operationLogDao.create({
        provider_id: ids[0] || 0,
        change_type: 'status_change',
        change_title: `批量启用服务商（${result.successCount}/${result.total}）`,
        after_data: { ids, status: LogisticsProviderStatus.ENABLED },
        change_detail: `批量启用${result.successCount}个服务商，失败${result.failCount}个`,
        operator_id: operatorId,
        operator_name: operatorName,
      }, { transaction });

      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async batchDisable(
    ids: number[],
    reason?: string,
    operatorId?: number,
    operatorName?: string
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: true,
      total: ids.length,
      successCount: 0,
      failCount: 0,
      successIds: [],
      failItems: [],
    };

    const transaction: Transaction = await sequelize.transaction();
    try {
      for (const id of ids) {
        try {
          const provider = await this.providerDao.findById(id);
          if (!provider) {
            result.failCount++;
            result.failItems.push({ id, reason: '服务商不存在' });
            continue;
          }

          await this.providerDao.update(id, {
            status: LogisticsProviderStatus.DISABLED,
            updated_by: operatorId,
            updated_by_name: operatorName,
          }, { transaction });

          result.successCount++;
          result.successIds.push(id);
        } catch (error) {
          result.failCount++;
          result.failItems.push({
            id,
            reason: error instanceof Error ? error.message : '未知错误',
          });
        }
      }

      await this.operationLogDao.create({
        provider_id: ids[0] || 0,
        change_type: 'status_change',
        change_title: `批量禁用服务商（${result.successCount}/${result.total}）`,
        after_data: { ids, status: LogisticsProviderStatus.DISABLED, reason },
        change_detail: reason || `批量禁用${result.successCount}个服务商，失败${result.failCount}个`,
        operator_id: operatorId,
        operator_name: operatorName,
      }, { transaction });

      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async batchUpdateFees(
    ids: number[],
    feeData: BatchFeeUpdateData,
    operatorId?: number,
    operatorName?: string,
    confirmed?: boolean
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: true,
      total: ids.length,
      successCount: 0,
      failCount: 0,
      successIds: [],
      failItems: [],
    };

    const hasChanges = feeData.first_weight_fee !== undefined
      || feeData.additional_weight_fee !== undefined
      || feeData.base_service_fee !== undefined;

    if (!hasChanges) {
      result.success = false;
      result.messages = ['没有需要更新的资费字段'];
      return result;
    }

    const transaction: Transaction = await sequelize.transaction();
    try {
      for (const id of ids) {
        try {
          const provider = await this.providerDao.findById(id);
          if (!provider) {
            result.failCount++;
            result.failItems.push({ id, reason: '服务商不存在' });
            continue;
          }
          if (provider.cooperation_status === CooperationStatus.COOPERATION_SUSPENDED
            || provider.cooperation_status === CooperationStatus.COOPERATION_TERMINATED) {
            result.failCount++;
            result.failItems.push({ id, reason: '当前合作状态不可修改资费' });
            continue;
          }
          if (provider.cooperation_status === CooperationStatus.COOPERATING && !confirmed) {
            result.failCount++;
            result.failItems.push({ id, reason: '合作生效中服务商资费修改需二次确认' });
            continue;
          }

          const complianceCheck = await logisticsProviderValidateService.checkFeeCompliance(id, feeData);
          if (!complianceCheck.valid) {
            result.failCount++;
            result.failItems.push({ id, reason: complianceCheck.violations[0] });
            continue;
          }

          const updateData: any = {
            updated_by: operatorId,
            updated_by_name: operatorName,
          };
          const beforeData: any = {};
          const afterData: any = {};

          if (feeData.first_weight_fee !== undefined) {
            updateData.first_weight_fee = feeData.first_weight_fee;
            beforeData.first_weight_fee = provider.first_weight_fee;
            afterData.first_weight_fee = feeData.first_weight_fee;
          }
          if (feeData.additional_weight_fee !== undefined) {
            updateData.additional_weight_fee = feeData.additional_weight_fee;
            beforeData.additional_weight_fee = provider.additional_weight_fee;
            afterData.additional_weight_fee = feeData.additional_weight_fee;
          }
          if (feeData.base_service_fee !== undefined) {
            updateData.base_service_fee = feeData.base_service_fee;
            beforeData.base_service_fee = provider.base_service_fee;
            afterData.base_service_fee = feeData.base_service_fee;
          }

          await this.providerDao.update(id, updateData, { transaction });

          await this.feeChangeLogDao.create({
            provider_id: id,
            change_type: 'update',
            fee_name: '服务商资费批量更新',
            before_data: beforeData,
            after_data: afterData,
            change_reason: feeData.reason || '批量更新资费',
            is_violation: complianceCheck.warnings.length > 0,
            violation_remark: complianceCheck.warnings.join('；'),
            operator_id: operatorId,
            operator_name: operatorName,
            confirmed_by: confirmed ? operatorId : undefined,
            confirmed_by_name: confirmed ? operatorName : undefined,
            confirmed_at: confirmed ? new Date() : undefined,
          }, { transaction });

          result.successCount++;
          result.successIds.push(id);
        } catch (error) {
          result.failCount++;
          result.failItems.push({
            id,
            reason: error instanceof Error ? error.message : '未知错误',
          });
        }
      }

      await this.operationLogDao.create({
        provider_id: ids[0] || 0,
        change_type: 'param_update',
        change_title: `批量更新资费（${result.successCount}/${result.total}）`,
        after_data: { ids, feeData },
        change_detail: feeData.reason || `批量更新${result.successCount}个服务商资费，失败${result.failCount}个`,
        is_core_change: true,
        confirmed_by: confirmed ? operatorId : undefined,
        confirmed_by_name: confirmed ? operatorName : undefined,
        confirmed_at: confirmed ? new Date() : undefined,
        operator_id: operatorId,
        operator_name: operatorName,
      }, { transaction });

      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async batchAdjustPriority(
    ids: number[],
    adjustType: 'increase' | 'decrease' | 'set',
    value: number,
    operatorId?: number,
    operatorName?: string
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: true,
      total: ids.length,
      successCount: 0,
      failCount: 0,
      successIds: [],
      failItems: [],
    };

    const transaction: Transaction = await sequelize.transaction();
    try {
      for (const id of ids) {
        try {
          const provider = await this.providerDao.findById(id);
          if (!provider) {
            result.failCount++;
            result.failItems.push({ id, reason: '服务商不存在' });
            continue;
          }

          let newPriority = value;
          if (adjustType === 'increase') {
            newPriority = Number(provider.match_priority || 0) + value;
          } else if (adjustType === 'decrease') {
            newPriority = Math.max(0, Number(provider.match_priority || 0) - value);
          }

          newPriority = Math.max(0, Math.min(1000, newPriority));

          await this.providerDao.update(id, {
            match_priority: newPriority,
            updated_by: operatorId,
            updated_by_name: operatorName,
          }, { transaction });

          result.successCount++;
          result.successIds.push(id);
        } catch (error) {
          result.failCount++;
          result.failItems.push({
            id,
            reason: error instanceof Error ? error.message : '未知错误',
          });
        }
      }

      await this.operationLogDao.create({
        provider_id: ids[0] || 0,
        change_type: 'match_rule',
        change_title: `批量调整优先级（${result.successCount}/${result.total}）`,
        after_data: { ids, adjustType, value },
        change_detail: `批量${adjustType === 'increase' ? '提升' : adjustType === 'decrease' ? '降低' : '设置'}优先级，${result.successCount}个成功，失败${result.failCount}个`,
        operator_id: operatorId,
        operator_name: operatorName,
      }, { transaction });

      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async batchUpdateLevel(
    ids: number[],
    level: number,
    operatorId?: number,
    operatorName?: string
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: true,
      total: ids.length,
      successCount: 0,
      failCount: 0,
      successIds: [],
      failItems: [],
    };

    const transaction: Transaction = await sequelize.transaction();
    try {
      for (const id of ids) {
        try {
          const provider = await this.providerDao.findById(id);
          if (!provider) {
            result.failCount++;
            result.failItems.push({ id, reason: '服务商不存在' });
            continue;
          }

          await this.providerDao.update(id, {
            level,
            updated_by: operatorId,
            updated_by_name: operatorName,
          }, { transaction });

          result.successCount++;
          result.successIds.push(id);
        } catch (error) {
          result.failCount++;
          result.failItems.push({
            id,
            reason: error instanceof Error ? error.message : '未知错误',
          });
        }
      }

      await this.operationLogDao.create({
        provider_id: ids[0] || 0,
        change_type: 'level_change',
        change_title: `批量调整服务商等级（${result.successCount}/${result.total}）`,
        after_data: { ids, level },
        change_detail: `批量调整${result.successCount}个服务商等级至L${level}，失败${result.failCount}个`,
        operator_id: operatorId,
        operator_name: operatorName,
      }, { transaction });

      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getRefreshListData(ids: number[]): Promise<any[]> {
    if (ids.length === 0) return [];

    const providers = await this.providerDao.findAll({
      where: { id: { [Op.in]: ids } },
      order: [
        ['match_priority', 'DESC'],
        ['level', 'DESC'],
      ],
    });

    return providers.map(p => p.toJSON());
  }
}

export const logisticsProviderBatchService = new LogisticsProviderBatchService();
export default LogisticsProviderBatchService;
