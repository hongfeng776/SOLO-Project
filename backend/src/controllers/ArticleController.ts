import { Request, Response } from 'express';
import { articleService, ArticleCreateData, ArticleUpdateData } from '../services/ArticleService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const getArticleList = asyncHandler(async (req: Request, res: Response) => {
  const {
    page, pageSize, title, domain_category_id, channel, status, publisher_id, topic_id,
  } = req.query;

  const result = await articleService.getList({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    title: title as string,
    domain_category_id: domain_category_id ? parseInt(domain_category_id as string, 10) : undefined,
    channel: channel as string,
    status: status !== undefined ? parseInt(status as string, 10) : undefined,
    publisher_id: publisher_id ? parseInt(publisher_id as string, 10) : undefined,
    topic_id: topic_id ? parseInt(topic_id as string, 10) : undefined,
  });

  ok(res, result, '获取图文列表成功');
});

export const getArticleDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少图文ID');
    return;
  }

  const article = await articleService.getById(parseInt(id, 10));
  ok(res, article, '获取图文详情成功');
});

export const getArticleByCode = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;

  if (!code) {
    badRequest(res, '缺少图文编码');
    return;
  }

  const article = await articleService.getByUniqueCode(code as string);
  ok(res, article, '获取图文详情成功');
});

export const createArticle = asyncHandler(async (req: Request, res: Response) => {
  const {
    unique_code, title, summary, content, cover_image, images_json,
    domain_category_id, channel, template, word_count, topic_id,
    publisher_id, publisher_type, status,
  } = req.body;

  if (!unique_code || !title) {
    badRequest(res, '缺少必要参数：unique_code, title');
    return;
  }

  const data: ArticleCreateData = {
    unique_code,
    title,
    summary,
    content,
    cover_image,
    images_json,
    domain_category_id: domain_category_id ? parseInt(domain_category_id, 10) : undefined,
    channel,
    template,
    word_count: word_count ? parseInt(word_count, 10) : undefined,
    topic_id: topic_id ? parseInt(topic_id, 10) : undefined,
    publisher_id: publisher_id ? parseInt(publisher_id, 10) : undefined,
    publisher_type: publisher_type ? parseInt(publisher_type, 10) : undefined,
    status: status !== undefined ? parseInt(status, 10) : undefined,
  };

  const article = await articleService.create(data);
  ok(res, article, '创建图文成功');
});

export const updateArticle = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    title, summary, content, cover_image, images_json,
    domain_category_id, channel, template, word_count, topic_id,
    status, top_flag, sort_weight,
  } = req.body;

  if (!id) {
    badRequest(res, '缺少图文ID');
    return;
  }

  const data: ArticleUpdateData = {};

  if (title !== undefined) data.title = title;
  if (summary !== undefined) data.summary = summary;
  if (content !== undefined) data.content = content;
  if (cover_image !== undefined) data.cover_image = cover_image;
  if (images_json !== undefined) data.images_json = images_json;
  if (domain_category_id !== undefined) data.domain_category_id = parseInt(domain_category_id, 10);
  if (channel !== undefined) data.channel = channel;
  if (template !== undefined) data.template = template;
  if (word_count !== undefined) data.word_count = parseInt(word_count, 10);
  if (topic_id !== undefined) data.topic_id = parseInt(topic_id, 10);
  if (status !== undefined) data.status = parseInt(status, 10);
  if (top_flag !== undefined) data.top_flag = parseInt(top_flag, 10);
  if (sort_weight !== undefined) data.sort_weight = parseInt(sort_weight, 10);

  const article = await articleService.update(parseInt(id, 10), data);
  ok(res, article, '更新图文成功');
});

export const deleteArticle = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少图文ID');
    return;
  }

  await articleService.delete(parseInt(id, 10));
  ok(res, null, '删除图文成功');
});

export const batchDeleteArticles = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要删除的图文');
    return;
  }

  const count = await articleService.batchDelete(
    ids.map((id: string | number) => parseInt(String(id), 10))
  );
  ok(res, { count }, `批量删除成功，共删除 ${count} 条记录`);
});

export const updateArticleStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id) {
    badRequest(res, '缺少图文ID');
    return;
  }

  if (status === undefined || status === null) {
    badRequest(res, '缺少状态参数');
    return;
  }

  const article = await articleService.updateStatus(parseInt(id, 10), parseInt(status, 10));
  ok(res, article, '更新图文状态成功');
});

export default {
  getArticleList,
  getArticleDetail,
  getArticleByCode,
  createArticle,
  updateArticle,
  deleteArticle,
  batchDeleteArticles,
  updateArticleStatus,
};
