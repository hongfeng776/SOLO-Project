import { Request, Response } from 'express';
import { afterSaleAuditService, AuditPayload } from '../services/AfterSaleAuditService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const audit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { level, status, remark, refund_amount } = req.body;

  if (!id) {
    badRequest(res, '缺少售后ID');
    return;
  }

  if (level === undefined) {
    badRequest(res, '缺少审核级别');
    return;
  }

  if (status === undefined) {
    badRequest(res, '缺少审核结果');
    return;
  }

  const payload: AuditPayload = {
    aftersale_id: parseInt(id, 10),
    auditor_id: req.user?.id ?? 0,
    level: parseInt(level, 10),
    status: parseInt(status, 10),
    remark,
    refund_amount: refund_amount !== undefined ? parseFloat(refund_amount) : undefined,
  };

  const result = await afterSaleAuditService.audit(payload);
  ok(res, result, '售后审核完成');
});

export const batchAudit = asyncHandler(async (req: Request, res: Response) => {
  const { aftersale_ids, level, status, remark } = req.body;

  if (!aftersale_ids || !Array.isArray(aftersale_ids) || aftersale_ids.length === 0) {
    badRequest(res, '请选择要审核的售后申请');
    return;
  }

  if (level === undefined) {
    badRequest(res, '缺少审核级别');
    return;
  }

  if (status === undefined) {
    badRequest(res, '缺少审核结果');
    return;
  }

  const result = await afterSaleAuditService.batchAudit(
    aftersale_ids.map((id: string | number) => parseInt(String(id), 10)),
    req.user?.id ?? 0,
    parseInt(level, 10),
    parseInt(status, 10),
    remark
  );

  ok(res, result, `批量审核完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const executeRefund = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少售后ID');
    return;
  }

  const { daos } = require('../dao');

  const afterSale = await daos.afterSaleDao.findById(parseInt(id, 10));
  if (!afterSale) {
    badRequest(res, '售后申请不存在');
    return;
  }

  const order = await daos.orderDao.findById(afterSale.order_id);
  if (!order) {
    badRequest(res, '关联订单不存在');
    return;
  }

  const result = await afterSaleAuditService.executeAutoRefund(afterSale, order, Number(afterSale.amount));
  ok(res, result, '执行退款成功');
});

export const getAudits = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少售后ID');
    return;
  }

  const audits = await afterSaleAuditService.getAuditTrail(parseInt(id, 10));
  ok(res, audits, '获取审核记录成功');
});

export default {
  audit,
  batchAudit,
  executeRefund,
  getAudits,
};
