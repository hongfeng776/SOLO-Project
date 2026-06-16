import { Request, Response, NextFunction } from 'express';
import fundFlowService from '@services/FundFlowService';
import { success, paginated } from '@utils/response';

export async function getFlowById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await fundFlowService.getFlowById(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getFlowList(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const flowType = req.query.flowType as string | undefined;
    const flowStatus = req.query.flowStatus as string | undefined;
    const channel = req.query.channel as string | undefined;
    const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const result = await fundFlowService.getFlowList({ page, pageSize, flowType, flowStatus, channel, customerId, startDate, endDate });
    res.json(paginated(result.list, result.total, result.page, result.pageSize));
  } catch (err) {
    next(err);
  }
}

export async function getFlowByNo(req: Request, res: Response, next: NextFunction) {
  try {
    const flowNo = req.params.flowNo;
    const result = await fundFlowService.getFlowByNo(flowNo);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function createFlow(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await fundFlowService.createFlow(req.body);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function updateFlow(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await fundFlowService.updateFlow(id, req.body);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function deleteFlow(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await fundFlowService.deleteFlow(id);
    res.json(success(null));
  } catch (err) {
    next(err);
  }
}
