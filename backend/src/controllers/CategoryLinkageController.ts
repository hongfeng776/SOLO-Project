import { Request, Response } from 'express';
import { categoryLinkageService, CategoryUpdateData } from '../services/CategoryLinkageService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const updateCategoryWithLinkage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    code,
    parent_id,
    icon,
    sort,
    status,
    required_fields_json,
    compliance_rules_json,
    need_confirm,
    operator_id,
    operator_type,
  } = req.body;

  if (!id) {
    badRequest(res, '缺少类目ID');
    return;
  }

  const data: CategoryUpdateData = {};
  if (name !== undefined) data.name = name;
  if (code !== undefined) data.code = code;
  if (parent_id !== undefined) data.parent_id = parseInt(parent_id, 10);
  if (icon !== undefined) data.icon = icon;
  if (sort !== undefined) data.sort = parseInt(sort, 10);
  if (status !== undefined) data.status = parseInt(status, 10);
  if (required_fields_json !== undefined) data.required_fields_json = required_fields_json;
  if (compliance_rules_json !== undefined) data.compliance_rules_json = compliance_rules_json;
  if (operator_id !== undefined) data.updated_by = parseInt(operator_id, 10);

  const categoryId = parseInt(id, 10);
  const operatorId = operator_id ? parseInt(operator_id, 10) : 0;
  const operatorType = operator_type ? parseInt(operator_type, 10) : 1;
  const needConfirm = need_confirm === true || need_confirm === 'true';

  const result = await categoryLinkageService.updateCategoryWithLinkage(
    categoryId,
    data,
    operatorId,
    needConfirm,
    operatorType
  );

  if (result.needConfirm) {
    ok(res, result, '需要二次确认');
  } else {
    ok(res, result, result.message || '更新类目成功');
  }
});

export const getEditPermissionType = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少类目ID');
    return;
  }

  const result = await categoryLinkageService.getEditPermissionType(parseInt(id, 10));
  ok(res, { permission_type: result }, '获取编辑权限类型成功');
});

export const confirmUpdate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    code,
    parent_id,
    icon,
    sort,
    status,
    required_fields_json,
    compliance_rules_json,
    operator_id,
    operator_type,
  } = req.body;

  if (!id) {
    badRequest(res, '缺少类目ID');
    return;
  }

  const data: CategoryUpdateData = {};
  if (name !== undefined) data.name = name;
  if (code !== undefined) data.code = code;
  if (parent_id !== undefined) data.parent_id = parseInt(parent_id, 10);
  if (icon !== undefined) data.icon = icon;
  if (sort !== undefined) data.sort = parseInt(sort, 10);
  if (status !== undefined) data.status = parseInt(status, 10);
  if (required_fields_json !== undefined) data.required_fields_json = required_fields_json;
  if (compliance_rules_json !== undefined) data.compliance_rules_json = compliance_rules_json;
  if (operator_id !== undefined) data.updated_by = parseInt(operator_id, 10);

  const categoryId = parseInt(id, 10);
  const operatorId = operator_id ? parseInt(operator_id, 10) : 0;
  const operatorType = operator_type ? parseInt(operator_type, 10) : 1;

  const result = await categoryLinkageService.updateCategoryWithLinkage(
    categoryId,
    data,
    operatorId,
    true,
    operatorType
  );

  ok(res, result, result.message || '确认更新成功');
});

export const getCategoryPreview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少类目ID');
    return;
  }

  const { daos } = await import('../dao');
  const category = await daos.categoryDao.findById(parseInt(id, 10));
  if (!category) {
    badRequest(res, '类目不存在');
    return;
  }

  const descendants = await daos.categoryDao.findAllDescendants(parseInt(id, 10));
  const affectedCount = (category.product_count ?? 0) + descendants.reduce(
    (sum, d) => sum + (d.product_count ?? 0),
    0
  );

  ok(res, {
    category: {
      id: category.id,
      name: category.name,
      code: category.code,
      product_count: category.product_count,
    },
    descendant_count: descendants.length,
    affected_product_count: affectedCount,
  }, '获取预览信息成功');
});

export default {
  updateCategoryWithLinkage,
  getEditPermissionType,
  confirmUpdate,
  getCategoryPreview,
};
