import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';
import { Article } from '../models/Article';
import { ArticleVersion } from '../models/ArticleVersion';

export type EditMode = 'draft' | 'published';

export interface IncrementalPatchData {
  summary?: string;
  cover_image?: string;
  images_json?: unknown;
  domain_category_id?: number;
  channel?: string;
  template?: string;
  top_flag?: number;
  sort_weight?: number;
  topic_id?: number;
}

export interface FullEditData {
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
  change_log?: string;
}

export interface DraftSaveData {
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
}

const STATUS_DRAFT = 0;
const STATUS_PUBLISHED = 2;
const STATUS_PENDING = 1;
const EDIT_TYPE_INCREMENTAL = 1;
const EDIT_TYPE_FULL = 2;

const INCREMENTAL_ALLOWED_FIELDS: (keyof IncrementalPatchData)[] = [
  'summary', 'cover_image', 'images_json', 'domain_category_id',
  'channel', 'template', 'top_flag', 'sort_weight', 'topic_id',
];

class ArticleEditorService {
  private readonly articleDao = daos.articleDao;
  private readonly articleVersionDao = daos.articleVersionDao;
  private readonly articleReviewLogDao = daos.articleReviewLogDao;

  async getEditMode(articleId: number): Promise<{ mode: EditMode; article: Article }> {
    const article = await this.getArticleOrThrow(articleId);
    const mode: EditMode = article.status === STATUS_DRAFT ? 'draft' : 'published';
    return { mode, article };
  }

  async incrementalEdit(
    articleId: number,
    patchData: IncrementalPatchData,
    editorId: number,
    changeLog?: string
  ): Promise<{ article: Article; newVersion?: ArticleVersion }> {
    const article = await this.getArticleOrThrow(articleId);
    const filteredPatch: Record<string, unknown> = {};

    for (const key of Object.keys(patchData) as (keyof IncrementalPatchData)[]) {
      if (INCREMENTAL_ALLOWED_FIELDS.includes(key) && patchData[key] !== undefined) {
        filteredPatch[key] = patchData[key];
      }
    }

    if (Object.keys(filteredPatch).length === 0) {
      return { article };
    }

    if (article.status === STATUS_DRAFT) {
      await this.articleDao.update(articleId, filteredPatch);
      const updated = await this.getArticleOrThrow(articleId);
      this.syncUpdateMeta(articleId);
      return { article: updated };
    }

    const newVersion = article.status === STATUS_PUBLISHED
      ? await this.createNewVersion(article, filteredPatch, editorId, EDIT_TYPE_INCREMENTAL, changeLog)
      : await this.updateExistingPendingVersion(article, filteredPatch, editorId, EDIT_TYPE_INCREMENTAL, changeLog);

    return { article, newVersion };
  }

  async fullEdit(
    articleId: number,
    fullData: FullEditData,
    editorId: number,
    changeLog?: string
  ): Promise<{ article: Article; newVersion?: ArticleVersion }> {
    const article = await this.getArticleOrThrow(articleId);
    const filteredData: Record<string, unknown> = {};
    const allowedKeys: (keyof FullEditData)[] = [
      'title', 'summary', 'content', 'cover_image', 'images_json',
      'domain_category_id', 'channel', 'template', 'word_count', 'topic_id',
    ];

    for (const key of allowedKeys) {
      if (fullData[key] !== undefined) {
        filteredData[key] = fullData[key];
      }
    }

    if (Object.keys(filteredData).length === 0) {
      return { article };
    }

    if (article.status === STATUS_DRAFT) {
      await this.articleDao.update(articleId, filteredData);
      const updated = await this.getArticleOrThrow(articleId);
      this.syncUpdateMeta(articleId);
      return { article: updated };
    }

    const snapshot = this.buildFullSnapshot(article, filteredData);
    const newVersion = article.status === STATUS_PUBLISHED
      ? await this.createNewVersion(article, snapshot, editorId, EDIT_TYPE_FULL, changeLog || fullData.change_log)
      : await this.updateExistingPendingVersion(article, snapshot, editorId, EDIT_TYPE_FULL, changeLog || fullData.change_log);

    return { article, newVersion };
  }

  async draftSave(articleId: number, data: DraftSaveData): Promise<Article> {
    const article = await this.getArticleOrThrow(articleId);

    if (article.status !== STATUS_DRAFT) {
      throw new AppError('仅草稿状态可直接保存草稿', 400);
    }

    const updateData: Record<string, unknown> = {};
    const allowedKeys: (keyof DraftSaveData)[] = [
      'title', 'summary', 'content', 'cover_image', 'images_json',
      'domain_category_id', 'channel', 'template', 'word_count', 'topic_id',
    ];

    for (const key of allowedKeys) {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    }

    if (Object.keys(updateData).length > 0) {
      await this.articleDao.update(articleId, updateData);
    }
    this.syncUpdateMeta(articleId);
    return this.getArticleOrThrow(articleId);
  }

  async submitReview(articleId: number, version: number, reviewerId?: number): Promise<ArticleVersion> {
    const article = await this.getArticleOrThrow(articleId);
    let targetVersion: ArticleVersion | null = null;

    if (article.status === STATUS_DRAFT) {
      const currentVersion = article.version ?? 1;
      const snapshot: Record<string, unknown> = {
        title: article.title,
        content: article.content,
        cover_image: article.cover_image,
        images_json: article.images_json,
      };
      targetVersion = await this.articleVersionDao.create({
        article_id: articleId,
        version: currentVersion,
        ...snapshot,
        editor_id: article.publisher_id,
        edit_type: EDIT_TYPE_FULL,
        reviewed_status: 1,
      } as Partial<ArticleVersion['_attributes']>);
    } else {
      const versions = await this.articleVersionDao.findAll({
        where: { article_id: articleId, version },
      });
      if (versions.length === 0) {
        throw new AppError('版本不存在', 404);
      }
      targetVersion = versions[0];
      await this.articleVersionDao.update(targetVersion.id, {
        reviewed_status: 1,
      });
    }

    if (article.status === STATUS_DRAFT) {
      await this.articleDao.update(articleId, { status: STATUS_PENDING });
    } else if (article.status === STATUS_PUBLISHED) {
      await this.articleDao.update(articleId, { status: STATUS_PENDING });
    }

    await this.articleReviewLogDao.create({
      article_id: articleId,
      version: targetVersion.version,
      reviewer_id: reviewerId ?? 0,
      action: 'submit',
      before_status: article.status,
      after_status: STATUS_PENDING,
      remark: '提交审核',
    } as any);

    return this.articleVersionDao.findById(targetVersion.id) as Promise<ArticleVersion>;
  }

  syncUpdateMeta(articleId: number): void {
    this.articleDao.update(articleId, {
      updated_at: new Date(),
      sort_weight: this.calculateSortWeight(),
    }).catch(() => {});
  }

  private async getArticleOrThrow(articleId: number): Promise<Article> {
    const article = await this.articleDao.findById(articleId);
    if (!article) {
      throw new AppError('图文不存在', 404);
    }
    return article;
  }

  private async createNewVersion(
    article: Article,
    patchData: Record<string, unknown>,
    editorId: number,
    editType: number,
    changeLog?: string
  ): Promise<ArticleVersion> {
    const currentVersion = article.version ?? 1;
    const nextVersion = currentVersion + 1;

    const snapshot: Record<string, unknown> = {
      title: article.title,
      content: article.content,
      cover_image: article.cover_image,
      images_json: article.images_json,
      ...patchData,
    };

    const created = await this.articleVersionDao.create({
      article_id: article.id,
      version: nextVersion,
      title: snapshot.title as string,
      content: snapshot.content as string,
      cover_image: snapshot.cover_image as string,
      images_json: snapshot.images_json,
      change_log: changeLog,
      editor_id: editorId,
      edit_type: editType,
      reviewed_status: 1,
    } as Partial<ArticleVersion['_attributes']>);

    await this.articleDao.update(article.id, {
      version: nextVersion,
      status: STATUS_PENDING,
    });

    return created;
  }

  private async updateExistingPendingVersion(
    article: Article,
    patchData: Record<string, unknown>,
    editorId: number,
    editType: number,
    changeLog?: string
  ): Promise<ArticleVersion> {
    const version = article.version ?? 1;
    const existing = await this.articleVersionDao.findAll({
      where: { article_id: article.id, version },
    });

    if (existing.length > 0 && existing[0].reviewed_status === 1) {
      const current = existing[0];
      const mergedSnapshot: Record<string, unknown> = {
        title: current.title ?? article.title,
        content: current.content ?? article.content,
        cover_image: current.cover_image ?? article.cover_image,
        images_json: current.images_json ?? article.images_json,
        ...patchData,
      };
      await this.articleVersionDao.update(current.id, {
        title: mergedSnapshot.title as string,
        content: mergedSnapshot.content as string,
        cover_image: mergedSnapshot.cover_image as string,
        images_json: mergedSnapshot.images_json,
        editor_id: editorId,
        edit_type: editType,
        change_log: changeLog || current.change_log,
      } as any);
      return (await this.articleVersionDao.findById(current.id)) as ArticleVersion;
    }

    return this.createNewVersion(article, patchData, editorId, editType, changeLog);
  }

  private buildFullSnapshot(article: Article, overrideData: Record<string, unknown>): Record<string, unknown> {
    return {
      title: overrideData.title ?? article.title,
      summary: overrideData.summary ?? article.summary,
      content: overrideData.content ?? article.content,
      cover_image: overrideData.cover_image ?? article.cover_image,
      images_json: overrideData.images_json ?? article.images_json,
      domain_category_id: overrideData.domain_category_id ?? article.domain_category_id,
      channel: overrideData.channel ?? article.channel,
      template: overrideData.template ?? article.template,
      word_count: overrideData.word_count ?? article.word_count,
      topic_id: overrideData.topic_id ?? article.topic_id,
    };
  }

  private calculateSortWeight(): number {
    const now = Date.now();
    return Math.floor(now / 1000);
  }
}

export const articleEditorService = new ArticleEditorService();
export default ArticleEditorService;
