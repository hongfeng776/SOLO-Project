import { Op } from 'sequelize';
import { AppError } from '../middlewares/errorHandler';
import { daos } from '../dao';
import { Marketing } from '../models/Marketing';
import { MarketingMutexRule } from '../models/MarketingMutexRule';
import { MarketingDiscountThreshold } from '../models/MarketingDiscountThreshold';

const {
  marketingDao,
  marketingMutexRuleDao,
  marketingDiscountThresholdDao,
  marketingLogDao,
  merchantDao,
  categoryDao,
} = daos;

export interface ValidateResult {
  valid: boolean;
  errors: ValidateError[];
  warnings: ValidateError[];
}

export interface ValidateError {
  field?: string;
  message: string;
  code: string;
}

export interface MarketingValidateParams {
  id?: number;
  name?: string;
  type?: number;
  startTime?: string | Date;
  endTime?: string | Date;
  discountValue?: number;
  discountType?: number;
  minAmount?: number;
  maxDiscount?: number;
  categoryIds?: string;
  merchantIds?: string;
  totalCount?: number;
}

class MarketingValidateService {
  async validateCreate(params: MarketingValidateParams): Promise<ValidateResult> {
    const result: ValidateResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    await this.validateTime(params, result);
    await this.validateDiscount(params, result);
    await this.validateCategories(params, result);
    await this.validateMerchants(params, result);
    await this.validateTimeOverlap(params, result);
    await this.validateMutexRules(params, result);
    await this.validateDuplicateName(params, result);

    result.valid = result.errors.length === 0;
    return result;
  }

  async validateEdit(id: number, params: MarketingValidateParams): Promise<ValidateResult> {
    const result: ValidateResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    const marketing = await marketingDao.findById(id);
    if (!marketing) {
      throw new AppError('营销活动不存在', 404);
    }

    const status = marketing.status ?? 0;

    if (status === 1) {
      this.validateEditRestrictions(marketing, params, result);
    }

    if (status === 2 || status === 3) {
      result.errors.push({
        field: 'status',
        message: '已结束或已下架的活动不可编辑',
        code: 'EDIT_NOT_ALLOWED',
      });
    }

    if (params.startTime || params.endTime) {
      await this.validateTime(params, result);
      await this.validateTimeOverlap({ ...params, id }, result);
    }

    if (params.discountValue !== undefined || params.discountType !== undefined) {
      await this.validateDiscount(params, result);
    }

    if (params.categoryIds !== undefined) {
      await this.validateCategories(params, result);
    }

    if (params.merchantIds !== undefined) {
      await this.validateMerchants(params, result);
    }

    if (params.name !== undefined) {
      await this.validateDuplicateName({ ...params, id }, result);
    }

    await this.validateMutexRules(params, result);

    result.valid = result.errors.length === 0;
    return result;
  }

  private validateEditRestrictions(
    marketing: Marketing,
    params: MarketingValidateParams,
    result: ValidateResult
  ) {
    const changedCoreFields: string[] = [];

    if (params.startTime !== undefined && new Date(params.startTime).getTime() !== marketing.start_time?.getTime()) {
      changedCoreFields.push('startTime');
    }
    if (params.endTime !== undefined && new Date(params.endTime).getTime() !== marketing.end_time?.getTime()) {
      changedCoreFields.push('endTime');
    }
    if (params.discountValue !== undefined && params.discountValue !== marketing.discount_value) {
      changedCoreFields.push('discountValue');
    }
    if (params.discountType !== undefined && params.discountType !== marketing.discount_type) {
      changedCoreFields.push('discountType');
    }
    if (params.minAmount !== undefined && params.minAmount !== marketing.min_amount) {
      changedCoreFields.push('minAmount');
    }
    if (params.maxDiscount !== undefined && params.maxDiscount !== marketing.max_discount) {
      changedCoreFields.push('maxDiscount');
    }

    if (changedCoreFields.length > 0) {
      result.errors.push({
        field: changedCoreFields[0],
        message: '进行中的活动仅可微调非核心规则，禁止修改活动时间与核心优惠',
        code: 'CORE_FIELD_EDIT_NOT_ALLOWED',
      });
    }
  }

  private async validateTime(params: MarketingValidateParams, result: ValidateResult) {
    const { startTime, endTime } = params;

    if (!startTime || !endTime) {
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      result.errors.push({
        field: 'time',
        message: '活动时间格式无效',
        code: 'INVALID_TIME_FORMAT',
      });
      return;
    }

    if (end <= start) {
      result.errors.push({
        field: 'endTime',
        message: '结束时间必须晚于开始时间',
        code: 'END_TIME_BEFORE_START',
      });
    }

    if (end < now) {
      result.errors.push({
        field: 'endTime',
        message: '结束时间不能早于当前时间',
        code: 'END_TIME_IN_PAST',
      });
    }

    const maxDuration = 90 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > maxDuration) {
      result.warnings.push({
        field: 'time',
        message: '活动时长超过90天，请确认是否合理',
        code: 'DURATION_TOO_LONG',
      });
    }
  }

  private async validateDiscount(params: MarketingValidateParams, result: ValidateResult) {
    const { type, discountValue, discountType, maxDiscount, minAmount } = params;

    if (type === undefined || discountValue === undefined) {
      return;
    }

    const thresholds = await marketingDiscountThresholdDao.findAll({
      where: {
        type,
        status: 1,
        category_id: { [Op.is]: null } as any,
      },
    });

    if (thresholds.length === 0) {
      return;
    }

    const threshold = thresholds[0] as MarketingDiscountThreshold;

    if (discountType === 2) {
      if (threshold.max_discount_rate && discountValue > threshold.max_discount_rate) {
        result.errors.push({
          field: 'discountValue',
          message: `折扣率不能超过${threshold.max_discount_rate}%`,
          code: 'DISCOUNT_RATE_EXCEEDED',
        });
      }
      if (threshold.min_discount_rate && discountValue < threshold.min_discount_rate) {
        result.errors.push({
          field: 'discountValue',
          message: `折扣率不能低于${threshold.min_discount_rate}%`,
          code: 'DISCOUNT_RATE_TOO_LOW',
        });
      }
    } else {
      if (threshold.max_discount_amount && (discountValue > threshold.max_discount_amount)) {
        result.errors.push({
          field: 'discountValue',
          message: `优惠金额不能超过${threshold.max_discount_amount}元`,
          code: 'DISCOUNT_AMOUNT_EXCEEDED',
        });
      }
    }

    if (maxDiscount !== undefined && threshold.max_discount_amount && maxDiscount > threshold.max_discount_amount) {
      result.errors.push({
        field: 'maxDiscount',
        message: `最大优惠金额不能超过${threshold.max_discount_amount}元`,
        code: 'MAX_DISCOUNT_EXCEEDED',
      });
    }

    if (minAmount !== undefined && minAmount < 0) {
      result.errors.push({
        field: 'minAmount',
        message: '最低消费金额不能为负数',
        code: 'MIN_AMOUNT_NEGATIVE',
      });
    }

    if (minAmount !== undefined && maxDiscount !== undefined && maxDiscount >= minAmount) {
      result.errors.push({
        field: 'maxDiscount',
        message: '最大优惠金额必须小于最低消费金额',
        code: 'MAX_DISCOUNT_TOO_LARGE',
      });
    }
  }

  private async validateCategories(params: MarketingValidateParams, result: ValidateResult) {
    const { categoryIds } = params;

    if (!categoryIds) {
      return;
    }

    const ids = categoryIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));

    if (ids.length === 0) {
      result.errors.push({
        field: 'categoryIds',
        message: '请选择有效的活动类目',
        code: 'INVALID_CATEGORY',
      });
      return;
    }

    const categories = await categoryDao.findAll({
      where: {
        id: { [Op.in]: ids },
        status: 1,
      },
    });

    if (categories.length !== ids.length) {
      result.errors.push({
        field: 'categoryIds',
        message: '部分类目不存在或已禁用',
        code: 'CATEGORY_NOT_FOUND',
      });
    }
  }

  private async validateMerchants(params: MarketingValidateParams, result: ValidateResult) {
    const { merchantIds } = params;

    if (!merchantIds) {
      return;
    }

    const ids = merchantIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));

    if (ids.length > 0) {
      const merchants = await merchantDao.findAll({
        where: {
          id: { [Op.in]: ids },
          status: 1,
        },
      });

      if (merchants.length !== ids.length) {
        result.errors.push({
          field: 'merchantIds',
          message: '部分商家不存在或已禁用',
          code: 'MERCHANT_NOT_FOUND',
        });
      }

      for (const merchant of merchants) {
        if ((merchant as any).qualification_status !== 1) {
          result.warnings.push({
            field: 'merchantIds',
            message: `商家"${(merchant as any).name}"资质审核未通过`,
            code: 'MERCHANT_QUALIFICATION_FAILED',
          });
        }
      }
    }
  }

  private async validateTimeOverlap(params: MarketingValidateParams, result: ValidateResult) {
    const { startTime, endTime, type, id } = params;

    if (!startTime || !endTime || type === undefined) {
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    const where: any = {
      type,
      status: { [Op.in]: [0, 1] },
      [Op.and]: [
        { start_time: { [Op.lte]: end } },
        { end_time: { [Op.gte]: start } },
      ],
    };

    if (id) {
      where.id = { [Op.ne]: id };
    }

    const overlapping = await marketingDao.findAll({ where });

    if (overlapping.length > 0) {
      const names = overlapping.map(m => `"${(m as Marketing).name}"`).join('、');
      result.warnings.push({
        field: 'time',
        message: `与同类活动${names}时间重叠，请确认是否合理`,
        code: 'TIME_OVERLAP',
      });
    }
  }

  private async validateMutexRules(params: MarketingValidateParams, result: ValidateResult) {
    const { type, startTime, endTime } = params;

    if (type === undefined || !startTime || !endTime) {
      return;
    }

    const mutexRules = await marketingMutexRuleDao.findAll({
      where: {
        [Op.or]: [
          { type, status: 1 },
          { mutex_type: type, status: 1 },
        ],
      },
    });

    if (mutexRules.length === 0) {
      return;
    }

    const mutexTypes = new Set<number>();
    for (const rule of mutexRules as MarketingMutexRule[]) {
      if (rule.type === type) {
        mutexTypes.add(rule.mutex_type);
      } else {
        mutexTypes.add(rule.type);
      }
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    const conflicting = await marketingDao.findAll({
      where: {
        type: { [Op.in]: Array.from(mutexTypes) },
        status: { [Op.in]: [0, 1] },
        [Op.and]: [
          { start_time: { [Op.lte]: end } },
          { end_time: { [Op.gte]: start } },
        ],
      },
    });

    if (conflicting.length > 0) {
      const names = conflicting.map(m => `"${(m as Marketing).name}"`).join('、');
      result.errors.push({
        field: 'type',
        message: `与互斥活动${names}存在时间冲突，同类活动互斥规则不允许同时进行`,
        code: 'MUTEX_RULE_VIOLATION',
      });
    }
  }

  private async validateDuplicateName(params: MarketingValidateParams, result: ValidateResult) {
    const { name, id } = params;

    if (!name) {
      return;
    }

    const where: any = {
      name: { [Op.eq]: name.trim() },
    };

    if (id) {
      where.id = { [Op.ne]: id };
    }

    const existing = await marketingDao.findOne({ where });

    if (existing) {
      result.errors.push({
        field: 'name',
        message: '活动名称已存在，请使用其他名称',
        code: 'DUPLICATE_NAME',
      });
    }
  }

  async getEditPermissions(status: number) {
    const permissions = {
      canEditBasic: false,
      canEditTime: false,
      canEditDiscount: false,
      canEditProducts: false,
      canEditMerchants: false,
      canEditCategories: false,
      canEditStatus: false,
    };

    switch (status) {
      case 0:
        permissions.canEditBasic = true;
        permissions.canEditTime = true;
        permissions.canEditDiscount = true;
        permissions.canEditProducts = true;
        permissions.canEditMerchants = true;
        permissions.canEditCategories = true;
        permissions.canEditStatus = true;
        break;
      case 1:
        permissions.canEditBasic = true;
        permissions.canEditProducts = true;
        permissions.canEditStatus = true;
        break;
      case 2:
      case 3:
        break;
    }

    return permissions;
  }

  logOperation(
    marketingId: number,
    action: string,
    operatorId: number,
    operatorType: number,
    operatorName: string,
    changes: Array<{ field: string; oldValue?: string; newValue?: string }>,
    remark?: string
  ) {
    for (const change of changes) {
      marketingLogDao.create({
        marketing_id: marketingId,
        operator_id: operatorId,
        operator_type: operatorType,
        operator_name: operatorName,
        action,
        field_name: change.field,
        old_value: change.oldValue,
        new_value: change.newValue,
        remark,
      });
    }

    if (changes.length === 0) {
      marketingLogDao.create({
        marketing_id: marketingId,
        operator_id: operatorId,
        operator_type: operatorType,
        operator_name: operatorName,
        action,
        remark,
      });
    }
  }
}

export const marketingValidateService = new MarketingValidateService();
export default MarketingValidateService;
