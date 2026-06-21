import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { success, badRequest, ok } from '../utils/response';
import logisticsAbnormalMonitorService from '../services/LogisticsAbnormalMonitorService';
import { daos } from '../dao';

const { logisticsAbnormalDetectionRuleDao } = daos;

const extractAdminInfo = (req: Request) => {
  const adminId = (req as any).adminId || 1;
  const adminName = (req as any).adminName || '系统管理员';
  return { adminId, adminName };
};

export const runAbnormalDetection = asyncHandler(async (req: Request, res: Response) => {
  const { shipment_id, track_id } = req.body;
  if (!shipment_id || !track_id) {
    badRequest(res, '缺少必要参数');
    return;
  }
  const { adminId, adminName } = extractAdminInfo(req);
  const result = await logisticsAbnormalMonitorService.runAbnormalDetection(
    parseInt(shipment_id as string, 10),
    parseInt(track_id as string, 10),
    adminId,
    adminName
  );
  success(res, result, result.abnormal_detected ? '检测到异常' : '未检测到异常');
});

export const processAbnormal = asyncHandler(async (req: Request, res: Response) => {
  const { abnormal_log_id, process_type, process_remark } = req.body;
  if (!abnormal_log_id || !process_type || !process_remark) {
    badRequest(res, '缺少必要参数');
    return;
  }
  const { adminId, adminName } = extractAdminInfo(req);
  await logisticsAbnormalMonitorService.processAbnormalManually(
    parseInt(abnormal_log_id as string, 10),
    process_type as string,
    process_remark as string,
    adminId,
    adminName
  );
  ok(res, null, '异常处理成功');
});

export const batchDetectAbnormal = asyncHandler(async (req: Request, res: Response) => {
  const { shipment_ids } = req.body;
  if (!shipment_ids || !Array.isArray(shipment_ids) || shipment_ids.length === 0) {
    badRequest(res, '请选择要检测的发货记录');
    return;
  }
  const { adminId, adminName } = extractAdminInfo(req);
  const result = await logisticsAbnormalMonitorService.batchDetectAbnormal(
    (shipment_ids as number[]).map(id => parseInt(id as unknown as string, 10)),
    adminId,
    adminName
  );
  success(res, result, '批量检测完成');
});

export const getDetectionRules = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  const where: any = {};
  if (status !== undefined && status !== null) {
    where.status = parseInt(status as string, 10);
  }
  const result = await logisticsAbnormalDetectionRuleDao.findByCondition(
    where,
    { order: [['priority', 'DESC']] }
  );
  success(res, result, '获取检测规则成功');
});

export const createDetectionRule = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const { adminId, adminName } = extractAdminInfo(req);
  const result = await logisticsAbnormalDetectionRuleDao.create({
    ...data,
    created_by: adminId,
    created_by_name: adminName,
  });
  success(res, result, '创建检测规则成功');
});

export const updateDetectionRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  if (!id) {
    badRequest(res, '缺少规则ID');
    return;
  }
  const result = await logisticsAbnormalDetectionRuleDao.update(
    parseInt(id as string, 10),
    data
  );
  ok(res, result, '更新检测规则成功');
});

export const deleteDetectionRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少规则ID');
    return;
  }
  await logisticsAbnormalDetectionRuleDao.delete(parseInt(id as string, 10));
  ok(res, null, '删除检测规则成功');
});

export default {
  runAbnormalDetection,
  processAbnormal,
  batchDetectAbnormal,
  getDetectionRules,
  createDetectionRule,
  updateDetectionRule,
  deleteDetectionRule,
};
