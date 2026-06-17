import { Request, Response } from 'express';
import { StatusFlowService } from '../services';
import { sendSuccess } from '../utils/response';
import {
  StatusTransitionRequest,
  BatchStatusRequest,
  StatusFlowQueryParams,
  StatusTraceRequest
} from '../types/statusFlow';

const statusFlowService = new StatusFlowService();

export class StatusFlowController {
  async checkTransition(req: Request, res: Response) {
    const data = req.body as StatusTransitionRequest;
    const result = await statusFlowService.checkTransition(
      data,
      (req as any).userRoles
    );
    return sendSuccess(res, result, '状态流转校验完成');
  }

  async executeTransition(req: Request, res: Response) {
    const data = req.body as StatusTransitionRequest;
    const result = await statusFlowService.executeTransition(
      data,
      (req as any).userId,
      (req as any).userRoles
    );
    return sendSuccess(res, result, '状态流转执行成功');
  }

  async getFlowList(req: Request, res: Response) {
    const params = req.query as unknown as StatusFlowQueryParams;
    const result = await statusFlowService.getFlowList(
      params,
      (req as any).userId,
      (req as any).orgId,
      (req as any).userRoles
    );
    return sendSuccess(res, result, '查询成功');
  }

  async batchOperation(req: Request, res: Response) {
    const data = req.body as BatchStatusRequest;
    const result = await statusFlowService.batchOperation(
      data,
      (req as any).userId,
      (req as any).userRoles
    );
    return sendSuccess(res, result, '批量操作完成');
  }

  async traceStatusChange(req: Request, res: Response) {
    const data = req.body as StatusTraceRequest;
    const result = await statusFlowService.traceStatusChange(data);
    return sendSuccess(res, result, '溯源查询成功');
  }

  async getStatusConfig(req: Request, res: Response) {
    const result = await statusFlowService.getStatusConfig();
    return sendSuccess(res, result, '获取配置成功');
  }
}
