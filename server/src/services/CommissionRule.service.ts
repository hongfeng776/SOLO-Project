import CommissionRule, { CommissionRuleCreationAttributes, CommissionRuleAttributes } from '../models/CommissionRule.model';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import { PaginationParams, PaginationResult } from '../types';
import { Op } from 'sequelize';

interface CommissionRuleQueryParams extends PaginationParams {
  keyword?: string;
  ruleType?: string;
  enabled?: boolean;
}

class CommissionRuleService {
  public async create(data: CommissionRuleCreationAttributes) {
    const exists = await CommissionRule.count({ where: { code: data.code } });
    if (exists > 0) {
      throw new AppError('规则编码已存在', BusinessCode.ERROR);
    }
    return CommissionRule.create(data);
  }

  public async findById(id: string) {
    const rule = await CommissionRule.findByPk(id);
    if (!rule) {
      throw new AppError('佣金规则不存在', BusinessCode.NOT_FOUND);
    }
    return rule;
  }

  public async findAll(params: CommissionRuleQueryParams): Promise<PaginationResult<any>> {
    const { page, pageSize, keyword, ruleType, enabled } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (ruleType) where.ruleType = ruleType;
    if (enabled !== undefined) where.enabled = enabled;
    const { rows, count } = await CommissionRule.findAndCountAll({ where, offset, limit: pageSize, order: [['priority', 'ASC'], ['createdAt', 'DESC']] });
    return { list: rows, total: count, page, pageSize, totalPages: Math.ceil(count / pageSize) };
  }

  public async update(id: string, data: Partial<CommissionRuleAttributes>) {
    const rule = await CommissionRule.findByPk(id);
    if (!rule) {
      throw new AppError('佣金规则不存在', BusinessCode.NOT_FOUND);
    }
    if (data.code && data.code !== rule.code) {
      const exists = await CommissionRule.count({ where: { code: data.code, id: { [Op.ne]: id } } });
      if (exists > 0) {
        throw new AppError('规则编码已存在', BusinessCode.ERROR);
      }
    }
    await CommissionRule.update(data, { where: { id } });
    return CommissionRule.findByPk(id);
  }

  public async delete(id: string): Promise<void> {
    const rule = await CommissionRule.findByPk(id);
    if (!rule) {
      throw new AppError('佣金规则不存在', BusinessCode.NOT_FOUND);
    }
    await rule.destroy();
  }

  public async toggleEnabled(id: string): Promise<void> {
    const rule = await CommissionRule.findByPk(id);
    if (!rule) {
      throw new AppError('佣金规则不存在', BusinessCode.NOT_FOUND);
    }
    await CommissionRule.update({ enabled: !rule.enabled }, { where: { id } });
  }

  public async findActiveRules(ruleType?: string): Promise<CommissionRule[]> {
    const now = new Date();
    const where: any = { enabled: true };
    if (ruleType) where.ruleType = ruleType;
    where[Op.or] = [
      { effectiveStartTime: null, effectiveEndTime: null },
      { effectiveStartTime: { [Op.lte]: now }, effectiveEndTime: { [Op.gte]: now } },
      { effectiveStartTime: null, effectiveEndTime: { [Op.gte]: now } },
      { effectiveStartTime: { [Op.lte]: now }, effectiveEndTime: null },
    ];
    return CommissionRule.findAll({ where, order: [['priority', 'ASC']] });
  }
}

export default new CommissionRuleService();
