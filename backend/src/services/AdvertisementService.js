const { Advertisement } = require('../models');
const { Op } = require('../config/database');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch } = require('../utils/helpers');

class AdvertisementService {
  async getAdList(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query);
    const search = parseSearch(query, ['ad_name', 'ad_code', 'ad_title', 'advertiser_name']);

    const where = { ...search };

    if (query.type) where.ad_type = query.type;
    if (query.status !== undefined) where.ad_status = query.status;

    const { count, rows } = await Advertisement.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order,
    });

    return {
      list: rows.map((ad) => ({
        id: ad.id,
        name: ad.ad_name,
        code: ad.ad_code,
        type: ad.ad_type,
        position: ad.ad_position,
        title: ad.ad_title,
        subtitle: ad.ad_subtitle,
        image: ad.ad_image,
        video: ad.ad_video,
        redirectUrl: ad.redirect_url,
        redirectType: ad.redirect_type,
        targetId: ad.target_id,
        advertiserName: ad.advertiser_name,
        startTime: ad.start_time,
        endTime: ad.end_time,
        budgetAmount: ad.budget_amount,
        spentAmount: ad.spent_amount,
        impressionCount: ad.impression_count,
        clickCount: ad.click_count,
        ctr: ad.ctr,
        status: ad.ad_status,
        auditStatus: ad.audit_status,
        auditRemark: ad.audit_remark,
        sortOrder: ad.sort_order,
        createdAt: ad.created_at,
      })),
      total: count,
      page,
      pageSize,
    };
  }

  async getAdById(id) {
    const ad = await Advertisement.findByPk(id);
    if (!ad) {
      throw new NotFoundError('广告不存在');
    }
    return {
      id: ad.id,
      name: ad.ad_name,
      code: ad.ad_code,
      type: ad.ad_type,
      position: ad.ad_position,
      title: ad.ad_title,
      subtitle: ad.ad_subtitle,
      image: ad.ad_image,
      video: ad.ad_video,
      redirectUrl: ad.redirect_url,
      redirectType: ad.redirect_type,
      targetId: ad.target_id,
      advertiserName: ad.advertiser_name,
      startTime: ad.start_time,
      endTime: ad.end_time,
      budgetAmount: ad.budget_amount,
      frequencyCap: ad.frequency_cap,
      targetAudience: ad.target_audience,
      status: ad.ad_status,
      auditStatus: ad.audit_status,
      auditRemark: ad.audit_remark,
      sortOrder: ad.sort_order,
      remark: ad.remark,
    };
  }

  async createAd(data, operatorId) {
    const exist = await Advertisement.findOne({ where: { ad_code: data.code } });
    if (exist) {
      throw new ConflictError('广告编码已存在');
    }
    const ad = await Advertisement.create({
      ad_name: data.name,
      ad_code: data.code,
      ad_type: data.type,
      ad_position: data.position,
      ad_title: data.title,
      ad_subtitle: data.subtitle,
      ad_image: data.image,
      ad_video: data.video,
      redirect_url: data.redirectUrl,
      redirect_type: data.redirectType,
      target_id: data.targetId,
      advertiser_name: data.advertiserName,
      start_time: data.startTime,
      end_time: data.endTime,
      budget_amount: data.budgetAmount,
      frequency_cap: data.frequencyCap,
      target_audience: data.targetAudience,
      ad_status: data.status ?? 0,
      audit_status: data.auditStatus ?? 0,
      sort_order: data.sortOrder ?? 0,
      remark: data.remark,
      created_by: operatorId,
    });
    return ad.id;
  }

  async updateAd(id, data, operatorId) {
    const ad = await Advertisement.findByPk(id);
    if (!ad) {
      throw new NotFoundError('广告不存在');
    }
    if (data.code && data.code !== ad.ad_code) {
      const exist = await Advertisement.findOne({ where: { ad_code: data.code, id: { [Op.ne]: id } } });
      if (exist) {
        throw new ConflictError('广告编码已存在');
      }
    }
    await Advertisement.update({
      ad_name: data.name,
      ad_code: data.code,
      ad_type: data.type,
      ad_position: data.position,
      ad_title: data.title,
      ad_subtitle: data.subtitle,
      ad_image: data.image,
      ad_video: data.video,
      redirect_url: data.redirectUrl,
      redirect_type: data.redirectType,
      target_id: data.targetId,
      advertiser_name: data.advertiserName,
      start_time: data.startTime,
      end_time: data.endTime,
      budget_amount: data.budgetAmount,
      frequency_cap: data.frequencyCap,
      target_audience: data.targetAudience,
      ad_status: data.status,
      audit_status: data.auditStatus,
      sort_order: data.sortOrder,
      remark: data.remark,
      updated_by: operatorId,
    }, { where: { id } });
    return true;
  }

  async deleteAd(id) {
    const ad = await Advertisement.findByPk(id);
    if (!ad) {
      throw new NotFoundError('广告不存在');
    }
    await ad.destroy();
    return true;
  }

  async batchDeleteAds(ids) {
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择要删除的广告');
    }
    await Advertisement.destroy({ where: { id: { [Op.in]: ids } } });
    return true;
  }
}

module.exports = new AdvertisementService();
