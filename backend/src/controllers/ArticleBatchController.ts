import { Request, Response } from 'express';
import {
  articleBatchService,
  AdvancedFilterParams,
} from '../services/ArticleBatchService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const batchTopArticles = asyncHandler(async (req: Request, res: Response) => {
  const { ids, operator_id, operator_role } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要置顶的图文');
    return;
  }

  if (!operator_id || !operator_role) {
    badRequest(res, '缺少操作人信息');
    return;
  }

  const result = await articleBatchService.batchTopArticles(
    ids.map((id: string | number) => parseInt(String(id), 10)),
    parseInt(operator_id, 10),
    parseInt(operator_role, 10)
  );
  ok(res, result, `批量置顶完成，成功 ${result.success} 条`);
});

export const batchOfflineArticles = asyncHandler(async (req: Request, res: Response) => {
  const { ids, operator_id, operator_role, reason } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要下架的图文');
    return;
  }

  if (!operator_id || !operator_role) {
    badRequest(res, '缺少操作人信息');
    return;
  }

  const result = await articleBatchService.batchOfflineArticles(
    ids.map((id: string | number) => parseInt(String(id), 10)),
    parseInt(operator_id, 10),
    parseInt(operator_role, 10),
    reason
  );
  ok(res, result, `批量下架完成，成功 ${result.success} 条`);
});

export const batchAssignTopic = asyncHandler(async (req: Request, res: Response) => {
  const { ids, topic_id, operator_id, operator_role } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要归类的图文');
    return;
  }

  if (!topic_id) {
    badRequest(res, '缺少专题ID');
    return;
  }

  if (!operator_id || !operator_role) {
    badRequest(res, '缺少操作人信息');
    return;
  }

  const result = await articleBatchService.batchAssignTopic(
    ids.map((id: string | number) => parseInt(String(id), 10)),
    parseInt(topic_id, 10),
    parseInt(operator_id, 10),
    parseInt(operator_role, 10)
  );
  ok(res, result, `批量归类完成，成功 ${result.success} 条`);
});

export const getOperableScope = asyncHandler(async (req: Request, res: Response) => {
  const { operator_id, operator_role } = req.query;

  if (!operator_id || !operator_role) {
    badRequest(res, '缺少操作人信息');
    return;
  }

  const scope = articleBatchService.getOperableScope(
    parseInt(operator_id as string, 10),
    parseInt(operator_role as string, 10)
  );
  ok(res, scope, '获取权限范围成功');
});

export const advancedFilter = asyncHandler(async (req: Request, res: Response) => {
  const {
    page, pageSize, view_count_min, view_count_max, like_count_min, like_count_max,
    published_at_start, published_at_end, domain_category_id, channel, top_flag,
    status, publisher_id, topic_id, keyword, sort_field, sort_order,
    operator_id, operator_role,
  } = req.body;

  const params: AdvancedFilterParams = {
    page: page ? parseInt(page, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    view_count_min: view_count_min ? parseInt(view_count_min, 10) : undefined,
    view_count_max: view_count_max ? parseInt(view_count_max, 10) : undefined,
    like_count_min: like_count_min ? parseInt(like_count_min, 10) : undefined,
    like_count_max: like_count_max ? parseInt(like_count_max, 10) : undefined,
    published_at_start,
    published_at_end,
    domain_category_id: parseParamArray(domain_category_id),
    channel: parseParamStringArray(channel),
    top_flag: top_flag !== undefined ? parseInt(top_flag, 10) : undefined,
    status: parseParamArray(status),
    publisher_id: publisher_id ? parseInt(publisher_id, 10) : undefined,
    topic_id: topic_id ? parseInt(topic_id, 10) : undefined,
    keyword,
    sort_field,
    sort_order: sort_order as 'ASC' | 'DESC',
  };

  const result = await articleBatchService.advancedFilter(
    params,
    operator_id ? parseInt(operator_id, 10) : undefined,
    operator_role ? parseInt(operator_role, 10) : undefined
  );

  const abilities = operator_id && operator_role
    ? await articleBatchService.abilityList(
        result.list,
        parseInt(operator_id, 10),
        parseInt(operator_role, 10)
      )
    : [];

  ok(res, { ...result, abilities }, '高级筛选完成');
});

export const abilityList = asyncHandler(async (req: Request, res: Response) => {
  const { list, operator_id, operator_role } = req.body;

  if (!list || !Array.isArray(list)) {
    badRequest(res, '缺少图文列表');
    return;
  }

  if (!operator_id || !operator_role) {
    badRequest(res, '缺少操作人信息');
    return;
  }

  const abilities = await articleBatchService.abilityList(
    list,
    parseInt(operator_id, 10),
    parseInt(operator_role, 10)
  );
  ok(res, abilities, '获取权限标记完成');
});

function parseParamArray(val: unknown): number | number[] | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (Array.isArray(val)) return val.map((v) => parseInt(String(v), 10));
  return parseInt(String(val), 10);
}

function parseParamStringArray(val: unknown): string | string[] | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (Array.isArray(val)) return val;
  return String(val);
}

export default {
  batchTopArticles,
  batchOfflineArticles,
  batchAssignTopic,
  getOperableScope,
  advancedFilter,
  abilityList,
};
