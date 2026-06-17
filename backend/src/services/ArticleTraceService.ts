import { Op } from 'sequelize';
import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';
import { Article } from '../models/Article';
import { ArticleVersion } from '../models/ArticleVersion';
import { ArticleTopic } from '../models/ArticleTopic';
import { ArticleReviewLog } from '../models/ArticleReviewLog';
import { articleValidateService } from './ArticleValidateService';

export interface VersionTimelineItem {
  id: number;
  version: number;
  title: string;
  editor_id: number;
  edit_type: number;
  reviewed_status: number;
  review_remark?: string;
  created_at: Date;
}

export interface ReviewTimelineItem {
  id: number;
  action: string;
  reviewer_id: number;
  before_status: number;
  after_status: number;
  remark?: string;
  created_at: Date;
}

export interface TopicInfoResult {
  topic: ArticleTopic | null;
  related_articles: Article[];
}

export interface ArticleFullTraceResult {
  basic: {
    article: Article;
    publisher_info?: unknown;
  };
  versionTimeline: VersionTimelineItem[];
  topicInfo: TopicInfoResult;
  reviewTimeline: ReviewTimelineItem[];
}

export interface DuplicateArticleItem {
  id: number;
  title: string;
  unique_code: string;
  similarity: number;
  match_reason: string;
  publisher_id?: number;
  published_at?: Date;
}

export interface CheckDuplicateResult {
  has_duplicate: boolean;
  title_dup_articles: DuplicateArticleItem[];
  content_dup_articles: DuplicateArticleItem[];
  similarity_report: {
    title_similarity_max: number;
    content_keyword_overlap: number;
    overall_rating: string;
  };
}

export interface QualityDimension {
  name: string;
  passed: boolean;
  detail: string;
}

export interface ValidateQualityResult {
  quality_score: number;
  dimensions: QualityDimension[];
  warnings: string[];
}

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
const TITLE_DUP_THRESHOLD = 80;

class ArticleTraceService {
  private readonly articleDao = daos.articleDao;
  private readonly articleVersionDao = daos.articleVersionDao;
  private readonly articleTopicDao = daos.articleTopicDao;
  private readonly articleReviewLogDao = daos.articleReviewLogDao;
  private readonly adminDao = daos.adminDao;

  async getArticleFullTrace(articleId: number): Promise<ArticleFullTraceResult> {
    const article = await this.articleDao.findById(articleId);
    if (!article) {
      throw new AppError('图文不存在', 404);
    }

    let publisherInfo: unknown = null;
    if (article.publisher_id) {
      if (article.publisher_type === 1 || article.publisher_type === 2) {
        publisherInfo = await this.adminDao.findById(article.publisher_id);
      }
    }

    const versions = await this.articleVersionDao.findAll({
      where: { article_id: articleId },
      order: [['version', 'DESC']],
    });
    const versionTimeline: VersionTimelineItem[] = versions.map((v: ArticleVersion) => ({
      id: v.id,
      version: v.version,
      title: v.title ?? '',
      editor_id: v.editor_id ?? 0,
      edit_type: v.edit_type ?? 0,
      reviewed_status: v.reviewed_status ?? 0,
      review_remark: v.review_remark,
      created_at: v.created_at,
    }));

    let topicInfo: TopicInfoResult = {
      topic: null,
      related_articles: [],
    };
    if (article.topic_id) {
      const topic = await this.articleTopicDao.findById(article.topic_id);
      if (topic) {
        const related = await this.articleDao.findAll({
          where: { topic_id: article.topic_id, id: { [Op.ne]: articleId } },
          limit: 50,
        });
        topicInfo = {
          topic,
          related_articles: related,
        };
      }
    }

    const reviews = await this.articleReviewLogDao.findAll({
      where: { article_id: articleId },
      order: [['created_at', 'DESC']],
    });
    const reviewTimeline: ReviewTimelineItem[] = reviews.map((r: ArticleReviewLog) => ({
      id: r.id,
      action: r.action,
      reviewer_id: r.reviewer_id,
      before_status: r.before_status ?? 0,
      after_status: r.after_status ?? 0,
      remark: r.remark,
      created_at: r.created_at,
    }));

    return {
      basic: {
        article,
        publisher_info: publisherInfo,
      },
      versionTimeline,
      topicInfo,
      reviewTimeline,
    };
  }

  async checkDuplicate(
    title: string,
    content: string,
    excludeId?: number
  ): Promise<CheckDuplicateResult> {
    const titleDupArticles: DuplicateArticleItem[] = [];
    const contentDupArticles: DuplicateArticleItem[] = [];

    const titleKeywords = this.extractKeywords(title);
    const contentKeywords = this.extractKeywords(content || '');

    if (title && title.trim().length > 0) {
      const titleWhere: Record<string, unknown> = {};
      if (excludeId !== undefined) {
        titleWhere.id = { [Op.ne]: excludeId };
      }

      const exactTitleMatches = await this.articleDao.findAll({
        where: { title, ...titleWhere },
        limit: 20,
      });
      for (const item of exactTitleMatches) {
        if (titleDupArticles.find((d) => d.id === item.id)) continue;
        titleDupArticles.push({
          id: item.id,
          title: item.title,
          unique_code: item.unique_code,
          similarity: 100,
          match_reason: '标题完全相同',
          publisher_id: item.publisher_id,
          published_at: item.published_at,
        });
      }

      if (titleKeywords.length > 0) {
        const whereClauses = titleKeywords.map((kw) => ({
          title: { [Op.like]: `%${kw}%` },
        }));
        const extraWhere: Record<string, unknown> = {};
        if (excludeId !== undefined) {
          extraWhere.id = { [Op.ne]: excludeId };
        }
        const titleMatches = await this.articleDao.findAll({
          where: {
            [Op.or]: whereClauses,
            ...extraWhere,
          } as unknown as Record<string, unknown>,
          limit: 50,
        });
        for (const item of titleMatches) {
          if (titleDupArticles.find((d) => d.id === item.id)) continue;
          const sim = this.calculateTitleSimilarity(title, item.title);
          if (sim >= TITLE_DUP_THRESHOLD) {
            titleDupArticles.push({
              id: item.id,
              title: item.title,
              unique_code: item.unique_code,
              similarity: sim,
              match_reason: '标题关键词相似度高',
              publisher_id: item.publisher_id,
              published_at: item.published_at,
            });
          }
        }
      }
    }

    if (contentKeywords.length > 0) {
      const whereClauses = contentKeywords.slice(0, 5).map((kw) => ({
        content: { [Op.like]: `%${kw}%` },
      }));
      const extraWhere: Record<string, unknown> = {};
      if (excludeId !== undefined) {
        extraWhere.id = { [Op.ne]: excludeId };
      }
      const contentMatches = await this.articleDao.findAll({
        where: {
          [Op.or]: whereClauses,
          ...extraWhere,
        } as unknown as Record<string, unknown>,
        limit: 50,
      });
      for (const item of contentMatches) {
        if (contentDupArticles.find((d) => d.id === item.id)) continue;
        const overlap = this.calculateKeywordOverlap(
          contentKeywords,
          this.extractKeywords(item.content || '')
        );
        if (overlap >= 30) {
          contentDupArticles.push({
            id: item.id,
            title: item.title,
            unique_code: item.unique_code,
            similarity: overlap,
            match_reason: '正文关键词重合度高',
            publisher_id: item.publisher_id,
            published_at: item.published_at,
          });
        }
      }
    }

    const titleSimMax = titleDupArticles.length > 0
      ? Math.max(...titleDupArticles.map((a) => a.similarity))
      : 0;

    const keywordOverlap = contentDupArticles.length > 0
      ? Math.max(...contentDupArticles.map((a) => a.similarity))
      : 0;

    let rating = '低';
    if (titleSimMax >= 90 || keywordOverlap >= 70) rating = '高';
    else if (titleSimMax >= 80 || keywordOverlap >= 50) rating = '中';

    return {
      has_duplicate: titleDupArticles.length > 0 || contentDupArticles.length > 0,
      title_dup_articles: titleDupArticles,
      content_dup_articles: contentDupArticles,
      similarity_report: {
        title_similarity_max: titleSimMax,
        content_keyword_overlap: keywordOverlap,
        overall_rating: rating,
      },
    };
  }

  async validateQuality(articleId: number): Promise<ValidateQualityResult> {
    const article = await this.articleDao.findById(articleId);
    if (!article) {
      throw new AppError('图文不存在', 404);
    }

    const dimensions: QualityDimension[] = [];
    const warnings: string[] = [];
    let totalScore = 0;
    const maxScore = 100;
    const perDimScore = Math.floor(maxScore / 6);

    const imgResult = this.checkImageResolution(article);
    dimensions.push(imgResult.dim);
    if (imgResult.passed) {
      totalScore += perDimScore;
    } else {
      warnings.push(imgResult.dim.detail);
    }

    const wordResult = this.checkWordCount(article);
    dimensions.push(wordResult.dim);
    if (wordResult.passed) {
      totalScore += perDimScore;
    } else {
      warnings.push(wordResult.dim.detail);
    }

    const linkResult = this.checkLinks(article);
    dimensions.push(linkResult.dim);
    if (linkResult.passed) {
      totalScore += perDimScore;
    } else {
      warnings.push(linkResult.dim.detail);
    }

    const sensitiveResult = await this.checkSensitiveWords(article);
    dimensions.push(sensitiveResult.dim);
    if (sensitiveResult.passed) {
      totalScore += perDimScore;
    } else {
      warnings.push(sensitiveResult.dim.detail);
      if (sensitiveResult.highLevelCount > 0) {
        totalScore -= 10;
      }
    }

    const anomalyResult = this.checkAnomaly(article);
    dimensions.push(anomalyResult.dim);
    if (anomalyResult.passed) {
      totalScore += perDimScore;
    } else {
      warnings.push(anomalyResult.dim.detail);
    }

    const coverResult = this.checkCoverAndTitle(article);
    dimensions.push(coverResult.dim);
    if (coverResult.passed) {
      totalScore += perDimScore;
    } else {
      warnings.push(coverResult.dim.detail);
    }

    totalScore = Math.max(0, Math.min(100, totalScore));

    return {
      quality_score: totalScore,
      dimensions,
      warnings,
    };
  }

  private checkImageResolution(article: Article): { dim: QualityDimension; passed: boolean } {
    const images = (article.images_json as Array<{ width?: number; height?: number }>) || [];
    if (images.length === 0) {
      return { dim: { name: '配图分辨率', passed: true, detail: '无配图' }, passed: true };
    }
    let passCount = 0;
    for (const img of images) {
      if (img.width !== undefined && img.height !== undefined) {
        if (img.width >= 750 && img.height >= 300) {
          passCount++;
        }
      }
    }
    const rate = images.length > 0 ? Math.round((passCount / images.length) * 100) : 100;
    const passed = passCount === images.length;
    return {
      dim: {
        name: '配图分辨率达标率',
        passed,
        detail: '达标率 ' + rate + '% (' + passCount + '/' + images.length + '张图达标，要求最低750x300)',
      },
      passed,
    };
  }

  private checkWordCount(article: Article): { dim: QualityDimension; passed: boolean } {
    const wordCount = article.word_count ?? 0;
    const channel = article.channel || 'infopage';
    const config = articleValidateService.getChannelTemplate(channel);
    if (!config) {
      return {
        dim: { name: '字数合规性', passed: true, detail: '当前字数 ' + wordCount + ' 字' },
        passed: true,
      };
    }
    const { min, max } = config.word_config;
    const passed = wordCount >= min && wordCount <= max;
    return {
      dim: {
        name: '字数合规性',
        passed,
        detail: passed
          ? '字数合规 ' + wordCount + ' (范围 ' + min + '-' + max + ')'
          : '字数不合规 ' + wordCount + ' (范围 ' + min + '-' + max + ')',
      },
      passed,
    };
  }

  private checkLinks(article: Article): { dim: QualityDimension; passed: boolean } {
    const content = article.content || '';
    const links = content.match(URL_REGEX) || [];
    if (links.length === 0) {
      return { dim: { name: '链接有效性', passed: true, detail: '正文中无外部链接' }, passed: true };
    }
    const urlPattern = /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/i;
    let validCount = 0;
    for (const link of links) {
      if (urlPattern.test(link)) {
        validCount++;
      }
    }
    const passed = validCount === links.length;
    return {
      dim: {
        name: '链接有效性',
        passed,
        detail: '共' + links.length + '个链接，有效' + validCount + '个',
      },
      passed,
    };
  }

  private async checkSensitiveWords(
    article: Article
  ): Promise<{ dim: QualityDimension; passed: boolean; highLevelCount: number }> {
    const text = [article.title, article.summary || '', article.content || ''].join(' ');
    const hits = await articleValidateService.scanSensitiveWords(text);
    const highLevel = hits.filter((h) => h.level === 3).length;
    const midLevel = hits.filter((h) => h.level === 2).length;
    const lowLevel = hits.length - highLevel - midLevel;
    const passed = hits.length === 0;
    return {
      dim: {
        name: '敏感词检测',
        passed,
        detail:
          '命中' +
          hits.length +
          '个敏感词(高' +
          highLevel +
          '/中' +
          midLevel +
          '/低' +
          lowLevel +
          ')',
      },
      passed,
      highLevelCount: highLevel,
    };
  }

  private checkAnomaly(article: Article): { dim: QualityDimension; passed: boolean } {
    const viewCount = article.view_count ?? 0;
    const likeCount = article.like_count ?? 0;
    const shareCount = article.share_count ?? 0;
    const issues: string[] = [];

    if (viewCount > 1000000) {
      issues.push('阅读量异常高：' + viewCount);
    }
    if (viewCount > 0 && likeCount === 0 && shareCount === 0) {
      issues.push('有阅读量但无点赞和分享');
    }
    const shareRate = viewCount > 0 ? (shareCount / viewCount) * 100 : 0;
    if (shareRate > 50) {
      issues.push('分享率异常：' + shareRate.toFixed(1) + '%');
    }
    const passed = issues.length === 0;
    return {
      dim: {
        name: '数据异常检测',
        passed,
        detail: passed ? '各项指标正常' : issues.join('; '),
      },
      passed,
    };
  }

  private checkCoverAndTitle(article: Article): { dim: QualityDimension; passed: boolean } {
    const issues: string[] = [];
    if (!article.title || article.title.length < 5) {
      issues.push('标题过短');
    }
    if (!article.cover_image) {
      issues.push('缺少封面图');
    }
    const passed = issues.length === 0;
    return {
      dim: {
        name: '基础要素完整性',
        passed,
        detail: passed ? '基础要素完整' : issues.join('; '),
      },
      passed,
    };
  }

  private extractKeywords(text: string): string[] {
    if (!text) return [];
    const cleaned = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ');
    const chinese = cleaned.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    const english = cleaned.match(/[a-zA-Z]{3,}/g) || [];
    return [...chinese, ...english].slice(0, 20);
  }

  private calculateTitleSimilarity(title1: string, title2: string): number {
    if (!title1 || !title2) return 0;
    const set1 = new Set(title1.split(''));
    const set2 = new Set(title2.split(''));
    let intersection = 0;
    for (const char of set1) {
      if (set2.has(char)) {
        intersection++;
      }
    }
    const union = set1.size + set2.size - intersection;
    return union === 0 ? 0 : Math.round((intersection / union) * 100);
  }

  private calculateKeywordOverlap(kw1: string[], kw2: string[]): number {
    if (kw1.length === 0 || kw2.length === 0) return 0;
    const set1 = new Set(kw1);
    const set2 = new Set(kw2);
    let intersection = 0;
    for (const w of set1) {
      if (set2.has(w)) {
        intersection++;
      }
    }
    const union = set1.size + set2.size - intersection;
    return union === 0 ? 0 : Math.round((intersection / union) * 100);
  }
}

export const articleTraceService = new ArticleTraceService();
export default ArticleTraceService;
