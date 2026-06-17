import { Request, Response } from 'express';
import {
  articleEditorService,
  IncrementalPatchData,
  FullEditData,
  DraftSaveData,
} from '../services/ArticleEditorService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const getEditMode = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少图文ID');
    return;
  }

  const result = await articleEditorService.getEditMode(parseInt(id, 10));
  ok(res, { mode: result.mode, article: result.article }, '获取编辑模式成功');
});

export const incrementalEdit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    summary, cover_image, images_json, domain_category_id, channel,
    template, top_flag, sort_weight, topic_id, editor_id, change_log,
  } = req.body;

  if (!id) {
    badRequest(res, '缺少图文ID');
    return;
  }

  if (!editor_id) {
    badRequest(res, '缺少编辑人ID');
    return;
  }

  const patchData: IncrementalPatchData = {
    summary,
    cover_image,
    images_json,
    domain_category_id: domain_category_id ? parseInt(domain_category_id, 10) : undefined,
    channel,
    template,
    top_flag: top_flag !== undefined ? parseInt(top_flag, 10) : undefined,
    sort_weight: sort_weight !== undefined ? parseInt(sort_weight, 10) : undefined,
    topic_id: topic_id ? parseInt(topic_id, 10) : undefined,
  };

  const result = await articleEditorService.incrementalEdit(
    parseInt(id, 10),
    patchData,
    parseInt(editor_id, 10),
    change_log
  );
  ok(res, result, '增量修改成功');
});

export const fullEdit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    title, summary, content, cover_image, images_json,
    domain_category_id, channel, template, word_count, topic_id,
    change_log, editor_id,
  } = req.body;

  if (!id) {
    badRequest(res, '缺少图文ID');
    return;
  }

  if (!editor_id) {
    badRequest(res, '缺少编辑人ID');
    return;
  }

  const fullData: FullEditData = {
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
    change_log,
  };

  const result = await articleEditorService.fullEdit(
    parseInt(id, 10),
    fullData,
    parseInt(editor_id, 10),
    change_log
  );
  ok(res, result, '全覆盖修改成功');
});

export const draftSave = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    title, summary, content, cover_image, images_json,
    domain_category_id, channel, template, word_count, topic_id,
  } = req.body;

  if (!id) {
    badRequest(res, '缺少图文ID');
    return;
  }

  const data: DraftSaveData = {
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
  };

  const article = await articleEditorService.draftSave(parseInt(id, 10), data);
  ok(res, article, '草稿保存成功');
});

export const submitReview = asyncHandler(async (req: Request, res: Response) => {
  const { id, version } = req.params;
  const { reviewer_id } = req.body;

  if (!id || version === undefined || version === null) {
    badRequest(res, '缺少图文ID或版本号');
    return;
  }

  const versionRecord = await articleEditorService.submitReview(
    parseInt(id, 10),
    parseInt(version as string, 10),
    reviewer_id ? parseInt(reviewer_id, 10) : undefined
  );
  ok(res, versionRecord, '提交审核成功');
});

export default {
  getEditMode,
  incrementalEdit,
  fullEdit,
  draftSave,
  submitReview,
};
