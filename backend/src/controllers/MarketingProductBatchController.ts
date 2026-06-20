import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';
import { marketingProductBatchService } from '../services/MarketingProductBatchService';

export const batchAuditPass = asyncHandler(async (req: Request, res: Response) => {
  const { ids, remark } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要审核的商品');
    return;
  }

  const idNums = ids.map((id: any) => parseInt(id as string, 10)).filter(id => !isNaN(id));

  if (idNums.length === 0) {
    badRequest(res, '参数格式无效');
    return;
  }

  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  const result = await marketingProductBatchService.batchAuditPass(idNums, operatorId, operatorName, remark);
  ok(res, result, `批量审核完成：成功${result.success}个，失败${result.failed}个`);
});

export const batchAuditReject = asyncHandler(async (req: Request, res: Response) => {
  const { ids, remark } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要审核的商品');
    return;
  }

  if (!remark) {
    badRequest(res, '请输入驳回原因');
    return;
  }

  const idNums = ids.map((id: any) => parseInt(id as string, 10)).filter(id => !isNaN(id));

  if (idNums.length === 0) {
    badRequest(res, '参数格式无效');
    return;
  }

  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  const result = await marketingProductBatchService.batchAuditReject(idNums, operatorId, operatorName, remark);
  ok(res, result, `批量驳回完成：成功${result.success}个，失败${result.failed}个`);
});

export const batchOffline = asyncHandler(async (req: Request, res: Response) => {
  const { ids, remark } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要下架的商品');
    return;
  }

  const idNums = ids.map((id: any) => parseInt(id as string, 10)).filter(id => !isNaN(id));

  if (idNums.length === 0) {
    badRequest(res, '参数格式无效');
    return;
  }

  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  const result = await marketingProductBatchService.batchOffline(idNums, operatorId, operatorName, remark);
  ok(res, result, `批量下架完成：成功${result.success}个，失败${result.failed}个`);
});

export const batchOnline = asyncHandler(async (req: Request, res: Response) => {
  const { ids, remark } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要上架的商品');
    return;
  }

  const idNums = ids.map((id: any) => parseInt(id as string, 10)).filter(id => !isNaN(id));

  if (idNums.length === 0) {
    badRequest(res, '参数格式无效');
    return;
  }

  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  const result = await marketingProductBatchService.batchOnline(idNums, operatorId, operatorName, remark);
  ok(res, result, `批量上架完成：成功${result.success}个，失败${result.failed}个`);
});

export const batchRemove = asyncHandler(async (req: Request, res: Response) => {
  const { ids, remark } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要移除的商品');
    return;
  }

  const idNums = ids.map((id: any) => parseInt(id as string, 10)).filter(id => !isNaN(id));

  if (idNums.length === 0) {
    badRequest(res, '参数格式无效');
    return;
  }

  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  const result = await marketingProductBatchService.batchRemove(idNums, operatorId, operatorName, remark);
  ok(res, result, `批量移除完成：成功${result.success}个，失败${result.failed}个`);
});

export const filterAndOperate = asyncHandler(async (req: Request, res: Response) => {
  const { marketingId, operation, remark, admissionStatus, keyword, categoryId, merchantId, minStock, maxStock, isAbnormal } = req.body;

  if (!marketingId) {
    badRequest(res, '缺少营销活动ID');
    return;
  }

  if (!operation) {
    badRequest(res, '缺少操作类型');
    return;
  }

  const marketingIdNum = parseInt(marketingId as string, 10);
  if (isNaN(marketingIdNum)) {
    badRequest(res, '营销活动ID格式无效');
    return;
  }

  const validOperations = ['audit_pass', 'audit_reject', 'offline', 'online', 'remove'];
  if (!validOperations.includes(operation as string)) {
    badRequest(res, '不支持的操作类型');
    return;
  }

  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  const filterParams = {
    marketingId: marketingIdNum,
    admissionStatus: admissionStatus !== undefined && admissionStatus !== null && admissionStatus !== '' ? parseInt(admissionStatus as string, 10) : undefined,
    keyword: keyword as string | undefined,
    categoryId: categoryId ? parseInt(categoryId as string, 10) : undefined,
    merchantId: merchantId ? parseInt(merchantId as string, 10) : undefined,
    minStock: minStock !== undefined && minStock !== null ? parseInt(minStock as string, 10) : undefined,
    maxStock: maxStock !== undefined && maxStock !== null ? parseInt(maxStock as string, 10) : undefined,
    isAbnormal: isAbnormal === true || isAbnormal === 'true',
  };

  const result = await marketingProductBatchService.filterAndOperate(
    filterParams,
    operation as any,
    operatorId,
    operatorName,
    remark
  );

  ok(res, result, `批量操作完成：成功${result.success}个，失败${result.failed}个`);
});

export const batchImportApply = asyncHandler(async (req: Request, res: Response) => {
  const { marketingId, goodsList } = req.body;

  if (!marketingId) {
    badRequest(res, '缺少营销活动ID');
    return;
  }

  if (!goodsList || !Array.isArray(goodsList) || goodsList.length === 0) {
    badRequest(res, '请导入商品数据');
    return;
  }

  const marketingIdNum = parseInt(marketingId as string, 10);
  if (isNaN(marketingIdNum)) {
    badRequest(res, '营销活动ID格式无效');
    return;
  }

  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  const result = await marketingProductBatchService.batchImportApply(
    marketingIdNum,
    goodsList,
    operatorId,
    operatorName
  );

  ok(res, result, `批量导入报名完成：成功${result.success}个，失败${result.failed}个`);
});

export const batchAddCompliantGoods = asyncHandler(async (req: Request, res: Response) => {
  const { marketingId, categoryIds, merchantIds, limit } = req.body;

  if (!marketingId) {
    badRequest(res, '缺少营销活动ID');
    return;
  }

  const marketingIdNum = parseInt(marketingId as string, 10);
  if (isNaN(marketingIdNum)) {
    badRequest(res, '营销活动ID格式无效');
    return;
  }

  const limitNum = limit ? parseInt(limit as string, 10) : 100;

  const categoryIdNums = categoryIds && Array.isArray(categoryIds)
    ? categoryIds.map((id: any) => parseInt(id as string, 10)).filter(id => !isNaN(id))
    : undefined;

  const merchantIdNums = merchantIds && Array.isArray(merchantIds)
    ? merchantIds.map((id: any) => parseInt(id as string, 10)).filter(id => !isNaN(id))
    : undefined;

  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  const result = await marketingProductBatchService.batchAddCompliantGoods(
    marketingIdNum,
    categoryIdNums,
    merchantIdNums,
    limitNum,
    operatorId,
    operatorName
  );

  ok(res, result, `批量补充完成：成功${result.success}个，失败${result.failed}个`);
});

export default {
  batchAuditPass,
  batchAuditReject,
  batchOffline,
  batchOnline,
  batchRemove,
  filterAndOperate,
  batchImportApply,
  batchAddCompliantGoods,
};
