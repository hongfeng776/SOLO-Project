import { Request, Response } from 'express';
import { articleTraceService } from '../services/ArticleTraceService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const getArticleFullTrace = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少图文ID');
    return;
  }

  const result = await articleTraceService.getArticleFullTrace(parseInt(id, 10));
  ok(res, result, '获取完整溯源成功');
});

export const checkDuplicate = asyncHandler(async (req: Request, res: Response) => {
  const { title, content, exclude_id } = req.body;

  if (!title && !content) {
    badRequest(res, '请提供标题或正文进行检测');
    return;
  }

  const result = await articleTraceService.checkDuplicate(
    title || '',
    content || '',
    exclude_id ? parseInt(exclude_id, 10) : undefined
  );
  ok(res, result, result.has_duplicate ? '检测到重复内容' : '未检测到重复内容');
});

export const validateQuality = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少图文ID');
    return;
  }

  const result = await articleTraceService.validateQuality(parseInt(id, 10));
  ok(res, result, '质量检测完成');
});

export default {
  getArticleFullTrace,
  checkDuplicate,
  validateQuality,
};
