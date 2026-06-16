import { Request, Response } from 'express';
import { withdrawService } from '../services';
import ResponseUtils from '../utils/response';
import { WithdrawCreationAttributes, WithdrawAttributes } from '../models/Withdraw.model';

class WithdrawController {
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data: WithdrawCreationAttributes = req.body;
      const result = await withdrawService.create(data);
      ResponseUtils.created(res, result, '提现记录创建成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async apply(req: Request, res: Response): Promise<void> {
    try {
      const data: WithdrawCreationAttributes = req.body;
      const result = await withdrawService.apply(data);
      ResponseUtils.created(res, result, '提现申请提交成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await withdrawService.findById(id);
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
        page,
        pageSize,
        promoterId: req.query.promoterId as string,
        status: req.query.status ? parseInt(req.query.status as string, 10) : undefined,
      };
      const result = await withdrawService.findAll(params);
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: Partial<WithdrawAttributes> = req.body;
      const result = await withdrawService.update(id, data);
      ResponseUtils.success(res, result, '提现记录更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await withdrawService.delete(id);
      ResponseUtils.success(res, null, '提现记录删除成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async audit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { approved, auditRemark } = req.body;
      const auditUserId = req.user?.userId;
      await withdrawService.audit(id, approved, auditRemark, auditUserId);
      ResponseUtils.success(res, null, approved ? '审核通过成功' : '审核拒绝成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async pay(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { payRemark } = req.body;
      await withdrawService.pay(id, payRemark);
      ResponseUtils.success(res, null, '打款成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }
}

export default new WithdrawController();
