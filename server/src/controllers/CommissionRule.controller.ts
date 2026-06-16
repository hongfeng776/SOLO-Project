import { Request, Response } from 'express';
import commissionRuleService from '../services/CommissionRule.service';
import ResponseUtils from '../utils/response';
import { CommissionRuleCreationAttributes, CommissionRuleAttributes } from '../models/CommissionRule.model';

class CommissionRuleController {
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CommissionRuleCreationAttributes = req.body;
      const result = await commissionRuleService.create(data);
      ResponseUtils.created(res, result, '佣金规则创建成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await commissionRuleService.findById(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async findAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const params = {
        page, pageSize,
        keyword: req.query.keyword as string,
        ruleType: req.query.ruleType as string,
        enabled: req.query.enabled === 'true' ? true : req.query.enabled === 'false' ? false : undefined,
      };
      const result = await commissionRuleService.findAll(params);
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: Partial<CommissionRuleAttributes> = req.body;
      const result = await commissionRuleService.update(id, data);
      ResponseUtils.success(res, result, '佣金规则更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await commissionRuleService.delete(id);
      ResponseUtils.success(res, null, '佣金规则删除成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async toggleEnabled(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await commissionRuleService.toggleEnabled(id);
      ResponseUtils.success(res, null, '状态切换成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }
}

export default new CommissionRuleController();
