import { commissionDao, promoterDao } from '../dao';
import { AppError } from '../middleware/error.middleware';
import { BusinessCode } from '../constants/statusCode';
import MoneyUtils from '../utils/money';
import CacheUtils from '../utils/cache';

interface RiskRule {
  name: string;
  code: string;
  enabled: boolean;
  check: (...args: any[]) => Promise<RiskCheckResult>;
}

interface RiskCheckResult {
  passed: boolean;
  rule: string;
  message: string;
  level: 'warn' | 'block';
}

class RiskControlService {
  private rules: RiskRule[] = [];

  constructor() {
    this.initRules();
  }

  private initRules(): void {
    this.rules = [
      {
        name: '单笔佣金金额上限',
        code: 'COMMISSION_AMOUNT_LIMIT',
        enabled: true,
        check: async (amount: number) => {
          const limit = 50000;
          const passed = MoneyUtils.isLess(amount, limit);
          return { passed, rule: this.rules[0].code, message: passed ? '' : `单笔佣金金额不能超过 ¥${MoneyUtils.format(limit)}`, level: 'block' as const };
        },
      },
      {
        name: '推客日佣金频次限制',
        code: 'PROMOTER_DAILY_COMMISSION_LIMIT',
        enabled: true,
        check: async (promoterId: string) => {
          const limit = 100;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const { Op } = await import('sequelize');
          const count = await commissionDao.count({ where: { promoterId, createdAt: { [Op.gte]: today, [Op.lt]: tomorrow } } } as any);
          const passed = count < limit;
          return { passed, rule: this.rules[1].code, message: passed ? '' : `推客当日佣金记录已达 ${count} 笔，超过限制 ${limit} 笔`, level: 'block' as const };
        },
      },
      {
        name: '提现金额与可用佣金校验',
        code: 'WITHDRAW_AMOUNT_CHECK',
        enabled: true,
        check: async (promoterId: string, amount: number) => {
          const promoter = await promoterDao.findById(promoterId);
          if (!promoter) return { passed: false, rule: this.rules[2].code, message: '推客不存在', level: 'block' as const };
          const available = Number(promoter.availableCommission || 0);
          const passed = MoneyUtils.isGreaterOrEqual(available, amount) && MoneyUtils.isGreater(amount, 0);
          return { passed, rule: this.rules[2].code, message: passed ? '' : `提现金额超出可用佣金余额 ¥${MoneyUtils.format(available)}`, level: 'block' as const };
        },
      },
      {
        name: '异常高额订单预警',
        code: 'HIGH_AMOUNT_ORDER_WARN',
        enabled: true,
        check: async (amount: number) => {
          const threshold = 100000;
          const passed = MoneyUtils.isLess(amount, threshold);
          return { passed, rule: this.rules[3].code, message: passed ? '' : `订单金额 ¥${MoneyUtils.format(amount)} 超过预警阈值 ¥${MoneyUtils.format(threshold)}`, level: 'warn' as const };
        },
      },
      {
        name: '短时间频繁操作检测',
        code: 'FREQUENT_OPERATION_CHECK',
        enabled: true,
        check: async (userId: string, action: string) => {
          const key = `risk:freq:${userId}:${action}`;
          const count = await CacheUtils.incr(key, 60);
          const limit = 30;
          const passed = count <= limit;
          return { passed, rule: this.rules[4].code, message: passed ? '' : `操作过于频繁，1分钟内${action}操作已达 ${count} 次`, level: 'block' as const };
        },
      },
    ];
  }

  public async checkRule(ruleCode: string, ...args: any[]): Promise<RiskCheckResult> {
    const rule = this.rules.find(r => r.code === ruleCode);
    if (!rule || !rule.enabled) {
      return { passed: true, rule: ruleCode, message: '', level: 'warn' };
    }
    return rule.check(...args);
  }

  public async checkAll(...args: any[]): Promise<RiskCheckResult[]> {
    const results: RiskCheckResult[] = [];
    for (const rule of this.rules) {
      if (rule.enabled) {
        const result = await rule.check(...args);
        if (!result.passed) {
          results.push(result);
        }
      }
    }
    return results;
  }

  public async checkCommission(amount: number, promoterId: string): Promise<void> {
    const amountCheck = await this.checkRule('COMMISSION_AMOUNT_LIMIT', amount);
    if (!amountCheck.passed && amountCheck.level === 'block') {
      throw new AppError(amountCheck.message, BusinessCode.ERROR);
    }
    const freqCheck = await this.checkRule('PROMOTER_DAILY_COMMISSION_LIMIT', promoterId);
    if (!freqCheck.passed && freqCheck.level === 'block') {
      throw new AppError(freqCheck.message, BusinessCode.ERROR);
    }
  }

  public async checkWithdraw(promoterId: string, amount: number): Promise<void> {
    const check = await this.checkRule('WITHDRAW_AMOUNT_CHECK', promoterId, amount);
    if (!check.passed && check.level === 'block') {
      throw new AppError(check.message, BusinessCode.ERROR);
    }
  }

  public async checkOrder(amount: number): Promise<RiskCheckResult[]> {
    const result = await this.checkRule('HIGH_AMOUNT_ORDER_WARN', amount);
    return result.passed ? [] : [result];
  }

  public getRules(): { name: string; code: string; enabled: boolean }[] {
    return this.rules.map(r => ({ name: r.name, code: r.code, enabled: r.enabled }));
  }
}

export default new RiskControlService();
