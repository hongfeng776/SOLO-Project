import { Op } from 'sequelize';
import { daos } from '../dao';
import { Merchant } from '../models/Merchant';

export const ORDER_FINISH_AGE_LIMIT = 15;
export const BANK_CARD_REGEX = /^([1-9]{1})(\d{15}|\d{18})$/;
export const BANK_NAME_WHITELIST = [
  '工商银行', '农业银行', '中国银行', '建设银行', '交通银行',
  '招商银行', '浦发银行', '兴业银行', '平安银行', '中信银行',
  '民生银行', '光大银行', '华夏银行'
];
export const SETTLE_ALLOW_SHOP_STATUS = [1];
export const AFTERSALE_PENDING_STATUS = [1, 2, 3, 4];

export interface SettleValidateError {
  field: string;
  code: string;
  message: string;
}

export interface SettleValidateResult {
  valid: boolean;
  errors: SettleValidateError[];
  warnings: SettleValidateError[];
}

export interface SettleApplyPayload {
  periodType: number;
  startDate: string;
  endDate: string;
}

class SettleValidateService {
  readonly orderDao = daos.orderDao;
  readonly afterSaleDao = daos.afterSaleDao;
  readonly merchantDao = daos.merchantDao;
  readonly settleApplyOrderDao = daos.settleApplyOrderDao;

  validateShopOperateStatus(merchant: Merchant): { valid: boolean; errors: SettleValidateError[] } {
    const errors: SettleValidateError[] = [];

    if (!merchant) {
      errors.push({
        field: 'merchant',
        code: 'MERCHANT_NOT_FOUND',
        message: '商家不存在',
      });
      return { valid: false, errors };
    }

    const shopStatus = Number(merchant.shop_status || 0);
    if (!SETTLE_ALLOW_SHOP_STATUS.includes(shopStatus)) {
      errors.push({
        field: 'shop_status',
        code: 'SHOP_STATUS_INVALID',
        message: `店铺状态异常（当前：${shopStatus}），仅正常营业店铺可申请结算`,
      });
    }

    const settlementPermission = Number(merchant.settlement_permission || 0);
    if (settlementPermission !== 1) {
      errors.push({
        field: 'settlement_permission',
        code: 'SETTLEMENT_PERMISSION_CLOSED',
        message: '商家结算权限已关闭，请联系平台管理员开通',
      });
    }

    return { valid: errors.length === 0, errors };
  }

  async validateOrderFinishAge(
    merchantId: number,
    periodStart: string,
    periodEnd: string
  ): Promise<{ valid: boolean; expiredCount: number; errors: SettleValidateError[] }> {
    const errors: SettleValidateError[] = [];

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);
    const coolOffEndDate = new Date();
    coolOffEndDate.setDate(coolOffEndDate.getDate() - ORDER_FINISH_AGE_LIMIT);

    const orders = await this.orderDao.findAll({
      where: {
        merchant_id: merchantId,
        status: 3,
        created_at: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
      },
    });

    let expiredCount = 0;
    for (const order of orders) {
      const finishDate = order.signed_at || (order as any).completed_at || order.created_at;
      if (new Date(finishDate) > coolOffEndDate) {
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      errors.push({
        field: 'order_finish_age',
        code: 'ORDERS_IN_COOL_OFF_PERIOD',
        message: `有${expiredCount}个订单未过${ORDER_FINISH_AGE_LIMIT}天冷静期，暂不可结算`,
      });
    }

    return { valid: errors.length === 0, expiredCount, errors };
  }

  async validateAftersaleStatus(merchantId: number): Promise<{ valid: boolean; pendingList: any[]; errors: SettleValidateError[] }> {
    const errors: SettleValidateError[] = [];

    const pendingAfterSales = await this.afterSaleDao.findAll({
      where: {
        merchant_id: merchantId,
        status: { [Op.in]: AFTERSALE_PENDING_STATUS },
      },
      attributes: ['id', 'after_sale_no', 'order_id', 'order_no', 'type', 'status', 'amount'],
    });

    if (pendingAfterSales.length > 0) {
      errors.push({
        field: 'aftersale_status',
        code: 'AFTERSALE_PENDING_EXISTS',
        message: `存在${pendingAfterSales.length}笔未完结售后，请处理完成后再申请结算`,
      });
    }

    return { valid: errors.length === 0, pendingList: pendingAfterSales, errors };
  }

  validateBankCardInfo(merchant: Merchant): { valid: boolean; errors: SettleValidateError[] } {
    const errors: SettleValidateError[] = [];

    if (!merchant) {
      errors.push({
        field: 'merchant',
        code: 'MERCHANT_NOT_FOUND',
        message: '商家不存在',
      });
      return { valid: false, errors };
    }

    const bankVerifyStatus = Number((merchant as any).bank_verify_status || 0);
    if (bankVerifyStatus !== 2) {
      errors.push({
        field: 'bank_verify_status',
        code: 'BANK_NOT_VERIFIED',
        message: '银行卡信息未认证通过，请先完成银行卡认证',
      });
    }

    const bankAccountName = (merchant as any).bank_account_name;
    if (!bankAccountName || String(bankAccountName).trim().length === 0) {
      errors.push({
        field: 'bank_account_name',
        code: 'BANK_ACCOUNT_NAME_EMPTY',
        message: '银行卡开户名为空',
      });
    }

    const bankAccountNo = (merchant as any).bank_account_no;
    if (!bankAccountNo || String(bankAccountNo).trim().length === 0) {
      errors.push({
        field: 'bank_account_no',
        code: 'BANK_ACCOUNT_NO_EMPTY',
        message: '银行卡账号为空',
      });
    } else if (!BANK_CARD_REGEX.test(String(bankAccountNo))) {
      errors.push({
        field: 'bank_account_no',
        code: 'BANK_ACCOUNT_NO_INVALID',
        message: '银行卡账号格式不正确',
      });
    }

    const bankName = (merchant as any).bank_name;
    if (!bankName || String(bankName).trim().length === 0) {
      errors.push({
        field: 'bank_name',
        code: 'BANK_NAME_EMPTY',
        message: '开户银行为空',
      });
    } else {
      const matched = BANK_NAME_WHITELIST.some(bank => String(bankName).includes(bank));
      if (!matched) {
        errors.push({
          field: 'bank_name',
          code: 'BANK_NAME_NOT_WHITELISTED',
          message: `开户行${bankName}不在支持白名单内`,
        });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async validateApplyPeriod(
    periodType: number,
    startDate: string,
    endDate: string
  ): Promise<{ valid: boolean; errors: SettleValidateError[] }> {
    const errors: SettleValidateError[] = [];

    if (!periodType || periodType < 1 || periodType > 4) {
      errors.push({
        field: 'period_type',
        code: 'PERIOD_TYPE_INVALID',
        message: '无效的结算周期类型',
      });
      return { valid: false, errors };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      errors.push({
        field: 'start_date',
        code: 'START_DATE_INVALID',
        message: '开始日期格式不正确',
      });
    }

    if (isNaN(end.getTime())) {
      errors.push({
        field: 'end_date',
        code: 'END_DATE_INVALID',
        message: '结束日期格式不正确',
      });
    }

    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      if (start > end) {
        errors.push({
          field: 'period',
          code: 'PERIOD_DATE_REVERSED',
          message: '开始日期不能晚于结束日期',
        });
      }

      if (periodType === 1) {
        const dayDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff !== 0) {
          errors.push({
            field: 'period',
            code: 'DAILY_PERIOD_INVALID',
            message: '日结周期应为同一天',
          });
        }
      } else if (periodType === 2) {
        const dayDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff < 6 || dayDiff > 7) {
          errors.push({
            field: 'period',
            code: 'WEEKLY_PERIOD_INVALID',
            message: '周结周期应为7天',
          });
        }
      } else if (periodType === 3) {
        const dayDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff < 27 || dayDiff > 31) {
          errors.push({
            field: 'period',
            code: 'MONTHLY_PERIOD_INVALID',
            message: '月结周期应为一个月',
          });
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async interceptDuplicatePeriod(
    merchantId: number,
    periodType: number,
    startDate: string,
    endDate: string
  ): Promise<{ valid: boolean; errors: SettleValidateError[] }> {
    const errors: SettleValidateError[] = [];

    const existingApply = await this.settleApplyOrderDao.findOne({
      where: {
        merchant_id: merchantId,
        settle_period_type: periodType,
        period_start_date: new Date(startDate),
        period_end_date: new Date(endDate),
        apply_status: { [Op.ne]: 3 },
      },
    });

    if (existingApply) {
      errors.push({
        field: 'period',
        code: 'DUPLICATE_PERIOD_APPLY',
        message: `该周期已有结算申请（单号：${existingApply.apply_no}），请勿重复申请`,
      });
    }

    return { valid: errors.length === 0, errors };
  }

  async validateAll(merchant: Merchant, payload: SettleApplyPayload): Promise<SettleValidateResult> {
    const result: SettleValidateResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    const shopStatusResult = this.validateShopOperateStatus(merchant);
    result.errors.push(...shopStatusResult.errors);

    if (merchant && merchant.id) {
      const orderAgeResult = await this.validateOrderFinishAge(
        merchant.id,
        payload.startDate,
        payload.endDate
      );
      result.errors.push(...orderAgeResult.errors);

      const aftersaleResult = await this.validateAftersaleStatus(merchant.id);
      result.errors.push(...aftersaleResult.errors);

      const duplicateResult = await this.interceptDuplicatePeriod(
        merchant.id,
        payload.periodType,
        payload.startDate,
        payload.endDate
      );
      result.errors.push(...duplicateResult.errors);
    }

    const bankCardResult = this.validateBankCardInfo(merchant);
    result.errors.push(...bankCardResult.errors);

    const periodResult = await this.validateApplyPeriod(
      payload.periodType,
      payload.startDate,
      payload.endDate
    );
    result.errors.push(...periodResult.errors);

    result.valid = result.errors.length === 0;

    return result;
  }
}

export const settleValidateService = new SettleValidateService();
export default settleValidateService;
