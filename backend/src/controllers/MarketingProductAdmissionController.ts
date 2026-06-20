import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';
import { marketingProductAdmissionService } from '../services/MarketingProductAdmissionService';

export const validateApply = asyncHandler(async (req: Request, res: Response) => {
  const { marketingId, goodsId } = req.body;

  if (!marketingId) {
    badRequest(res, '缺少营销活动ID');
    return;
  }

  if (!goodsId) {
    badRequest(res, '缺少商品ID');
    return;
  }

  const marketingIdNum = parseInt(marketingId as string, 10);
  const goodsIdNum = parseInt(goodsId as string, 10);

  if (isNaN(marketingIdNum) || isNaN(goodsIdNum)) {
    badRequest(res, '参数格式无效');
    return;
  }

  const result = await marketingProductAdmissionService.validateApply(marketingIdNum, goodsIdNum);
  ok(res, result, '校验完成');
});

export const applyGoods = asyncHandler(async (req: Request, res: Response) => {
  const { marketingId, goodsIds, activityPrice, stock, sortOrder } = req.body;

  if (!marketingId) {
    badRequest(res, '缺少营销活动ID');
    return;
  }

  if (!goodsIds || !Array.isArray(goodsIds) || goodsIds.length === 0) {
    badRequest(res, '请选择要报名的商品');
    return;
  }

  const marketingIdNum = parseInt(marketingId as string, 10);
  const goodsIdNums = goodsIds.map((id: any) => parseInt(id as string, 10)).filter(id => !isNaN(id));

  if (isNaN(marketingIdNum) || goodsIdNums.length === 0) {
    badRequest(res, '参数格式无效');
    return;
  }

  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  const result = await marketingProductAdmissionService.applyGoods(
    {
      marketingId: marketingIdNum,
      goodsIds: goodsIdNums,
      activityPrice: activityPrice !== undefined ? parseFloat(activityPrice as string) : undefined,
      stock: stock !== undefined ? parseInt(stock as string, 10) : undefined,
      sortOrder: sortOrder !== undefined ? parseInt(sortOrder as string, 10) : undefined,
    },
    operatorId,
    operatorName
  );

  ok(res, result, `报名完成：成功${result.success}个，失败${result.failed}个`);
});

export const auditPass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { remark } = req.body;

  if (!id) {
    badRequest(res, '缺少活动商品ID');
    return;
  }

  const idNum = parseInt(id as string, 10);
  if (isNaN(idNum)) {
    badRequest(res, 'ID格式无效');
    return;
  }

  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  const result = await marketingProductAdmissionService.auditPass(idNum, operatorId, operatorName, remark);
  ok(res, result, '审核通过');
});

export const auditReject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { remark } = req.body;

  if (!id) {
    badRequest(res, '缺少活动商品ID');
    return;
  }

  if (!remark) {
    badRequest(res, '请输入驳回原因');
    return;
  }

  const idNum = parseInt(id as string, 10);
  if (isNaN(idNum)) {
    badRequest(res, 'ID格式无效');
    return;
  }

  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  const result = await marketingProductAdmissionService.auditReject(idNum, operatorId, operatorName, remark);
  ok(res, result, '审核驳回');
});

export const offlineProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { remark } = req.body;

  if (!id) {
    badRequest(res, '缺少活动商品ID');
    return;
  }

  const idNum = parseInt(id as string, 10);
  if (isNaN(idNum)) {
    badRequest(res, 'ID格式无效');
    return;
  }

  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  const result = await marketingProductAdmissionService.offlineProduct(idNum, operatorId, operatorName, remark);
  ok(res, result, '商品已下架');
});

export const onlineProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { remark } = req.body;

  if (!id) {
    badRequest(res, '缺少活动商品ID');
    return;
  }

  const idNum = parseInt(id as string, 10);
  if (isNaN(idNum)) {
    badRequest(res, 'ID格式无效');
    return;
  }

  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  const result = await marketingProductAdmissionService.onlineProduct(idNum, operatorId, operatorName, remark);
  ok(res, result, '商品已上架');
});

export const removeProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { remark } = req.body;

  if (!id) {
    badRequest(res, '缺少活动商品ID');
    return;
  }

  const idNum = parseInt(id as string, 10);
  if (isNaN(idNum)) {
    badRequest(res, 'ID格式无效');
    return;
  }

  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  await marketingProductAdmissionService.removeProduct(idNum, operatorId, operatorName, remark);
  ok(res, null, '商品已移除');
});

export const checkDuplicateApply = asyncHandler(async (req: Request, res: Response) => {
  const { marketingId, goodsIds } = req.body;

  if (!marketingId) {
    badRequest(res, '缺少营销活动ID');
    return;
  }

  if (!goodsIds || !Array.isArray(goodsIds)) {
    badRequest(res, '请选择商品');
    return;
  }

  const marketingIdNum = parseInt(marketingId as string, 10);
  const goodsIdNums = goodsIds.map((id: any) => parseInt(id as string, 10)).filter(id => !isNaN(id));

  const result = await marketingProductAdmissionService.checkDuplicateApply(marketingIdNum, goodsIdNums);
  ok(res, result, '检查完成');
});

export default {
  validateApply,
  applyGoods,
  auditPass,
  auditReject,
  offlineProduct,
  onlineProduct,
  removeProduct,
  checkDuplicateApply,
};
