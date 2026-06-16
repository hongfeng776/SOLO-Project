const { Activity } = require('../models');
const { Op } = require('../config/database');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch } = require('../utils/helpers');

class ActivityService {
  async getActivityList(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query);
    const search = parseSearch(query, ['activity_name', 'activity_code', 'activity_theme']);

    const where = { ...search };

    if (query.type) where.activity_type = query.type;
    if (query.status !== undefined) where.activity_status = query.status;

    const { count, rows } = await Activity.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order,
    });

    return {
      list: rows.map((activity) => ({
        id: activity.id,
        name: activity.activity_name,
        code: activity.activity_code,
        type: activity.activity_type,
        theme: activity.activity_theme,
        image: activity.activity_image,
        banner: activity.activity_banner,
        startTime: activity.start_time,
        endTime: activity.end_time,
        signupStart: activity.signup_start,
        signupEnd: activity.signup_end,
        totalBudget: activity.total_budget,
        usedBudget: activity.used_budget,
        participantLimit: activity.participant_limit,
        participantCount: activity.participant_count,
        pageView: activity.page_view,
        uniqueVisitor: activity.unique_visitor,
        shareCount: activity.share_count,
        status: activity.activity_status,
        isHot: activity.is_hot,
        isTop: activity.is_top,
        sortOrder: activity.sort_order,
        createdAt: activity.created_at,
      })),
      total: count,
      page,
      pageSize,
    };
  }

  async getActivityById(id) {
    const activity = await Activity.findByPk(id);
    if (!activity) {
      throw new NotFoundError('活动不存在');
    }
    return {
      id: activity.id,
      name: activity.activity_name,
      code: activity.activity_code,
      type: activity.activity_type,
      theme: activity.activity_theme,
      image: activity.activity_image,
      banner: activity.activity_banner,
      description: activity.activity_description,
      rules: activity.activity_rules,
      startTime: activity.start_time,
      endTime: activity.end_time,
      signupStart: activity.signup_start,
      signupEnd: activity.signup_end,
      config: activity.activity_config,
      prizePool: activity.prize_pool,
      totalBudget: activity.total_budget,
      usedBudget: activity.used_budget,
      participantLimit: activity.participant_limit,
      participantCount: activity.participant_count,
      pageView: activity.page_view,
      uniqueVisitor: activity.unique_visitor,
      shareCount: activity.share_count,
      status: activity.activity_status,
      isHot: activity.is_hot,
      isTop: activity.is_top,
      sortOrder: activity.sort_order,
      redirectUrl: activity.redirect_url,
      remark: activity.remark,
    };
  }

  async createActivity(data, operatorId) {
    const exist = await Activity.findOne({ where: { activity_code: data.code } });
    if (exist) {
      throw new ConflictError('活动编码已存在');
    }
    const activity = await Activity.create({
      activity_name: data.name,
      activity_code: data.code,
      activity_type: data.type,
      activity_theme: data.theme,
      activity_image: data.image,
      activity_banner: data.banner,
      activity_description: data.description,
      activity_rules: data.rules,
      start_time: data.startTime,
      end_time: data.endTime,
      signup_start: data.signupStart,
      signup_end: data.signupEnd,
      activity_config: data.config,
      prize_pool: data.prizePool,
      total_budget: data.totalBudget,
      participant_limit: data.participantLimit,
      activity_status: data.status ?? 0,
      is_hot: data.isHot ?? 0,
      is_top: data.isTop ?? 0,
      sort_order: data.sortOrder ?? 0,
      redirect_url: data.redirectUrl,
      remark: data.remark,
      created_by: operatorId,
    });
    return activity.id;
  }

  async updateActivity(id, data, operatorId) {
    const activity = await Activity.findByPk(id);
    if (!activity) {
      throw new NotFoundError('活动不存在');
    }
    if (data.code && data.code !== activity.activity_code) {
      const exist = await Activity.findOne({ where: { activity_code: data.code, id: { [Op.ne]: id } } });
      if (exist) {
        throw new ConflictError('活动编码已存在');
      }
    }
    await Activity.update({
      activity_name: data.name,
      activity_code: data.code,
      activity_type: data.type,
      activity_theme: data.theme,
      activity_image: data.image,
      activity_banner: data.banner,
      activity_description: data.description,
      activity_rules: data.rules,
      start_time: data.startTime,
      end_time: data.endTime,
      signup_start: data.signupStart,
      signup_end: data.signupEnd,
      activity_config: data.config,
      prize_pool: data.prizePool,
      total_budget: data.totalBudget,
      participant_limit: data.participantLimit,
      activity_status: data.status,
      is_hot: data.isHot,
      is_top: data.isTop,
      sort_order: data.sortOrder,
      redirect_url: data.redirectUrl,
      remark: data.remark,
      updated_by: operatorId,
    }, { where: { id } });
    return true;
  }

  async deleteActivity(id) {
    const activity = await Activity.findByPk(id);
    if (!activity) {
      throw new NotFoundError('活动不存在');
    }
    await activity.destroy();
    return true;
  }
}

module.exports = new ActivityService();
