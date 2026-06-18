import { Request, Response } from 'express';
import { LoanRepaymentService } from '../services/LoanRepaymentService';
import { sendSuccess } from '../utils/response';

export class LoanRepaymentController {
  private repaymentService: LoanRepaymentService;

  constructor() {
    this.repaymentService = new LoanRepaymentService();
  }

  async preCheck(req: Request, res: Response) {
    const { loan_id, account_id, repayment_type } = req.body;
    const result = await this.repaymentService.preCheckRepayment(loan_id, account_id, repayment_type);
    sendSuccess(res, result);
  }

  async getDetail(req: Request, res: Response) {
    const { id } = req.params;
    const { account_id } = req.query;
    const result = await this.repaymentService.getRepaymentDetail(id, account_id as string);
    sendSuccess(res, result);
  }

  async doRepayment(req: Request, res: Response) {
    const userInfo = (req as any).user;
    const operatorId = userInfo?.id;
    const operatorName = userInfo?.real_name || userInfo?.username;
    const ipAddress = req.ip;

    const result = await this.repaymentService.doRepayment(
      req.body,
      operatorId,
      operatorName,
      ipAddress
    );
    sendSuccess(res, result);
  }

  async getWithholdList(req: Request, res: Response) {
    const params: any = req.query;
    const userInfo = (req as any).user;
    const orgId = userInfo?.org_id;

    const result = await this.repaymentService.getWithholdList(params, orgId);
    sendSuccess(res, result);
  }

  async batchWithhold(req: Request, res: Response) {
    const userInfo = (req as any).user;
    const operatorId = userInfo?.id;
    const operatorName = userInfo?.real_name || userInfo?.username;
    const ipAddress = req.ip;

    const result = await this.repaymentService.batchWithhold(
      req.body,
      operatorId,
      operatorName,
      ipAddress
    );
    sendSuccess(res, result);
  }

  async traceRepayment(req: Request, res: Response) {
    const userInfo = (req as any).user;
    const operatorId = userInfo?.id;

    const result = await this.repaymentService.traceRepayment(req.body, operatorId);
    sendSuccess(res, result);
  }

  async generateWithholdRecords(req: Request, res: Response) {
    const count = await this.repaymentService.generateWithholdRecords();
    sendSuccess(res, { count, message: `成功生成${count}条代扣记录` });
  }
}
