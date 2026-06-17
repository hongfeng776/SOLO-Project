import { Request, Response } from 'express';
import { daos } from '../dao';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';

export const getCategoryTree = asyncHandler(async (_req: Request, res: Response) => {
  const { categoryTraceService } = await import('../services/CategoryTraceService');
  const tree = await categoryTraceService.getTreeWithStats();
  ok(res, tree, '获取类目树成功');
});

export const getCategoryList = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, level, status, parent_id, keyword } = req.query;

  const where: Record<string, unknown> = {} as Record<string, unknown>;

  if (level !== undefined) {
    where.level = parseInt(level as string, 10);
  }
  if (status !== undefined) {
    where.status = parseInt(status as string, 10);
  }
  if (parent_id !== undefined) {
    where.parent_id = parseInt(parent_id as string, 10);
  }
  if (keyword) {
    const { Op } = await import('sequelize');
    (where as Record<string, unknown>)[Op.or as unknown as string] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { code: { [Op.like]: `%${keyword}%` } },
    ];
  }

  const result = await daos.categoryDao.findPage({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    where,
    order: [['sort', 'ASC'], ['id', 'ASC']],
  });

  ok(res, result, '获取类目列表成功');
});

export const getCategoryDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少类目ID');
    return;
  }

  const category = await daos.categoryDao.findById(parseInt(id, 10));
  if (!category) {
    throw new AppError('类目不存在', 404);
  }

  ok(res, category, '获取类目详情成功');
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const {
    code,
    name,
    parent_id,
    icon,
    level_limit,
    sort,
    status,
    required_fields_json,
    compliance_rules_json,
    created_by,
  } = req.body;

  if (!code || !name) {
    badRequest(res, '缺少必要参数：code, name');
    return;
  }

  const parentId = parent_id !== undefined ? parseInt(parent_id, 10) : 0;

  const { categoryValidateService } = await import('../services/CategoryValidateService');
  const validateResult = await categoryValidateService.validateCreate(
    parentId,
    { code, name, parent_id: parentId, icon, sort, required_fields_json, compliance_rules_json },
    created_by ? parseInt(created_by, 10) : 0
  );

  if (!validateResult.valid) {
    ok(res, { valid: false, errors: validateResult.errors }, '参数校验失败');
    return;
  }

  let level = 1;
  if (parentId > 0) {
    const parent = await daos.categoryDao.findById(parentId);
    if (parent) {
      level = (parent.level ?? 1) + 1;
    }
  }

  const category = await daos.categoryDao.create({
    code: code.trim(),
    name: name.trim(),
    parent_id: parentId,
    icon,
    level,
    level_limit: level_limit !== undefined ? parseInt(level_limit, 10) : 3,
    sort: sort !== undefined ? parseInt(sort, 10) : 0,
    status: status !== undefined ? parseInt(status, 10) : 1,
    has_children: 0,
    product_count: 0,
    required_fields_json,
    compliance_rules_json,
    created_by: created_by ? parseInt(created_by, 10) : undefined,
    updated_by: created_by ? parseInt(created_by, 10) : undefined,
  } as any);

  if (parentId > 0) {
    await daos.categoryDao.updateHasChildren(parentId, 1);
  }

  await daos.categoryLogDao.create({
    category_id: category.id,
    operator_id: created_by ? parseInt(created_by, 10) : undefined,
    operator_type: 1,
    action: 'create',
    new_data_json: {
      parent_id: parentId,
      name: name.trim(),
      sort: sort !== undefined ? parseInt(sort, 10) : 0,
      status: status !== undefined ? parseInt(status, 10) : 1,
    },
    changed_fields: ['code', 'name', 'parent_id', 'level'],
  } as any);

  ok(res, category, '创建类目成功');
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    code,
    name,
    parent_id,
    icon,
    level_limit,
    sort,
    status,
    required_fields_json,
    compliance_rules_json,
    updated_by,
  } = req.body;

  if (!id) {
    badRequest(res, '缺少类目ID');
    return;
  }

  const categoryId = parseInt(id, 10);
  const existing = await daos.categoryDao.findById(categoryId);
  if (!existing) {
    throw new AppError('类目不存在', 404);
  }

  const updateData: Record<string, unknown> = {};

  if (code !== undefined) {
    const trimmedCode = code.trim();
    const codeDuplicate = await daos.categoryDao.findByCode(trimmedCode);
    if (codeDuplicate && codeDuplicate.id !== categoryId) {
      throw new AppError(`类目编码已存在：${trimmedCode}`, 400);
    }
    updateData.code = trimmedCode;
  }

  if (name !== undefined) {
    const trimmedName = name.trim();
    const effectiveParentId = parent_id !== undefined ? parseInt(parent_id, 10) : (existing.parent_id ?? 0);
    const nameDuplicate = await daos.categoryDao.findByParentAndName(effectiveParentId, trimmedName, categoryId);
    if (nameDuplicate) {
      throw new AppError('同级类目下名称已存在', 400);
    }
    updateData.name = trimmedName;
  }

  if (parent_id !== undefined) {
    const newParentId = parseInt(parent_id, 10);
    let newLevel = 1;
    if (newParentId > 0) {
      const newParent = await daos.categoryDao.findById(newParentId);
      if (!newParent) {
        throw new AppError('目标父级类目不存在', 400);
      }
      newLevel = (newParent.level ?? 1) + 1;
      if (newLevel > 3) {
        throw new AppError('层级超限，最多3级', 400);
      }

      const descendants = await daos.categoryDao.findAllIdsDescendants(categoryId);
      if (descendants.includes(newParentId) || newParentId === categoryId) {
        throw new AppError('不能将类目移动到自身或其子级下', 400);
      }
    }
    updateData.parent_id = newParentId;
    updateData.level = newLevel;
  }

  if (icon !== undefined) updateData.icon = icon;
  if (level_limit !== undefined) updateData.level_limit = parseInt(level_limit, 10);
  if (sort !== undefined) updateData.sort = parseInt(sort, 10);
  if (status !== undefined) updateData.status = parseInt(status, 10);
  if (required_fields_json !== undefined) updateData.required_fields_json = required_fields_json;
  if (compliance_rules_json !== undefined) updateData.compliance_rules_json = compliance_rules_json;
  if (updated_by !== undefined) updateData.updated_by = parseInt(updated_by, 10);

  const oldData = {
    parent_id: existing.parent_id,
    name: existing.name,
    sort: existing.sort,
    status: existing.status,
  };

  const changedFields: string[] = Object.keys(updateData).filter(
    (key) => updateData[key] !== (existing as unknown as Record<string, unknown>)[key]
  );

  if (changedFields.length === 0) {
    ok(res, existing, '无变更内容');
    return;
  }

  await daos.categoryDao.update(categoryId, updateData);

  if (parent_id !== undefined) {
    const newParentId = parseInt(parent_id, 10);
    const oldParentId = existing.parent_id ?? 0;
    if (oldParentId > 0) {
      const oldChildren = await daos.categoryDao.findByParentId(oldParentId);
      await daos.categoryDao.updateHasChildren(oldParentId, oldChildren.length > 0 ? 1 : 0);
    }
    if (newParentId > 0) {
      await daos.categoryDao.updateHasChildren(newParentId, 1);
    }
  }

  await daos.categoryLogDao.create({
    category_id: categoryId,
    operator_id: updated_by ? parseInt(updated_by, 10) : undefined,
    operator_type: 1,
    action: 'update',
    old_data_json: oldData,
    new_data_json: {
      parent_id: updateData.parent_id ?? existing.parent_id,
      name: updateData.name ?? existing.name,
      sort: updateData.sort ?? existing.sort,
      status: updateData.status ?? existing.status,
    },
    changed_fields: changedFields,
  } as any);

  const updated = await daos.categoryDao.findById(categoryId);
  ok(res, updated, '更新类目成功');
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { operator_id } = req.body;

  if (!id) {
    badRequest(res, '缺少类目ID');
    return;
  }

  const categoryId = parseInt(id, 10);
  const category = await daos.categoryDao.findById(categoryId);
  if (!category) {
    throw new AppError('类目不存在', 404);
  }

  if ((category.has_children ?? 0) === 1) {
    throw new AppError('该类目下存在子级类目，无法删除', 400);
  }

  if ((category.product_count ?? 0) > 0) {
    throw new AppError('该类目下存在商品，无法删除', 400);
  }

  const parentId = category.parent_id ?? 0;

  await daos.categoryPermissionDao.batchDeleteByCategoryId(categoryId);
  await daos.categoryDao.delete(categoryId);

  if (parentId > 0) {
    const remainingChildren = await daos.categoryDao.findByParentId(parentId);
    await daos.categoryDao.updateHasChildren(parentId, remainingChildren.length > 0 ? 1 : 0);
  }

  await daos.categoryLogDao.create({
    category_id: categoryId,
    operator_id: operator_id ? parseInt(operator_id, 10) : undefined,
    operator_type: 1,
    action: 'delete',
    old_data_json: {
      parent_id: category.parent_id,
      name: category.name,
      sort: category.sort,
      status: category.status,
    },
    changed_fields: [],
  } as any);

  ok(res, null, '删除类目成功');
});

export const getCategoryLogs = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { limit } = req.query;

  if (!id) {
    badRequest(res, '缺少类目ID');
    return;
  }

  const logs = await daos.categoryLogDao.findByCategoryId(
    parseInt(id, 10),
    limit ? parseInt(limit as string, 10) : 100
  );
  ok(res, logs, '获取类目操作日志成功');
});

export default {
  getCategoryTree,
  getCategoryList,
  getCategoryDetail,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryLogs,
};
