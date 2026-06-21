import { daos } from '../dao';
import { Op, Transaction, WhereOptions } from 'sequelize';
import sequelize from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { LogisticsProvider, CooperationStatus, LogisticsProviderStatus } from '../models/LogisticsProvider';
import { PageResult } from '../dao/BaseDao';
import {
  logisticsProviderValidateService,
  ValidationResult,
} from './LogisticsProviderValidateService';

export interface LogisticsProviderQueryParams {
  page?: number;
  pageSize?: number;
  provider_code?: string;
  provider_name?: string;
  level?: number;
  status?: number;
  cooperation_status?: number;
  service_province?: string;
  service_city?: string;
  support_cod?: boolean;
  support_cold_chain?: boolean;
  created_start?: string;
  created_end?: string;
  keyword?: string;
}

export interface ProviderCreateData {
  provider_code: string;
  provider_name: string;
  logo?: string;
  level?: number;
  status?: number;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  registered_address?: string;
  credit_code?: string;
  business_license_no?: string;
  legal_person?: string;
  legal_id_card?: string;
  business_license_url?: string;
  license_valid_from?: string;
  license_valid_to?: string;
  road_transport_license_url?: string;
  road_transport_valid_to?: string;
  service_province?: string;
  service_cities?: string;
  branch_count?: number;
  cross_province_timeliness?: number;
  intra_province_timeliness?: number;
  first_weight_fee?: number;
  additional_weight_fee?: number;
  base_service_fee?: number;
  daily_order_limit?: number;
  support_cod?: boolean;
  support_cold_chain?: boolean;
  support_oversized?: boolean;
  support_pickup?: boolean;
  match_priority?: number;
  api_url?: string;
  api_key?: string;
  api_secret?: string;
  qualification_intro?: string;
  remark?: string;
}

export interface ProviderUpdateData extends Partial<ProviderCreateData> {
  cooperation_status?: number;
  cooperation_effective_date?: string;
  cooperation_terminate_date?: string;
}

export interface CoreChangeConfirmData {
  providerId: number;
  changes: Record<string, { before: any; after: any }>;
  reason?: string;
  confirmedBy?: number;
  confirmedByName?: string;
}

export interface EditPermissionResult {
  canEdit: boolean;
  reason?: string;
  needsSecondConfirm?: boolean;
  lockedFields?: string[];
}

class LogisticsProviderService {
  private readonly providerDao = daos.logisticsProviderDao;
  private readonly operationLogDao = daos.logisticsProviderOperationLogDao;
  private readonly feeStandardDao = daos.logisticsFeeStandardDao;
  private readonly feeChangeLogDao = daos.logisticsFeeChangeLogDao;

  buildQueryConditions(params: LogisticsProviderQueryParams): WhereOptions<LogisticsProvider> {
    const where: WhereOptions<LogisticsProvider> = {};

    if (params.provider_code) {
      (where as any).provider_code = { [Op.like]: `%${params.provider_code}%` };
    }
    if (params.provider_name) {
      (where as any).provider_name = { [Op.like]: `%${params.provider_name}%` };
    }
    if (params.level !== undefined) {
      (where as any).level = params.level;
    }
    if (params.status !== undefined) {
      (where as any).status = params.status;
    }
    if (params.cooperation_status !== undefined) {
      (where as any).cooperation_status = params.cooperation_status;
    }
    if (params.service_province) {
      (where as any).service_province = { [Op.like]: `%${params.service_province}%` };
    }
    if (params.service_city) {
      (where as any).service_cities = { [Op.like]: `%${params.service_city}%` };
    }
    if (params.support_cod !== undefined) {
      (where as any).support_cod = params.support_cod;
    }
    if (params.support_cold_chain !== undefined) {
      (where as any).support_cold_chain = params.support_cold_chain;
    }
    if (params.keyword) {
      (where as any)[Op.or] = [
        { provider_code: { [Op.like]: `%${params.keyword}%` } },
        { provider_name: { [Op.like]: `%${params.keyword}%` } },
        { contact_person: { [Op.like]: `%${params.keyword}%` } },
        { contact_phone: { [Op.like]: `%${params.keyword}%` } },
        { credit_code: { [Op.like]: `%${params.keyword}%` } },
      ];
    }
    if (params.created_start || params.created_end) {
      (where as any).created_at = {};
      if (params.created_start) {
        (where as any).created_at[Op.gte] = new Date(params.created_start);
      }
      if (params.created_end) {
        (where as any).created_at[Op.lte] = new Date(params.created_end);
      }
    }

    return where;
  }

  async getProviderList(params: LogisticsProviderQueryParams): Promise<PageResult<LogisticsProvider>> {
    const { page = 1, pageSize = 10, ...queryParams } = params;
    const where = this.buildQueryConditions(queryParams);

    return this.providerDao.findPage({
      page,
      pageSize,
      where,
      order: [
        ['match_priority', 'DESC'],
        ['level', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
  }

  async getProviderDetail(id: number): Promise<LogisticsProvider | null> {
    return this.providerDao.findById(id);
  }

  async getProviderFullInfo(id: number): Promise<any> {
    const provider = await this.providerDao.findById(id);
    if (!provider) return null;

    const qualifications = await daos.logisticsProviderQualificationDao.findAll({
      where: { provider_id: id },
      order: [['created_at', 'DESC']],
    });

    const branches = await daos.logisticsBranchNetworkDao.findAll({
      where: { provider_id: id, status: 1 },
      order: [['province', 'ASC'], ['city', 'ASC']],
    });

    const feeStandards = await this.feeStandardDao.findAll({
      where: { provider_id: id },
      order: [['fee_type', 'ASC'], ['is_default', 'DESC']],
    });

    const contracts = await daos.logisticsSignContractDao.findAll({
      where: { provider_id: id },
      order: [['created_at', 'DESC']],
    });

    return {
      provider,
      qualifications,
      branches,
      feeStandards,
      contracts,
    };
  }

  async validateBeforeCreate(data: ProviderCreateData): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const codeResult = logisticsProviderValidateService.validateProviderCode(data.provider_code);
    if (!codeResult.valid) errors.push(codeResult.message!);

    const codeUnique = await logisticsProviderValidateService.checkProviderCodeUnique(data.provider_code);
    if (!codeUnique.valid) errors.push(codeUnique.message!);

    if (data.credit_code) {
      const r = logisticsProviderValidateService.validateCreditCode(data.credit_code);
      if (!r.valid) errors.push(r.message!);
      const unique = await logisticsProviderValidateService.checkCreditCodeUnique(data.credit_code);
      if (!unique.valid) errors.push(unique.message!);
    }
    if (data.business_license_no) {
      const r = logisticsProviderValidateService.validateBusinessLicenseNo(data.business_license_no);
      if (!r.valid) errors.push(r.message!);
      const unique = await logisticsProviderValidateService.checkBusinessLicenseUnique(data.business_license_no);
      if (!unique.valid) errors.push(unique.message!);
    }
    if (data.contact_phone) {
      const r = logisticsProviderValidateService.validatePhone(data.contact_phone);
      if (!r.valid) errors.push(r.message!);
    }
    if (data.contact_email) {
      const r = logisticsProviderValidateService.validateEmail(data.contact_email);
      if (!r.valid) warnings.push(r.message!);
    }
    if (data.legal_id_card) {
      const r = logisticsProviderValidateService.validateIdCard(data.legal_id_card);
      if (!r.valid) errors.push(r.message!);
    }
    if (data.license_valid_from || data.license_valid_to) {
      const r = logisticsProviderValidateService.validateDateRange(data.license_valid_from, data.license_valid_to);
      if (!r.valid) errors.push(r.message!);
    }

    const duplicate = await logisticsProviderValidateService.checkDuplicateProvider(
      data.credit_code, data.business_license_no, data.provider_name
    );
    if (!duplicate.valid) errors.push(...duplicate.duplicates);

    if (!data.provider_name || data.provider_name.trim().length < 2) {
      errors.push('服务商名称不能为空且至少2个字符');
    }
    if (!data.contact_person) {
      warnings.push('建议填写联系人信息');
    }
    if (data.license_valid_to && logisticsProviderValidateService.isExpired(new Date(data.license_valid_to))) {
      errors.push('营业执照已过期，无法准入');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async createProvider(
    data: ProviderCreateData,
    operatorId?: number,
    operatorName?: string
  ): Promise<LogisticsProvider> {
    const validation = await this.validateBeforeCreate(data);
    if (!validation.valid) {
      throw new AppError(`准入校验失败：${validation.errors.join('；')}`, 400);
    }

    const preCheckResult = await logisticsProviderValidateService.runProviderPreCheck(
      0 as any
    );

    const transaction: Transaction = await sequelize.transaction();
    try {
      const createData: any = {
        ...data,
        created_by: operatorId,
        created_by_name: operatorName,
        updated_by: operatorId,
        updated_by_name: operatorName,
      };

      const provider = await this.providerDao.create(createData, { transaction });

      await this.operationLogDao.create({
        provider_id: provider.id,
        change_type: 'create',
        change_title: `服务商准入：${provider.provider_name}`,
        after_data: { ...data },
        change_detail: `服务商${provider.provider_name}准入成功，编码：${provider.provider_code}`,
        operator_id: operatorId,
        operator_name: operatorName,
      }, { transaction });

      await transaction.commit();
      return provider;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getEditPermission(providerId: number): Promise<EditPermissionResult> {
    const provider = await this.providerDao.findById(providerId);
    if (!provider) {
      return { canEdit: false, reason: '服务商不存在' };
    }

    const cooperationStatus = provider.cooperation_status || 0;
    const lockedFields: string[] = [];
    let needsSecondConfirm = false;

    if (cooperationStatus === CooperationStatus.COOPERATING) {
      const LOCKED = ['provider_code', 'credit_code', 'business_license_no'];
      lockedFields.push(...LOCKED);
      needsSecondConfirm = true;
    } else if (cooperationStatus === CooperationStatus.COOPERATION_SUSPENDED) {
      return { canEdit: false, reason: '合作暂停状态，不可编辑服务商参数', lockedFields };
    } else if (cooperationStatus === CooperationStatus.COOPERATION_TERMINATED) {
      return { canEdit: false, reason: '合作已终止，不可编辑服务商参数', lockedFields };
    }

    if (provider.status === LogisticsProviderStatus.ARCHIVED) {
      return { canEdit: false, reason: '服务商已归档，不可编辑' };
    }

    return {
      canEdit: true,
      needsSecondConfirm,
      lockedFields,
      reason: needsSecondConfirm ? '合作生效状态，核心参数修改需二次确认' : undefined,
    };
  }

  async updateProvider(
    id: number,
    data: ProviderUpdateData,
    operatorId?: number,
    operatorName?: string,
    confirmed?: boolean
  ): Promise<LogisticsProvider> {
    const provider = await this.providerDao.findById(id);
    if (!provider) {
      throw new AppError('服务商不存在', 404);
    }

    const permission = await this.getEditPermission(id);
    if (!permission.canEdit) {
      throw new AppError(permission.reason || '无权编辑', 403);
    }

    for (const field of permission.lockedFields || []) {
      if ((data as any)[field] !== undefined && (data as any)[field] !== (provider as any)[field]) {
        throw new AppError(`字段 ${field} 在当前状态下不可修改`, 400);
      }
    }

    const coreChanges: Record<string, { before: any; after: any }> = {};
    for (const key of Object.keys(data)) {
      if (logisticsProviderValidateService.isCoreField(key)) {
        const before = (provider as any)[key];
        const after = (data as any)[key];
        if (before !== after) {
          coreChanges[key] = { before, after };
        }
      }
    }

    if (Object.keys(coreChanges).length > 0 && permission.needsSecondConfirm && !confirmed) {
      throw new AppError('核心参数修改需二次确认', 428);
    }

    if (data.provider_code) {
      const r = logisticsProviderValidateService.validateProviderCode(data.provider_code);
      if (!r.valid) throw new AppError(r.message!, 400);
      const unique = await logisticsProviderValidateService.checkProviderCodeUnique(data.provider_code, id);
      if (!unique.valid) throw new AppError(unique.message!, 400);
    }
    if (data.credit_code && data.credit_code !== provider.credit_code) {
      const r = logisticsProviderValidateService.validateCreditCode(data.credit_code);
      if (!r.valid) throw new AppError(r.message!, 400);
    }
    if (data.contact_phone) {
      const r = logisticsProviderValidateService.validatePhone(data.contact_phone);
      if (!r.valid) throw new AppError(r.message!, 400);
    }

    const transaction: Transaction = await sequelize.transaction();
    try {
      const oldData = { ...provider.toJSON() };
      const updateData: any = {
        ...data,
        updated_by: operatorId,
        updated_by_name: operatorName,
      };

      const result = await this.providerDao.update(id, updateData, { transaction });

      await this.operationLogDao.create({
        provider_id: id,
        change_type: Object.keys(coreChanges).length > 0 ? 'param_update' : 'update',
        change_title: `更新服务商信息：${provider.provider_name}`,
        before_data: oldData,
        after_data: { ...data },
        change_detail: `更新字段：${Object.keys(data).join('、')}${Object.keys(coreChanges).length > 0 ? '（含核心参数）' : ''}`,
        is_core_change: Object.keys(coreChanges).length > 0,
        confirmed_by: confirmed ? operatorId : undefined,
        confirmed_by_name: confirmed ? operatorName : undefined,
        confirmed_at: confirmed ? new Date() : undefined,
        operator_id: operatorId,
        operator_name: operatorName,
      }, { transaction });

      await this.syncMatchRules(id, transaction, coreChanges);

      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private async syncMatchRules(providerId: number, transaction: Transaction, coreChanges: Record<string, any>): Promise<void> {
    if (Object.keys(coreChanges).length === 0) return;

    const matchRelatedFields = [
      'first_weight_fee', 'additional_weight_fee', 'base_service_fee',
      'cross_province_timeliness', 'intra_province_timeliness',
      'match_priority', 'service_province', 'service_cities',
      'support_cod', 'support_cold_chain', 'support_oversized',
      'daily_order_limit',
    ];

    const hasMatchChanges = Object.keys(coreChanges).some(k => matchRelatedFields.includes(k));
    if (!hasMatchChanges) return;

    const provider = await this.providerDao.findById(providerId);
    if (provider && provider.cooperation_status === CooperationStatus.COOPERATING) {
      await this.operationLogDao.create({
        provider_id: providerId,
        change_type: 'match_rule',
        change_title: '同步更新物流匹配规则',
        change_detail: `核心参数变更触发物流匹配规则同步更新：${Object.keys(coreChanges).filter(k => matchRelatedFields.includes(k)).join('、')}`,
        after_data: { updatedFields: Object.keys(coreChanges) },
        operator_id: (provider as any).updated_by,
        operator_name: (provider as any).updated_by_name,
      }, { transaction });
    }
  }

  async deleteProvider(id: number, operatorId?: number, operatorName?: string): Promise<void> {
    const provider = await this.providerDao.findById(id);
    if (!provider) {
      throw new AppError('服务商不存在', 404);
    }
    if (provider.cooperation_status === CooperationStatus.COOPERATING) {
      throw new AppError('合作生效中的服务商不可删除，请先终止合作', 400);
    }
    if (provider.total_orders && Number(provider.total_orders) > 0) {
      throw new AppError('已有业务合作记录的服务商不可删除，请归档处理', 400);
    }

    const transaction: Transaction = await sequelize.transaction();
    try {
      await this.providerDao.delete(id, { transaction });
      await this.operationLogDao.create({
        provider_id: id,
        change_type: 'delete',
        change_title: `删除服务商：${provider.provider_name}`,
        before_data: { ...provider.toJSON() },
        operator_id: operatorId,
        operator_name: operatorName,
      }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async archiveProvider(id: number, operatorId?: number, operatorName?: string): Promise<LogisticsProvider> {
    const provider = await this.providerDao.findById(id);
    if (!provider) {
      throw new AppError('服务商不存在', 404);
    }
    if (provider.cooperation_status === CooperationStatus.COOPERATING) {
      throw new AppError('合作生效中的服务商不可归档，请先终止合作', 400);
    }

    return this.updateProvider(id, { status: LogisticsProviderStatus.ARCHIVED }, operatorId, operatorName, true);
  }

  async updateStatus(id: number, status: number, reason?: string, operatorId?: number, operatorName?: string): Promise<LogisticsProvider> {
    const provider = await this.providerDao.findById(id);
    if (!provider) {
      throw new AppError('服务商不存在', 404);
    }

    if (status === LogisticsProviderStatus.ENABLED) {
      const preCheck = await logisticsProviderValidateService.runProviderPreCheck(id);
      if (!preCheck.passed) {
        throw new AppError(`启用拦截：${preCheck.blockingIssues.join('；')}`, 400);
      }
    }

    const transaction: Transaction = await sequelize.transaction();
    try {
      const result = await this.providerDao.update(id, {
        status,
        updated_by: operatorId,
        updated_by_name: operatorName,
      }, { transaction });

      await this.operationLogDao.create({
        provider_id: id,
        change_type: 'status_change',
        change_title: `状态变更：${this.getStatusName(status)}`,
        before_data: { status: provider.status },
        after_data: { status },
        change_detail: reason || `服务商状态从${this.getStatusName(provider.status || 0)}变更为${this.getStatusName(status)}`,
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

  async updateCooperationStatus(
    id: number,
    cooperationStatus: number,
    reason?: string,
    effectiveDate?: string,
    operatorId?: number,
    operatorName?: string
  ): Promise<LogisticsProvider> {
    const provider = await this.providerDao.findById(id);
    if (!provider) {
      throw new AppError('服务商不存在', 404);
    }

    const updateData: any = {
      cooperation_status: cooperationStatus,
      updated_by: operatorId,
      updated_by_name: operatorName,
    };

    if (cooperationStatus === CooperationStatus.COOPERATING && effectiveDate) {
      updateData.cooperation_effective_date = new Date(effectiveDate);
      const preCheck = await logisticsProviderValidateService.runProviderPreCheck(id);
      if (!preCheck.passed) {
        throw new AppError(`合作生效拦截：${preCheck.blockingIssues.join('；')}`, 400);
      }
    }
    if (cooperationStatus === CooperationStatus.COOPERATION_TERMINATED) {
      updateData.cooperation_terminate_date = new Date();
    }

    const transaction: Transaction = await sequelize.transaction();
    try {
      const result = await this.providerDao.update(id, updateData, { transaction });

      await this.operationLogDao.create({
        provider_id: id,
        change_type: 'cooperation_status',
        change_title: `合作状态变更：${this.getCooperationStatusName(cooperationStatus)}`,
        before_data: { cooperation_status: provider.cooperation_status },
        after_data: { cooperation_status: cooperationStatus, cooperation_effective_date: updateData.cooperation_effective_date },
        change_detail: reason || `合作状态从${this.getCooperationStatusName(provider.cooperation_status || 0)}变更为${this.getCooperationStatusName(cooperationStatus)}`,
        is_core_change: true,
        confirmed_by: operatorId,
        confirmed_by_name: operatorName,
        confirmed_at: new Date(),
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

  async getStatistics(): Promise<any> {
    const [total, enabled, cooperating, pending, platinum, gold] = await Promise.all([
      this.providerDao.count({}),
      this.providerDao.count({ where: { status: LogisticsProviderStatus.ENABLED } }),
      this.providerDao.count({ where: { cooperation_status: CooperationStatus.COOPERATING } }),
      this.providerDao.count({ where: { status: LogisticsProviderStatus.PENDING_REVIEW } }),
      this.providerDao.count({ where: { level: 5 } }),
      this.providerDao.count({ where: { level: 4 } }),
    ]);

    const expiredCount = await this.providerDao.count({
      where: {
        license_valid_to: { [Op.lt]: new Date() },
      },
    });

    return {
      totalProviders: total,
      enabledProviders: enabled,
      cooperatingProviders: cooperating,
      pendingReview: pending,
      platinumProviders: platinum,
      goldProviders: gold,
      expiredLicenses: expiredCount,
    };
  }

  getStatusName(status: number): string {
    const names: Record<number, string> = {
      0: '已禁用',
      1: '已启用',
      2: '待审核',
      3: '已归档',
    };
    return names[status] || '未知';
  }

  getCooperationStatusName(status: number): string {
    const names: Record<number, string> = {
      0: '未合作',
      1: '合作中',
      2: '合作暂停',
      3: '合作终止',
    };
    return names[status] || '未知';
  }

  getLevelName(level: number): string {
    const names: Record<number, string> = {
      1: '入门级',
      2: '青铜',
      3: '白银',
      4: '黄金',
      5: '铂金',
    };
    return names[level] || '未知';
  }
}

export const logisticsProviderService = new LogisticsProviderService();
export default LogisticsProviderService;
