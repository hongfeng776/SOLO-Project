import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { success, badRequest, ok } from '../utils/response';
import logisticsLinkTraceService from '../services/LogisticsLinkTraceService';

const extractAdminInfo = (req: Request) => {
  const adminId = (req as any).adminId || 1;
  const adminName = (req as any).adminName || '系统管理员';
  return { adminId, adminName };
};

export const getFullLinkTrace = asyncHandler(async (req: Request, res: Response) => {
  const { shipment_id } = req.params;
  if (!shipment_id) {
    badRequest(res, '缺少发货记录ID');
    return;
  }
  const result = await logisticsLinkTraceService.getFullLinkTrace(
    parseInt(shipment_id as string, 10)
  );
  success(res, result, '获取链路溯源成功');
});

export const checkDuplicateNode = asyncHandler(async (req: Request, res: Response) => {
  const { shipment_id, track_id, track_content, track_time } = req.body;
  if (!shipment_id || !track_id) {
    badRequest(res, '缺少必要参数');
    return;
  }

  const { daos } = await import('../dao');
  const track = await daos.logisticsTrackDao.findById(parseInt(track_id as string, 10));
  const shipment = await daos.shipmentRecordDao.findById(parseInt(shipment_id as string, 10));

  if (!track || !shipment) {
    badRequest(res, '记录不存在');
    return;
  }

  if (track_content) track.track_content = track_content;
  if (track_time) track.track_time = new Date(track_time as string);

  const result = await logisticsLinkTraceService.checkDuplicateNode(track, shipment);
  success(res, result, result.is_duplicate ? '检测到重复节点' : '无重复节点');
});

export const checkFakeTrack = asyncHandler(async (req: Request, res: Response) => {
  const { shipment_id, track_id } = req.body;
  if (!shipment_id || !track_id) {
    badRequest(res, '缺少必要参数');
    return;
  }

  const { daos } = await import('../dao');
  const track = await daos.logisticsTrackDao.findById(parseInt(track_id as string, 10));
  const shipment = await daos.shipmentRecordDao.findById(parseInt(shipment_id as string, 10));

  if (!track || !shipment) {
    badRequest(res, '记录不存在');
    return;
  }

  const result = await logisticsLinkTraceService.checkFakeTrackAdvanced(track, shipment);
  success(res, result, result.is_fake ? '检测到虚假轨迹' : '轨迹正常');
});

export const verifyNode = asyncHandler(async (req: Request, res: Response) => {
  const { node_extension_id, verification_status, verification_remark } = req.body;
  if (!node_extension_id || verification_status === undefined) {
    badRequest(res, '缺少必要参数');
    return;
  }
  const { adminId, adminName } = extractAdminInfo(req);
  await logisticsLinkTraceService.verifyNode(
    parseInt(node_extension_id as string, 10),
    parseInt(verification_status as string, 10),
    verification_remark as string,
    adminId,
    adminName
  );
  ok(res, null, '节点核验完成');
});

export const addNodeExtension = asyncHandler(async (req: Request, res: Response) => {
  const { track_id, ...extensionData } = req.body;
  if (!track_id) {
    badRequest(res, '缺少轨迹ID');
    return;
  }
  const { adminId, adminName } = extractAdminInfo(req);
  const result = await logisticsLinkTraceService.addNodeExtension(
    parseInt(track_id as string, 10),
    extensionData,
    adminId,
    adminName
  );
  success(res, result, '添加节点扩展信息成功');
});

export default {
  getFullLinkTrace,
  checkDuplicateNode,
  checkFakeTrack,
  verifyNode,
  addNodeExtension,
};
