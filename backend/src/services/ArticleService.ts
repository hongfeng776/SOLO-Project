import { Op } from 'sequelize';
import { daos } from '../dao';
import { Article } from '../models/Article';
import { AppError } from '../middlewares/errorHandler';
import { PageResult } from '../types';

export interface ArticleQueryParams {
  page?: number;
  pageSize?: number;
  title?: string;
  domain_category_id?: number;
  channel?: string;
  status?: number;
  publisher_id?: number;
  topic_id?: number;
}

export interface ArticleCreateData {
  unique_code: string;
  title: string;
  summary?: string;
  content?: string;
  cover_image?: string;
  images_json?: unknown;
  domain_category_id?: number;
  channel?: string;
  template?: string;
  word_count?: number;
  topic_id?: number;
  publisher_id?: number;
  publisher_type?: number;
  status?: number;
}

export interface ArticleUpdateData {
  title?: string;
  summary?: string;
  content?: string;
  cover_image?: string;
  images_json?: unknown;
  domain_category_id?: number;
  channel?: string;
  template?: string;
  word_count?: number;
  topic_id?: number;
  status?: number;
  top_flag?: number;
  sort_weight?: number;
  published_at?: Date;
}

class ArticleService {
  private readonly articleDao = daos.articleDao;

  async getList(params: ArticleQueryParams): Promise<PageResult<Article>> {
    const {
      page = 1,
      pageSize = 10,
      title,
      domain_category_id,
      channel,
      status,
      publisher_id,
      topic_id,
    } = params;

    const where: Record<string, unknown> = {};

    if (title) {
      where.title = { [Op.like]: `%${title}%` };
    }
    if (domain_category_id !== undefined) {
      where.domain_category_id = domain_category_id;
    }
    if (channel) {
      where.channel = channel;
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (publisher_id !== undefined) {
      where.publisher_id = publisher_id;
    }
    if (topic_id !== undefined) {
      where.topic_id = topic_id;
    }

    return this.articleDao.findPage({
      page,
      pageSize,
      where,
      order: [
        ['top_flag', 'DESC'],
        ['sort_weight', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
  }

  async getById(id: number): Promise<Article> {
    const article = await this.articleDao.findById(id);
    if (!article) {
      throw new AppError('图文不存在', 404);
    }
    return article;
  }

  async getByUniqueCode(code: string): Promise<Article> {
    const list = await this.articleDao.findAll({ where: { unique_code: code }, limit: 1 });
    if (list.length === 0) {
      throw new AppError('图文不存在', 404);
    }
    return list[0];
  }

  async create(data: ArticleCreateData): Promise<Article> {
    const existing = await this.articleDao.findAll({
      where: { unique_code: data.unique_code },
      limit: 1,
    });
    if (existing.length > 0) {
      throw new AppError('unique_code 已存在', 400);
    }

    return this.articleDao.create({
      ...data,
      status: data.status ?? 0,
      version: 1,
      view_count: 0,
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      top_flag: 0,
      sort_weight: 0,
    } as Partial<Article['_attributes']>);
  }

  async update(id: number, data: ArticleUpdateData): Promise<Article> {
    await this.getById(id);
    await this.articleDao.update(id, data);
    return this.getById(id);
  }

  async delete(id: number): Promise<void> {
    await this.getById(id);
    await this.articleDao.delete(id);
  }

  async batchDelete(ids: number[]): Promise<number> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要删除的图文', 400);
    }
    return this.articleDao.batchDelete(ids);
  }

  async updateStatus(id: number, status: number): Promise<Article> {
    await this.getById(id);
    if (![0, 1, 2, 3, 4].includes(status)) {
      throw new AppError('无效的状态值', 400);
    }
    const updateData: Partial<ArticleUpdateData> = { status };
    if (status === 2) {
      updateData.published_at = new Date();
    }
    await this.articleDao.update(id, updateData as any);
    return this.getById(id);
  }
}

export const articleService = new ArticleService();
export default ArticleService;
