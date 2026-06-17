import { Request, Response } from 'express';
import { categoryValidateService, CategoryCreateData } from '../services/CategoryValidateService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const validateCreate = asyncHandler(async (req: Request, res: Response) => {
  const { parent_id, code, name, icon, sort, required_fields_json, compliance_rules_json, operator_id } = req.body;

  if (parent_id === undefined || !code || !name) {
    badRequest(res, '缺少必要参数：parent_id, code, name');
    return;
  }

  const data: CategoryCreateData = {
    code,
    name,
    parent_id: parseInt(parent_id, 10),
    icon,
    sort: sort !== undefined ? parseInt(sort, 10) : undefined,
    required_fields_json,
    compliance_rules_json,
  };

  const operatorId = operator_id ? parseInt(operator_id, 10) : 0;
  const result = await categoryValidateService.validateCreate(data.parent_id!, data, operatorId);
  ok(res, result, result.valid ? '校验通过' : '校验不通过');
});

export const canSubmitCreate = asyncHandler(async (req: Request, res: Response) => {
  const { parentId } = req.query;

  if (parentId === undefined) {
    badRequest(res, '缺少上级类目ID');
    return;
  }

  const result = await categoryValidateService.canSubmitCreate(parseInt(parentId as string, 10));
  ok(res, { can_submit: result }, result ? '可以提交' : '不可提交');
});

export const getLevelQualificationRules = asyncHandler(async (req: Request, res: Response) => {
  const { level } = req.query;

  if (level === undefined) {
    const allRules = categoryValidateService.getAllQualificationRules();
    ok(res, allRules, '获取所有资质规则成功');
    return;
  }

  const rules = categoryValidateService.getLevelQualificationRules(parseInt(level as string, 10));
  ok(res, rules, '获取资质规则成功');
});

export const checkCodeUnique = asyncHandler(async (req: Request, res: Response) => {
  const { code, id } = req.query;

  if (!code) {
    badRequest(res, '缺少类目编码');
    return;
  }

  const result = await categoryValidateService.checkCodeUnique(
    code as string,
    id ? parseInt(id as string, 10) : undefined
  );
  ok(res, result, result.valid ? '类目编码可用' : '类目编码已存在');
});

export const checkNameUnique = asyncHandler(async (req: Request, res: Response) => {
  const { parentId, name, id } = req.query;

  if (parentId === undefined || !name) {
    badRequest(res, '缺少必要参数：parentId, name');
    return;
  }

  const result = await categoryValidateService.checkNameUnique(
    parseInt(parentId as string, 10),
    name as string,
    id ? parseInt(id as string, 10) : undefined
  );
  ok(res, result, result.valid ? '类目名称可用' : '同级类目名称已存在');
});

export default {
  validateCreate,
  canSubmitCreate,
  getLevelQualificationRules,
  checkCodeUnique,
  checkNameUnique,
};
