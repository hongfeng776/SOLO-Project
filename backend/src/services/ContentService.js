const { Content, Copyright } = require('../models');
const { Op } = require('../config/database');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch } = require('../utils/helpers');

class ContentService {
  async getContentList(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query);
    const search = parseSearch(query, ['content_title', 'director', 'actors']);

    const where = { ...search };

    if (query.category) where.content_category = query.category;
    if (query.auditStatus !== undefined) where.audit_status = query.auditStatus;
    if (query.copyrightId) where.copyright_id = query.copyrightId;
    if (query.status !== undefined) where.status = query.status;
    if (query.releaseYear) where.release_year = query.releaseYear;
    if (query.isVip !== undefined) where.is_vip = query.isVip;

    const { count, rows } = await Content.findAndCountAll({
      where,
      include: [{ model: Copyright, as: 'copyright', attributes: ['id', 'copyright_name', 'copyright_type'] }],
      offset,
      limit: pageSize,
      order,
    });

    return {
      list: rows.map((content) => ({
        id: content.id,
        title: content.content_title,
        subtitle: content.content_subtitle,
        category: content.content_category,
        coverImage: content.cover_image,
        posterImage: content.poster_image,
        director: content.director,
        actors: content.actors,
        releaseYear: content.release_year,
        releaseDate: content.release_date,
        duration: content.duration,
        area: content.area,
        language: content.language,
        tags: content.tags,
        totalEpisodes: content.total_episodes,
        updatedEpisodes: content.updated_episodes,
        copyrightId: content.copyright_id,
        copyrightType: content.copyright_type,
        rating: content.rating,
        playCount: content.play_count,
        likeCount: content.like_count,
        collectCount: content.collect_count,
        commentCount: content.comment_count,
        auditStatus: content.audit_status,
        auditRemark: content.audit_remark,
        isHot: content.is_hot,
        isRecommend: content.is_recommend,
        isVip: content.is_vip,
        sortOrder: content.sort_order,
        status: content.status,
        copyright: content.copyright ? {
          id: content.copyright.id,
          name: content.copyright.copyright_name,
          type: content.copyright.copyright_type,
        } : null,
        createdAt: content.created_at,
      })),
      total: count,
      page,
      pageSize,
    };
  }

  async getContentById(id) {
    const content = await Content.findByPk(id, {
      include: [{ model: Copyright, as: 'copyright' }],
    });
    if (!content) {
      throw new NotFoundError('内容不存在');
    }
    return {
      id: content.id,
      title: content.content_title,
      subtitle: content.content_subtitle,
      category: content.content_category,
      coverImage: content.cover_image,
      posterImage: content.poster_image,
      videoUrl: content.video_url,
      description: content.content_description,
      director: content.director,
      actors: content.actors,
      releaseYear: content.release_year,
      releaseDate: content.release_date,
      duration: content.duration,
      area: content.area,
      language: content.language,
      tags: content.tags,
      totalEpisodes: content.total_episodes,
      updatedEpisodes: content.updated_episodes,
      copyrightId: content.copyright_id,
      copyrightType: content.copyright_type,
      rating: content.rating,
      auditStatus: content.audit_status,
      auditRemark: content.audit_remark,
      isHot: content.is_hot,
      isRecommend: content.is_recommend,
      isVip: content.is_vip,
      sortOrder: content.sort_order,
      status: content.status,
      remark: content.remark,
      copyright: content.copyright,
    };
  }

  async createContent(data, operatorId) {
    const content = await Content.create({
      content_title: data.title,
      content_subtitle: data.subtitle,
      content_category: data.category,
      cover_image: data.coverImage,
      poster_image: data.posterImage,
      video_url: data.videoUrl,
      content_description: data.description,
      director: data.director,
      actors: data.actors,
      release_year: data.releaseYear,
      release_date: data.releaseDate,
      duration: data.duration,
      area: data.area,
      language: data.language,
      tags: data.tags,
      total_episodes: data.totalEpisodes,
      updated_episodes: data.updatedEpisodes,
      copyright_id: data.copyrightId,
      copyright_type: data.copyrightType,
      audit_status: data.auditStatus ?? 0,
      is_hot: data.isHot ?? 0,
      is_recommend: data.isRecommend ?? 0,
      is_vip: data.isVip ?? 0,
      sort_order: data.sortOrder ?? 0,
      status: data.status ?? 1,
      remark: data.remark,
      created_by: operatorId,
    });
    return content.id;
  }

  async updateContent(id, data, operatorId) {
    const content = await Content.findByPk(id);
    if (!content) {
      throw new NotFoundError('内容不存在');
    }
    await Content.update({
      content_title: data.title,
      content_subtitle: data.subtitle,
      content_category: data.category,
      cover_image: data.coverImage,
      poster_image: data.posterImage,
      video_url: data.videoUrl,
      content_description: data.description,
      director: data.director,
      actors: data.actors,
      release_year: data.releaseYear,
      release_date: data.releaseDate,
      duration: data.duration,
      area: data.area,
      language: data.language,
      tags: data.tags,
      total_episodes: data.totalEpisodes,
      updated_episodes: data.updatedEpisodes,
      copyright_id: data.copyrightId,
      copyright_type: data.copyrightType,
      is_hot: data.isHot,
      is_recommend: data.isRecommend,
      is_vip: data.isVip,
      sort_order: data.sortOrder,
      status: data.status,
      remark: data.remark,
      updated_by: operatorId,
    }, { where: { id } });
    return true;
  }

  async deleteContent(id) {
    const content = await Content.findByPk(id);
    if (!content) {
      throw new NotFoundError('内容不存在');
    }
    await content.destroy();
    return true;
  }

  async batchDeleteContents(ids) {
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择要删除的内容');
    }
    await Content.destroy({ where: { id: { [Op.in]: ids } } });
    return true;
  }

  async auditContent(id, { auditStatus, auditRemark }, auditorId) {
    const content = await Content.findByPk(id);
    if (!content) {
      throw new NotFoundError('内容不存在');
    }
    await Content.update({
      audit_status: auditStatus,
      audit_remark: auditRemark,
      auditor_id: auditorId,
      audit_time: new Date(),
    }, { where: { id } });
    return true;
  }

  async batchAuditContents(ids, { auditStatus, auditRemark }, auditorId) {
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择要审核的内容');
    }
    await Content.update({
      audit_status: auditStatus,
      audit_remark: auditRemark,
      auditor_id: auditorId,
      audit_time: new Date(),
    }, { where: { id: { [Op.in]: ids } } });
    return true;
  }
}

module.exports = new ContentService();
