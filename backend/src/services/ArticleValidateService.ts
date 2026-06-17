import { daos } from '../dao';
import { SensitiveWord } from '../models/SensitiveWord';

export interface ValidateError {
  field: string;
  message: string;
  code: string;
}

export interface SensitiveHit {
  word: string;
  type: number;
  level: number;
  position: number;
  context: string;
}

export interface TemplateConfig {
  template: string;
  min_width: number;
  min_height: number;
}

export interface WordConfig {
  min: number;
  max: number;
  recommended: number;
}

export interface ChannelTemplateConfig {
  channel: string;
  template: string;
  word_config: WordConfig;
  image_config: TemplateConfig;
}

export interface ValidateCreateData {
  title: string;
  summary?: string;
  content?: string;
  cover_image?: string;
  images_json?: Array<{ url: string; width?: number; height?: number }>;
  domain_category_id?: number;
  channel?: string;
  template?: string;
  publisher_id?: number;
  publisher_type?: number;
}

export interface ValidateCreateResult {
  valid: boolean;
  errors: ValidateError[];
  sensitive_hits: SensitiveHit[];
  template_config: TemplateConfig | null;
  word_config: WordConfig | null;
}

const CHANNEL_TEMPLATE_MAP: Record<string, ChannelTemplateConfig> = {
  homepage: {
    channel: 'homepage',
    template: 'full_width',
    word_config: { min: 1500, max: 10000, recommended: 3000 },
    image_config: { template: 'full_width', min_width: 750, min_height: 400 },
  },
  infopage: {
    channel: 'infopage',
    template: 'article_default',
    word_config: { min: 500, max: 15000, recommended: 2000 },
    image_config: { template: 'article_default', min_width: 750, min_height: 300 },
  },
  special: {
    channel: 'special',
    template: 'topic_special',
    word_config: { min: 0, max: 999999, recommended: 1500 },
    image_config: { template: 'topic_special', min_width: 750, min_height: 300 },
  },
};

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

class ArticleValidateService {
  private readonly sensitiveWordDao = daos.sensitiveWordDao;
  private readonly categoryDao = daos.categoryDao;

  async validateCreate(data: ValidateCreateData): Promise<ValidateCreateResult> {
    const errors: ValidateError[] = [];
    const {
      title,
      summary,
      content,
      images_json,
      domain_category_id,
      channel,
      template,
      publisher_id,
      publisher_type,
    } = data;

    if (!title || title.trim().length === 0) {
      errors.push({ field: 'title', message: '标题不能为空', code: 'TITLE_REQUIRED' });
    } else if (title.length > 255) {
      errors.push({ field: 'title', message: '标题不能超过255字符', code: 'TITLE_TOO_LONG' });
    }

    if (summary && summary.length > 500) {
      errors.push({ field: 'summary', message: '摘要不能超过500字符', code: 'SUMMARY_TOO_LONG' });
    }

    if (domain_category_id !== undefined && domain_category_id !== null) {
      const category = await this.categoryDao.findById(domain_category_id);
      if (!category) {
        errors.push({ field: 'domain_category_id', message: '领域分类不存在', code: 'CATEGORY_NOT_FOUND' });
      }
    }

    if (publisher_id !== undefined && publisher_type !== undefined) {
      const permResult = await this.checkPublishPermission(
        publisher_id,
        publisher_type,
        channel
      );
      if (!permResult.valid) {
        errors.push(...permResult.errors);
      }
    }

    const channelConfig = channel ? this.getChannelTemplate(channel) : null;
    const wordConfig = channelConfig ? channelConfig.word_config : null;
    const templateConfig = channelConfig ? channelConfig.image_config : null;

    if (channel && template) {
      if (channelConfig && channelConfig.template !== template) {
        errors.push({
          field: 'template',
          message: `渠道 ${channel} 推荐模板为 ${channelConfig.template}`,
          code: 'TEMPLATE_NOT_MATCH_CHANNEL',
        });
      }
    }

    if (wordConfig && content) {
      const wordCount = this.countWords(content);
      if (wordConfig.min > 0 && wordCount < wordConfig.min) {
        errors.push({
          field: 'content',
          message: `正文字数不足，当前 ${wordCount} 字，最少 ${wordConfig.min} 字`,
          code: 'WORD_COUNT_TOO_LOW',
        });
      }
      if (wordCount > wordConfig.max) {
        errors.push({
          field: 'content',
          message: `正文字数超出，当前 ${wordCount} 字，最多 ${wordConfig.max} 字`,
          code: 'WORD_COUNT_TOO_HIGH',
        });
      }
    }

    if (images_json && Array.isArray(images_json) && images_json.length > 0) {
      const minWidth = templateConfig?.min_width ?? 750;
      const minHeight = templateConfig?.min_height ?? 300;
      for (let i = 0; i < images_json.length; i++) {
        const img = images_json[i];
        if (img.width !== undefined && img.height !== undefined) {
          if (img.width < minWidth || img.height < minHeight) {
            errors.push({
              field: `images_json[${i}]`,
              message: `配图分辨率不足，要求至少 ${minWidth}x${minHeight}`,
              code: 'IMAGE_RESOLUTION_LOW',
            });
          }
        }
      }
    }

    if (content) {
      const linkErrors = this.validateContentLinks(content);
      if (linkErrors.length > 0) {
        errors.push(...linkErrors);
      }
    }

    const sensitiveHits: SensitiveHit[] = [];
    const scanText = [title, summary ?? '', content ?? ''].join(' ');
    if (scanText.trim().length > 0) {
      const hits = await this.scanSensitiveWords(scanText);
      sensitiveHits.push(...hits);
    }

    return {
      valid: errors.length === 0,
      errors,
      sensitive_hits: sensitiveHits,
      template_config: templateConfig,
      word_config: wordConfig,
    };
  }

  getChannelTemplate(channel: string): ChannelTemplateConfig | null {
    return CHANNEL_TEMPLATE_MAP[channel] || null;
  }

  async scanSensitiveWords(text: string): Promise<SensitiveHit[]> {
    const hits: SensitiveHit[] = [];
    if (!text) return hits;

    const allWords = await this.sensitiveWordDao.findAll({
      where: { status: 1 },
    });

    const wordList = allWords as SensitiveWord[];
    const textLower = text.toLowerCase();

    for (const sw of wordList) {
      const wordLower = sw.word.toLowerCase();
      let searchIndex = 0;
      while (true) {
        const idx = textLower.indexOf(wordLower, searchIndex);
        if (idx === -1) break;
        const contextStart = Math.max(0, idx - 10);
        const contextEnd = Math.min(text.length, idx + sw.word.length + 10);
        hits.push({
          word: sw.word,
          type: sw.type,
          level: sw.level,
          position: idx,
          context: text.substring(contextStart, contextEnd),
        });
        searchIndex = idx + sw.word.length;
      }
    }

    return hits;
  }

  private async checkPublishPermission(
    _publisherId: number,
    publisherType: number,
    channel?: string
  ): Promise<{ valid: boolean; errors: ValidateError[] }> {
    const errors: ValidateError[] = [];

    if (![1, 2, 3].includes(publisherType)) {
      errors.push({
        field: 'publisher_type',
        message: '发布人类型不合法，应为：1管理员 2运营 3商家',
        code: 'PUBLISHER_TYPE_INVALID',
      });
    }

    if (channel === 'homepage' && publisherType === 3) {
      errors.push({
        field: 'channel',
        message: '商家无首页发布权限',
        code: 'CHANNEL_PERMISSION_DENIED',
      });
    }

    return { valid: errors.length === 0, errors };
  }

  private countWords(content: string): number {
    const chinese = content.match(/[\u4e00-\u9fa5]/g) || [];
    const english = content.match(/[a-zA-Z]+/g) || [];
    return chinese.length + english.length;
  }

  private validateContentLinks(content: string): ValidateError[] {
    const errors: ValidateError[] = [];
    const matches = content.match(URL_REGEX) || [];
    const urlPattern = /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/i;

    for (let i = 0; i < matches.length; i++) {
      const url = matches[i];
      if (!urlPattern.test(url)) {
        errors.push({
          field: `content.link[${i}]`,
          message: `链接格式无效：${url}`,
          code: 'URL_FORMAT_INVALID',
        });
      }
    }

    return errors;
  }
}

export const articleValidateService = new ArticleValidateService();
export default ArticleValidateService;
