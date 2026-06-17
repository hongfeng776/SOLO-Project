import { Request, Response } from 'express';
import { articleValidateService, ValidateCreateData } from '../services/ArticleValidateService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const validateCreate = asyncHandler(async (req: Request, res: Response) => {
  const {
    title, summary, content, cover_image, images_json,
    domain_category_id, channel, template, publisher_id, publisher_type,
  } = req.body;

  if (!title) {
    badRequest(res, '缺少必要参数：title');
    return;
  }

  const data: ValidateCreateData = {
    title,
    summary,
    content,
    cover_image,
    images_json,
    domain_category_id: domain_category_id ? parseInt(domain_category_id, 10) : undefined,
    channel,
    template,
    publisher_id: publisher_id ? parseInt(publisher_id, 10) : undefined,
    publisher_type: publisher_type ? parseInt(publisher_type, 10) : undefined,
  };

  const result = await articleValidateService.validateCreate(data);
  ok(res, result, result.valid ? '校验通过' : '校验不通过');
});

export const getChannelTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { channel } = req.params;

  if (!channel) {
    badRequest(res, '缺少渠道参数');
    return;
  }

  const config = articleValidateService.getChannelTemplate(channel);
  ok(res, config, config ? '获取渠道配置成功' : '未找到该渠道配置');
});

export const scanSensitiveWords = asyncHandler(async (req: Request, res: Response) => {
  const { text } = req.body;

  if (text === undefined || text === null) {
    badRequest(res, '缺少待扫描文本');
    return;
  }

  const hits = await articleValidateService.scanSensitiveWords(String(text));
  ok(res, { hits, count: hits.length }, '敏感词扫描完成');
});

export const checkImageResolution = asyncHandler(async (req: Request, res: Response) => {
  const { images_json, channel } = req.body;

  if (!images_json || !Array.isArray(images_json)) {
    badRequest(res, '缺少配图数据');
    return;
  }

  const config = articleValidateService.getChannelTemplate(channel || 'infopage');
  const minWidth = config?.image_config.min_width ?? 750;
  const minHeight = config?.image_config.min_height ?? 300;

  const results = images_json.map((img: { width?: number; height?: number; url?: string }, idx: number) => {
    const passed = (img.width ?? 0) >= minWidth && (img.height ?? 0) >= minHeight;
    return {
      index: idx,
      url: img.url,
      width: img.width,
      height: img.height,
      passed,
      required: `${minWidth}x${minHeight}`,
    };
  });

  ok(res, { results, all_passed: results.every((r: { passed: boolean; }) => r.passed) }, '配图分辨率检查完成');
});

export const validateLinks = asyncHandler(async (req: Request, res: Response) => {
  const { content } = req.body;

  if (!content) {
    ok(res, { links: [], count: 0, valid: true }, '无内容可检查');
    return;
  }

  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  const links = content.match(urlRegex) || [];
  const urlPattern = /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/i;

  const results = links.map((url: string, idx: number) => ({
    index: idx,
    url,
    valid: urlPattern.test(url),
  }));

  ok(res, { results, count: links.length, all_valid: results.every((r: { valid: boolean; }) => r.valid) }, '链接校验完成');
});

export default {
  validateCreate,
  getChannelTemplate,
  scanSensitiveWords,
  checkImageResolution,
  validateLinks,
};
