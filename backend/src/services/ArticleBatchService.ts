import { Op, FindOptions, WhereOptions } from 'sequelize';
import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';
import { Article } from '../models/Article';
import { PageResult } from '../types';

export const ROLE_ADMIN = 1;
export const ROLE_OPER = 2;
export const ROLE_MERCHANT = 3;

export interface BatchOperationResult {
  success: number;
  failed: number;
  total: number;
  failed_items?: Array<{ id: number; reason: string }>;
}

export interface OperableScope {
  scope: 'global' | 'self';
  publisher_id?: number;
  channels: string[];
  abilities: string[];
}

export interface AdvancedFilterParams {
  page?: number;
  pageSize?: number;
  view_count_min?: number;
  view_count_max?: number;
  like_count_min?: number;
  like_count_max?: number;
  published_at_start?: string;
  published_at_end?: string;
  domain_category_id?: number | number[];
  channel?: string | string[];
  top_flag?: number;
  status?: number | number[];
  publisher_id?: number;
  topic_id?: number;
  keyword?: string;
  sort_field?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface ArticleAbility {
  id: number;
  canEdit: boolean;
  canOffline: boolean;
  canTop: boolean;
  canTopic: boolean;
  reasons?: string[];
}

const STATUS_OFFLINE = 3;

class ArticleBatchService {
  private readonly articleDao = daos.articleDao;
  private readonly articleTopicDao = daos.articleTopicDao;
  private readonly articleReviewLogDao = daos.articleReviewLogDao;

  async batchTopArticles(
    ids: number[],
    operatorId: number,
    operatorRole: number
  ): Promise<BatchOperationResult> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要置顶的图文', 400);
    }

    const scope = this.getOperableScope(operatorId, operatorRole);
    const result: BatchOperationResult = {
      success: 0,
      failed: 0,
      total: ids.length,
      failed_items: [],
    };

    let currentWeight = 999999;

    for (const id of ids) {
      try {
        const article = await this.articleDao.findById(id);
        if (!article) {
          result.failed++;
          result.failed_items!.push({ id, reason: '图文不存在' });
          continue;
        }

        if (!this.canOperateArticle(article, scope)) {
          result.failed++;
          result.failed_items!.push({ id, reason: '无操作权限' });
          continue;
        }

        if (article.top_flag === 1) {
          result.failed++;
          result.failed_items!.push({ id, reason: '已置顶' });
          continue;
        }

        await this.articleDao.update(id, {
          top_flag: 1,
          sort_weight: currentWeight--,
        });

        result.success++;
      } catch (error) {
        result.failed++;
        result.failed_items!.push({
          id,
          reason: error instanceof Error ? error.message : '未知错误',
        });
      }
    }

    return result;
  }

  async batchOfflineArticles(
    ids: number[],
    operatorId: number,
    operatorRole: number,
    reason?: string
  ): Promise<BatchOperationResult> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要下架的图文', 400);
    }

    const scope = this.getOperableScope(operatorId, operatorRole);
    const result: BatchOperationResult = {
      success: 0,
      failed: 0,
      total: ids.length,
      failed_items: [],
    };

    for (const id of ids) {
      try {
        const article = await this.articleDao.findById(id);
        if (!article) {
          result.failed++;
          result.failed_items!.push({ id, reason: '图文不存在' });
          continue;
        }

        if (!this.canOperateArticle(article, scope)) {
          result.failed++;
          result.failed_items!.push({ id, reason: '无操作权限' });
          continue;
        }

        if (article.status === STATUS_OFFLINE) {
          result.failed++;
          result.failed_items!.push({ id, reason: '已下架' });
          continue;
        }

        const beforeStatus = article.status;
        await this.articleDao.update(id, { status: STATUS_OFFLINE });
        await this.articleReviewLogDao.create({
          article_id: id,
          version: article.version,
          reviewer_id: operatorId,
          action: 'offline',
          before_status: beforeStatus,
          after_status: STATUS_OFFLINE,
          remark: reason || '批量下架',
        } as any);

        result.success++;
      } catch (error) {
        result.failed++;
        result.failed_items!.push({
          id,
          reason: error instanceof Error ? error.message : '未知错误',
        });
      }
    }

    return result;
  }

  async batchAssignTopic(
    ids: number[],
    topicId: number,
    operatorId: number,
    operatorRole: number
  ): Promise<BatchOperationResult> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要归类的图文', 400);
    }

    const topic = await this.articleTopicDao.findById(topicId);
    if (!topic) {
      throw new AppError('专题不存在', 404);
    }

    const scope = this.getOperableScope(operatorId, operatorRole);
    const result: BatchOperationResult = {
      success: 0,
      failed: 0,
      total: ids.length,
      failed_items: [],
    };

    for (const id of ids) {
      try {
        const article = await this.articleDao.findById(id);
        if (!article) {
          result.failed++;
          result.failed_items!.push({ id, reason: '图文不存在' });
          continue;
        }

        if (!this.canOperateArticle(article, scope)) {
          result.failed++;
          result.failed_items!.push({ id, reason: '无操作权限' });
          continue;
        }

        await this.articleDao.update(id, { topic_id: topicId });
        result.success++;
      } catch (error) {
        result.failed++;
        result.failed_items!.push({
          id,
          reason: error instanceof Error ? error.message : '未知错误',
        });
      }
    }

    if (result.success > 0) {
      await this.articleTopicDao.update(topicId, {
        published_count: (topic.published_count ?? 0) + result.success,
      });
    }

    return result;
  }

  getOperableScope(operatorId: number, operatorRole: number): OperableScope {
    if (operatorRole === ROLE_ADMIN) {
      return {
        scope: 'global',
        channels: ['homepage', 'infopage', 'special'],
        abilities: ['edit', 'offline', 'top', 'topic', 'review', 'delete'],
      };
    }

    if (operatorRole === ROLE_OPER) {
      return {
        scope: 'self',
        publisher_id: operatorId,
        channels: ['infopage', 'special'],
        abilities: ['edit', 'offline', 'top', 'topic'],
      };
    }

    return {
      scope: 'self',
      publisher_id: operatorId,
      channels: ['infopage'],
      abilities: ['edit'],
    };
  }

  async advancedFilter(
    params: AdvancedFilterParams,
    operatorId?: number,
    operatorRole?: number
  ): Promise<PageResult<Article>> {
    const {
      page = 1,
      pageSize = 10,
      view_count_min,
      view_count_max,
      like_count_min,
      like_count_max,
      published_at_start,
      published_at_end,
      domain_category_id,
      channel,
      top_flag,
      status,
      publisher_id,
      topic_id,
      keyword,
      sort_field = 'sort_weight',
      sort_order = 'DESC',
    } = params;

    const where: Record<string, unknown> = {};
    const include: FindOptions['include'] = [];

    if (view_count_min !== undefined || view_count_max !== undefined) {
      const vc: Record<string, unknown> = {};
      if (view_count_min !== undefined) vc[Op.gte as unknown as string] = view_count_min;
      if (view_count_max !== undefined) vc[Op.lte as unknown as string] = view_count_max;
      where.view_count = vc;
    }

    if (like_count_min !== undefined || like_count_max !== undefined) {
      const lc: Record<string, unknown> = {};
      if (like_count_min !== undefined) lc[Op.gte as unknown as string] = like_count_min;
      if (like_count_max !== undefined) lc[Op.lte as unknown as string] = like_count_max;
      where.like_count = lc;
    }

    if (published_at_start || published_at_end) {
      const pa: Record<string, unknown> = {};
      if (published_at_start) pa[Op.gte as unknown as string] = published_at_start;
      if (published_at_end) pa[Op.lte as unknown as string] = published_at_end;
      where.published_at = pa;
    }

    if (domain_category_id !== undefined) {
      where.domain_category_id = Array.isArray(domain_category_id)
        ? { [Op.in]: domain_category_id }
        : domain_category_id;
    }

    if (channel !== undefined) {
      where.channel = Array.isArray(channel)
        ? { [Op.in]: channel }
        : channel;
    }

    if (top_flag !== undefined) {
      where.top_flag = top_flag;
    }

    if (status !== undefined) {
      where.status = Array.isArray(status)
        ? { [Op.in]: status }
        : status;
    }

    if (publisher_id !== undefined) {
      where.publisher_id = publisher_id;
    }

    if (topic_id !== undefined) {
      where.topic_id = topic_id;
    }

    if (keyword) {
      (where as Record<string, unknown>)[Op.or as unknown as string] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { summary: { [Op.like]: `%${keyword}%` } },
      ];
    }

    if (operatorId && operatorRole && operatorRole !== ROLE_ADMIN) {
      where.publisher_id = operatorId;
    }

    const order = [[sort_field, sort_order], ['created_at', 'DESC']] as unknown as undefined;

    return this.articleDao.findPage({
      page,
      pageSize,
      where: where as WhereOptions,
      order,
      include,
    });
  }

  async abilityList(
    list: Article[],
    operatorId: number,
    operatorRole: number
  ): Promise<ArticleAbility[]> {
    const scope = this.getOperableScope(operatorId, operatorRole);
    return list.map((article) => {
      const reasons: string[] = [];
      let canEdit = true;
      let canOffline = true;
      let canTop = true;
      let canTopic = true;

      if (!this.canOperateArticle(article, scope)) {
        canEdit = false;
        canOffline = false;
        canTop = false;
        canTopic = false;
        reasons.push('无操作权限');
        return {
          id: article.id,
          canEdit,
          canOffline,
          canTop,
          canTopic,
          reasons,
        };
      }

      if (article.status === STATUS_OFFLINE) {
        canOffline = false;
        reasons.push('已下架');
      }

      if (article.top_flag === 1) {
        canTop = false;
        reasons.push('已置顶');
      }

      if (!scope.abilities.includes('offline')) {
        canOffline = false;
      }
      if (!scope.abilities.includes('top')) {
        canTop = false;
      }
      if (!scope.abilities.includes('topic')) {
        canTopic = false;
      }

      return {
        id: article.id,
        canEdit,
        canOffline,
        canTop,
        canTopic,
        reasons: reasons.length > 0 ? reasons : undefined,
      };
    });
  }

  private canOperateArticle(article: Article, scope: OperableScope): boolean {
    if (scope.scope === 'global') {
      return true;
    }
    return article.publisher_id === scope.publisher_id;
  }
}

export const articleBatchService = new ArticleBatchService();
export default ArticleBatchService;
