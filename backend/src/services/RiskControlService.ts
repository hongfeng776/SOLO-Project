import { Op, WhereOptions } from 'sequelize';
import { daos } from '../dao';
import { RiskControl } from '../models/RiskControl';
import { RiskAlert } from '../models/RiskAlert';
import { AppError } from '../middlewares/errorHandler';
import { PageResult } from '../types';
import { messageService } from './MessageService';

export interface RiskControlQueryParams {
  page?: number;
  pageSize?: number;
  name?: string;
  type?: number;
  status?: number;
}

export interface RiskControlCreatePayload {
  name: string;
  type: number;
  condition_json: object;
  action: string;
  threshold?: number;
  status?: number;
}

export interface RiskControlUpdatePayload {
  name?: string;
  type?: number;
  condition_json?: object;
  action?: string;
  threshold?: number;
  status?: number;
}

export interface RiskAlertQueryParams {
  page?: number;
  pageSize?: number;
  type?: number;
  level?: number;
  status?: number;
  rule_id?: number;
  target_id?: number;
  start_time?: string;
  end_time?: string;
}

export interface OrderRiskCheckData {
  user_id: number;
  total_amount: number;
  goods_count: number;
  order_no: string;
  user_register_days?: number;
  user_today_order_count?: number;
}

export interface RiskCheckResult {
  passed: boolean;
  alerts: Array<{
    rule_id: number;
    rule_name: string;
    level: number;
    action: string;
    content: string;
  }>;
}

class RiskControlService {
  private readonly riskControlDao = daos.riskControlDao;
  private readonly riskAlertDao = daos.riskAlertDao;

  async getRuleList(params: RiskControlQueryParams): Promise<PageResult<RiskControl>> {
    const { page = 1, pageSize = 10, name, type, status } = params;

    const where: WhereOptions<RiskControl> = {};

    if (name) {
      where.name = { [Op.like]: `%${name}%` } as any;
    }
    if (type !== undefined) {
      where.type = type;
    }
    if (status !== undefined) {
      where.status = status;
    }

    return this.riskControlDao.findPage({
      page,
      pageSize,
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async getRuleDetail(id: number): Promise<RiskControl> {
    const rule = await this.riskControlDao.findById(id);
    if (!rule) {
      throw new AppError('风控规则不存在', 404);
    }
    return rule;
  }

  async createRule(payload: RiskControlCreatePayload): Promise<RiskControl> {
    const { name, type, condition_json, action, threshold, status = 1 } = payload;

    if (![1, 2, 3, 4].includes(type)) {
      throw new AppError('无效的规则类型', 400);
    }

    if (!['alert', 'block', 'review'].includes(action)) {
      throw new AppError('无效的触发动作', 400);
    }

    return this.riskControlDao.create({
      name,
      type,
      condition_json,
      action,
      threshold,
      status,
    });
  }

  async updateRule(id: number, payload: RiskControlUpdatePayload): Promise<RiskControl> {
    await this.getRuleDetail(id);

    if (payload.type !== undefined && ![1, 2, 3, 4].includes(payload.type)) {
      throw new AppError('无效的规则类型', 400);
    }

    if (payload.action !== undefined && !['alert', 'block', 'review'].includes(payload.action)) {
      throw new AppError('无效的触发动作', 400);
    }

    await this.riskControlDao.update(id, payload);
    return this.getRuleDetail(id);
  }

  async deleteRule(id: number): Promise<void> {
    await this.getRuleDetail(id);
    await this.riskControlDao.delete(id);
  }

  async updateRuleStatus(id: number, status: number): Promise<RiskControl> {
    await this.getRuleDetail(id);

    if (status !== 0 && status !== 1) {
      throw new AppError('无效的状态值', 400);
    }

    await this.riskControlDao.update(id, { status });
    return this.getRuleDetail(id);
  }

  async checkOrderRisk(orderData: OrderRiskCheckData): Promise<RiskCheckResult> {
    const result: RiskCheckResult = {
      passed: true,
      alerts: [],
    };

    const rules = await this.riskControlDao.findAll({
      where: { type: 2, status: 1 } as WhereOptions<RiskControl>,
    });

    for (const rule of rules) {
      const isTriggered = this.evaluateRule(rule, orderData);
      if (isTriggered) {
        const level = this.calculateLevel(rule, orderData);
        result.alerts.push({
          rule_id: rule.id,
          rule_name: rule.name,
          level,
          action: rule.action,
          content: `规则[${rule.name}]被触发`,
        });

        await this.createAlert({
          rule_id: rule.id,
          type: 2,
          target_id: orderData.user_id,
          level,
          content: `订单[${orderData.order_no}]触发风控规则[${rule.name}]，金额：${orderData.total_amount}`,
        });

        if (rule.action === 'block') {
          result.passed = false;
        }
      }
    }

    return result;
  }

  private evaluateRule(rule: RiskControl, data: any): boolean {
    try {
      const condition = rule.condition_json as any;
      const threshold = Number(rule.threshold || 0);

      if (condition.max_amount !== undefined) {
        if (data.total_amount > Number(condition.max_amount)) {
          return true;
        }
      }

      if (condition.min_amount !== undefined) {
        if (data.total_amount < Number(condition.min_amount)) {
          return true;
        }
      }

      if (condition.max_daily_orders !== undefined) {
        if ((data.user_today_order_count || 0) > Number(condition.max_daily_orders)) {
          return true;
        }
      }

      if (condition.min_register_days !== undefined) {
        if ((data.user_register_days || 0) < Number(condition.min_register_days) && threshold > 0) {
          return data.total_amount > threshold;
        }
      }

      if (condition.max_goods_count !== undefined) {
        if (data.goods_count > Number(condition.max_goods_count)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error evaluating rule:', rule.id, error);
      return false;
    }
  }

  private calculateLevel(rule: RiskControl, data: any): number {
    const threshold = Number(rule.threshold || 0);
    if (threshold > 0 && data.total_amount > threshold * 2) {
      return 3;
    }
    if (threshold > 0 && data.total_amount > threshold * 1.5) {
      return 2;
    }
    return 1;
  }

  private async createAlert(data: {
    rule_id: number;
    type: number;
    target_id: number;
    level: number;
    content?: string;
  }): Promise<RiskAlert> {
    const alert = await this.riskAlertDao.create({
      rule_id: data.rule_id,
      type: data.type,
      target_id: data.target_id,
      level: data.level,
      content: data.content,
      status: 0,
    });

    if (data.level === 3) {
      messageService.sendMessage({
        user_type: 3,
        user_id: 0,
        type: 3,
        title: '【高风险预警】请立即处理',
        content: data.content || '检测到高风险操作，请及时处理',
      }).catch(err => console.error('Failed to send risk alert message:', err));
    }

    return alert;
  }

  async getAlertList(params: RiskAlertQueryParams): Promise<PageResult<RiskAlert>> {
    const {
      page = 1,
      pageSize = 10,
      type,
      level,
      status,
      rule_id,
      target_id,
      start_time,
      end_time,
    } = params;

    const where: WhereOptions<RiskAlert> = {};

    if (type !== undefined) {
      where.type = type;
    }
    if (level !== undefined) {
      where.level = level;
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (rule_id !== undefined) {
      where.rule_id = rule_id;
    }
    if (target_id !== undefined) {
      where.target_id = target_id;
    }
    if (start_time || end_time) {
      where.created_at = {} as any;
      if (start_time) {
        (where.created_at as any)[Op.gte] = new Date(start_time);
      }
      if (end_time) {
        (where.created_at as any)[Op.lte] = new Date(end_time);
      }
    }

    return this.riskAlertDao.findPage({
      page,
      pageSize,
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async getAlertDetail(id: number): Promise<RiskAlert> {
    const alert = await this.riskAlertDao.findById(id);
    if (!alert) {
      throw new AppError('预警记录不存在', 404);
    }
    return alert;
  }

  async handleAlert(id: number, handlerId: number): Promise<RiskAlert> {
    const alert = await this.getAlertDetail(id);

    if (alert.status === 1) {
      throw new AppError('该预警已处理', 400);
    }

    await this.riskAlertDao.markAsHandled(id, handlerId);
    return this.getAlertDetail(id);
  }

  async getUnhandledAlertCount(): Promise<{ total: number; high: number; medium: number; low: number }> {
    const [total, high, medium, low] = await Promise.all([
      this.riskAlertDao.getUnhandledCount(),
      RiskAlert.count({ where: { status: 0, level: 3 } as WhereOptions<RiskAlert> }),
      RiskAlert.count({ where: { status: 0, level: 2 } as WhereOptions<RiskAlert> }),
      RiskAlert.count({ where: { status: 0, level: 1 } as WhereOptions<RiskAlert> }),
    ]);

    return { total, high, medium, low };
  }
}

export const riskControlService = new RiskControlService();
export default RiskControlService;
