import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { success, badRequest } from '../utils/response';
import {
  logisticsTraceService,
} from '../services/LogisticsTraceService';
import { daos } from '../dao';

export const getLogisticsTraceByOrderId = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  if (!orderId) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const trace = await logisticsTraceService.getLogisticsTrace(parseInt(orderId, 10));

  success(res, trace, '获取物流溯源数据成功');
});

export const getLogisticsTraceByShipmentId = asyncHandler(async (req: Request, res: Response) => {
  const { shipmentId } = req.params;

  if (!shipmentId) {
    badRequest(res, '缺少发货记录ID');
    return;
  }

  const trace = await logisticsTraceService.getLogisticsTraceByShipmentId(parseInt(shipmentId, 10));

  success(res, trace, '获取物流溯源数据成功');
});

export const getLogisticsTraceByLogisticsNo = asyncHandler(async (req: Request, res: Response) => {
  const { logisticsNo } = req.params;

  if (!logisticsNo) {
    badRequest(res, '缺少物流单号');
    return;
  }

  const trace = await logisticsTraceService.getLogisticsTraceByLogisticsNo(logisticsNo);

  success(res, trace, '获取物流溯源数据成功');
});

export const validateLogisticsData = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  if (!orderId) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const report = await logisticsTraceService.validateLogisticsData(parseInt(orderId, 10));

  success(res, report, report.overallScore >= 80 ? '物流数据校验通过' : '物流数据存在异常');
});

export const checkLogisticsMatch = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  if (!orderId) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const matched = await logisticsTraceService.checkLogisticsMatch(parseInt(orderId, 10));

  success(res, { matched }, matched ? '物流信息匹配' : '物流信息不匹配');
});

export const getLogisticsTracks = asyncHandler(async (req: Request, res: Response) => {
  const { shipmentId } = req.params;

  if (!shipmentId) {
    badRequest(res, '缺少发货记录ID');
    return;
  }

  const tracks = await daos.logisticsTrackDao.findAll({
    where: { shipment_id: parseInt(shipmentId, 10) },
    order: [['track_time', 'ASC']],
  });

  success(res, tracks, '获取物流轨迹列表成功');
});

export const getAbnormalLogs = asyncHandler(async (req: Request, res: Response) => {
  const { shipmentId } = req.params;

  if (!shipmentId) {
    badRequest(res, '缺少发货记录ID');
    return;
  }

  const logs = await daos.abnormalLogisticsLogDao.findAll({
    where: { shipment_id: parseInt(shipmentId, 10) },
    order: [['created_at', 'DESC']],
  });

  success(res, logs, '获取异常处理日志成功');
});

export default {
  getLogisticsTraceByOrderId,
  getLogisticsTraceByShipmentId,
  getLogisticsTraceByLogisticsNo,
  validateLogisticsData,
  checkLogisticsMatch,
  getLogisticsTracks,
  getAbnormalLogs,
};
