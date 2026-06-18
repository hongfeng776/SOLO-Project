import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { success, badRequest } from '../utils/response';
import {
  afterSaleTraceService,
} from '../services/AfterSaleTraceService';
import { daos } from '../dao';

export const getAfterSaleTrace = asyncHandler(async (req: Request, res: Response) => {
  const { afterSaleId } = req.params;

  if (!afterSaleId) {
    badRequest(res, '缺少售后ID');
    return;
  }

  const trace = await afterSaleTraceService.getAfterSaleTrace(parseInt(afterSaleId, 10));

  success(res, trace, '获取售后溯源数据成功');
});

export const getAfterSaleTraceByOrderId = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  if (!orderId) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const trace = await afterSaleTraceService.getAfterSaleTraceByOrderId(parseInt(orderId, 10));

  success(res, trace, '获取售后溯源数据成功');
});

export const getAfterSaleTraceByNo = asyncHandler(async (req: Request, res: Response) => {
  const { afterSaleNo } = req.params;

  if (!afterSaleNo) {
    badRequest(res, '缺少售后单号');
    return;
  }

  const trace = await afterSaleTraceService.getAfterSaleTraceByAfterSaleNo(afterSaleNo);

  success(res, trace, '获取售后溯源数据成功');
});

export const validateAfterSaleData = asyncHandler(async (req: Request, res: Response) => {
  const { afterSaleId } = req.params;

  if (!afterSaleId) {
    badRequest(res, '缺少售后ID');
    return;
  }

  const report = await afterSaleTraceService.validateAfterSaleData(parseInt(afterSaleId, 10));

  success(res, report, report.overallScore >= 80 ? '售后数据校验通过' : '售后数据存在异常');
});

export const getOperationLogs = asyncHandler(async (req: Request, res: Response) => {
  const { afterSaleId } = req.params;

  if (!afterSaleId) {
    badRequest(res, '缺少售后ID');
    return;
  }

  const logs = await daos.afterSaleOperationLogDao.findAll({
    where: { after_sale_id: parseInt(afterSaleId, 10) },
    order: [['created_at', 'DESC']],
  });

  success(res, logs, '获取操作日志成功');
});

export const getLedger = asyncHandler(async (req: Request, res: Response) => {
  const { afterSaleId } = req.params;

  if (!afterSaleId) {
    badRequest(res, '缺少售后ID');
    return;
  }

  const ledger = await daos.afterSaleLedgerDao.findAll({
    where: { after_sale_id: parseInt(afterSaleId, 10) },
    order: [['ledger_time', 'DESC']],
  });

  success(res, ledger, '获取台账成功');
});

export default {
  getAfterSaleTrace,
  getAfterSaleTraceByOrderId,
  getAfterSaleTraceByNo,
  validateAfterSaleData,
  getOperationLogs,
  getLedger,
};
