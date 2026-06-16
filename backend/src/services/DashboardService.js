const { Content, User, Advertisement, Activity, Copyright, Member } = require('../models');
const { Op } = require('../config/database');
const { setCache, getCache, deleteCache } = require('../config/redis');

const CACHE_KEY = 'dashboard:stats';
const CACHE_TTL = 300;

class DashboardService {
  async getDashboardStats() {
    const cached = await getCache(CACHE_KEY);
    if (cached) {
      return cached;
    }

    const contentTotal = await Content.count();
    const contentCategoryStats = await Content.findAll({
      attributes: ['content_category', [require('../config/database').sequelize.fn('COUNT', '*'), 'count']],
      group: ['content_category'],
      raw: true,
    });
    const contentAuditStats = await Content.findAll({
      attributes: ['audit_status', [require('../config/database').sequelize.fn('COUNT', '*'), 'count']],
      group: ['audit_status'],
      raw: true,
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const contentTodayCount = await Content.count({
      where: { created_at: { [Op.gte]: todayStart } },
    });

    const categoryMap = {};
    for (const item of contentCategoryStats) {
      categoryMap[item.content_category] = Number(item.count);
    }
    const auditMap = {};
    for (const item of contentAuditStats) {
      auditMap[item.audit_status] = Number(item.count);
    }

    const userTotal = await User.count();
    const activeUserCount = await User.count({
      where: {
        last_login_at: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });
    const userTodayCount = await User.count({
      where: { created_at: { [Op.gte]: todayStart } },
    });

    const adBudgetResult = await Advertisement.findOne({
      attributes: [[require('../config/database').sequelize.fn('SUM', require('../config/database').sequelize.col('budget_amount')), 'totalBudget']],
      raw: true,
    });
    const adSpentResult = await Advertisement.findOne({
      attributes: [[require('../config/database').sequelize.fn('SUM', require('../config/database').sequelize.col('spent_amount')), 'totalSpent']],
      raw: true,
    });
    const adImpressionResult = await Advertisement.findOne({
      attributes: [[require('../config/database').sequelize.fn('SUM', require('../config/database').sequelize.col('impression_count')), 'totalImpression']],
      raw: true,
    });
    const adClickResult = await Advertisement.findOne({
      attributes: [[require('../config/database').sequelize.fn('SUM', require('../config/database').sequelize.col('click_count')), 'totalClick']],
      raw: true,
    });

    const totalImpression = Number(adImpressionResult?.totalImpression || 0);
    const totalClick = Number(adClickResult?.totalClick || 0);
    const avgCtr = totalImpression > 0 ? Number(((totalClick / totalImpression) * 100).toFixed(2)) : 0;

    const activityBudgetResult = await Activity.findOne({
      attributes: [[require('../config/database').sequelize.fn('SUM', require('../config/database').sequelize.col('total_budget')), 'totalBudget']],
      raw: true,
    });
    const activityUsedResult = await Activity.findOne({
      attributes: [[require('../config/database').sequelize.fn('SUM', require('../config/database').sequelize.col('used_budget')), 'totalUsed']],
      raw: true,
    });
    const activityParticipantResult = await Activity.findOne({
      attributes: [[require('../config/database').sequelize.fn('SUM', require('../config/database').sequelize.col('participant_count')), 'totalParticipant']],
      raw: true,
    });

    const copyrightValidCount = await Copyright.count({ where: { status: 1 } });
    const copyrightExpiringCount = await Copyright.count({ where: { status: 2 } });
    const copyrightExpiredCount = await Copyright.count({ where: { status: 0 } });

    const memberLevelStats = await Member.findAll({
      attributes: ['member_level', [require('../config/database').sequelize.fn('COUNT', '*'), 'count']],
      group: ['member_level'],
      raw: true,
    });
    const memberLevelMap = {};
    for (const item of memberLevelStats) {
      memberLevelMap[item.member_level] = Number(item.count);
    }

    const stats = {
      contentStats: {
        total: contentTotal,
        categoryStats: categoryMap,
        auditStats: auditMap,
        todayCount: contentTodayCount,
      },
      userStats: {
        total: userTotal,
        activeCount: activeUserCount,
        todayCount: userTodayCount,
      },
      adStats: {
        totalBudget: Number(adBudgetResult?.totalBudget || 0),
        totalSpent: Number(adSpentResult?.totalSpent || 0),
        totalImpression,
        totalClick,
        avgCtr,
      },
      activityStats: {
        totalBudget: Number(activityBudgetResult?.totalBudget || 0),
        totalUsed: Number(activityUsedResult?.totalUsed || 0),
        totalParticipant: Number(activityParticipantResult?.totalParticipant || 0),
      },
      copyrightStats: {
        validCount: copyrightValidCount,
        expiringCount: copyrightExpiringCount,
        expiredCount: copyrightExpiredCount,
      },
      memberStats: memberLevelMap,
    };

    await setCache(CACHE_KEY, stats, CACHE_TTL);
    return stats;
  }

  async getPlayTrend(days = 7) {
    const result = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const contents = await Content.findAll({
        attributes: ['play_count'],
        where: {
          created_at: { [Op.lt]: nextDate },
          status: 1,
        },
        raw: true,
      });

      const totalPlay = contents.reduce((sum, c) => sum + Number(c.play_count || 0), 0);

      result.push({
        date: date.toISOString().slice(0, 10),
        playCount: totalPlay,
      });
    }

    for (let i = result.length - 1; i > 0; i--) {
      result[i].playCount = Math.max(0, result[i].playCount - result[i - 1].playCount);
    }
    if (result.length > 0) {
      result[0].playCount = 0;
    }

    return result;
  }

  async getAuditEfficiency(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const auditedContents = await Content.findAll({
      where: {
        audit_time: { [Op.gte]: startDate },
        audit_status: { [Op.in]: [2, 3] },
      },
      attributes: ['id', 'audit_status', 'audit_time', 'created_at'],
      raw: true,
    });

    const totalAudited = auditedContents.length;
    const passedCount = auditedContents.filter((c) => c.audit_status === 2).length;
    const passRate = totalAudited > 0 ? Number(((passedCount / totalAudited) * 100).toFixed(2)) : 0;

    let totalDuration = 0;
    let durationCount = 0;
    for (const content of auditedContents) {
      if (content.audit_time && content.created_at) {
        const duration = new Date(content.audit_time) - new Date(content.created_at);
        totalDuration += duration;
        durationCount++;
      }
    }
    const avgAuditDuration = durationCount > 0 ? Math.round(totalDuration / durationCount / (1000 * 60)) : 0;

    const dailyStats = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayAudited = auditedContents.filter((c) => {
        const auditTime = new Date(c.audit_time);
        return auditTime >= date && auditTime < nextDate;
      });
      const dayPassed = dayAudited.filter((c) => c.audit_status === 2).length;

      dailyStats.push({
        date: date.toISOString().slice(0, 10),
        auditedCount: dayAudited.length,
        passedCount: dayPassed,
      });
    }

    return {
      totalAudited,
      passedCount,
      passRate,
      avgAuditDuration,
      dailyStats,
    };
  }

  async getRevenueOverview(days = 30) {
    const result = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const dateStr = date.toISOString().slice(0, 10);

      const adSpentResult = await Advertisement.findOne({
        attributes: [[require('../config/database').sequelize.fn('SUM', require('../config/database').sequelize.col('spent_amount')), 'spent']],
        where: {
          updated_at: { [Op.gte]: date, [Op.lt]: nextDate },
        },
        raw: true,
      });

      const memberSpentResult = await Member.findOne({
        attributes: [[require('../config/database').sequelize.fn('SUM', require('../config/database').sequelize.col('total_spent')), 'spent']],
        where: {
          updated_at: { [Op.gte]: date, [Op.lt]: nextDate },
        },
        raw: true,
      });

      const adRevenue = Number(adSpentResult?.spent || 0);
      const memberRevenue = Number(memberSpentResult?.spent || 0);

      result.push({
        date: dateStr,
        adRevenue,
        memberRevenue,
        totalRevenue: adRevenue + memberRevenue,
      });
    }

    return result;
  }

  async refreshCache() {
    await deleteCache(CACHE_KEY);
    return this.getDashboardStats();
  }
}

module.exports = new DashboardService();
