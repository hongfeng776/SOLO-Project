const { Copyright, Content, Activity, Advertisement, Message, User } = require('../models');
const { Op } = require('../config/database');
const { Sequelize } = require('sequelize');
const { setCache, deleteCache } = require('../config/redis');

class SchedulerService {
  constructor() {
    this.timers = [];
  }

  async checkCopyrightExpiry() {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    try {
      const expiringCopyrights = await Copyright.findAll({
        where: {
          status: 1,
          end_date: { [Op.between]: [now, thirtyDaysLater] },
        },
      });

      if (expiringCopyrights.length > 0) {
        const expiringIds = expiringCopyrights.map((c) => c.id);
        await Copyright.update({ status: 2 }, { where: { id: { [Op.in]: expiringIds } } });

        for (const copyright of expiringCopyrights) {
          await Message.create({
            message_type: 3,
            title: '版权即将到期提醒',
            content: `版权「${copyright.copyright_name}」(编号: ${copyright.copyright_code})将于${new Date(copyright.end_date).toLocaleString('zh-CN')}到期，请及时处理续约事宜。`,
            is_broadcast: 1,
            link_type: 'copyright',
            link_id: copyright.id,
            priority: 1,
            push_channel: 'in_app',
          });
        }
        console.log(`[Scheduler] 版权即将到期检测: ${expiringCopyrights.length}条版权已标记为即将到期`);
      }

      const expiredCopyrights = await Copyright.findAll({
        where: {
          status: { [Op.in]: [1, 2] },
          end_date: { [Op.lte]: now },
        },
      });

      if (expiredCopyrights.length > 0) {
        const expiredIds = expiredCopyrights.map((c) => c.id);
        await Copyright.update({ status: 0 }, { where: { id: { [Op.in]: expiredIds } } });

        const affectedContents = await Content.findAll({
          where: {
            copyright_id: { [Op.in]: expiredIds },
            status: 1,
          },
        });

        if (affectedContents.length > 0) {
          const affectedContentIds = affectedContents.map((c) => c.id);
          await Content.update(
            { status: 0, audit_status: 4 },
            { where: { id: { [Op.in]: affectedContentIds } } }
          );
          console.log(`[Scheduler] 版权失效处理: ${affectedContents.length}条关联内容已下架`);
        }

        for (const copyright of expiredCopyrights) {
          await Message.create({
            message_type: 3,
            title: '版权已失效通知',
            content: `版权「${copyright.copyright_name}」(编号: ${copyright.copyright_code})已过期失效，关联内容已自动下架。`,
            is_broadcast: 1,
            link_type: 'copyright',
            link_id: copyright.id,
            priority: 2,
            push_channel: 'in_app',
          });
        }
        console.log(`[Scheduler] 版权失效检测: ${expiredCopyrights.length}条版权已标记为失效`);
      }

      await this._clearCopyrightCache();
    } catch (error) {
      console.error('[Scheduler] 版权到期检测任务异常:', error.message);
    }
  }

  async syncActivityStatus() {
    const now = new Date();

    try {
      const [publishedToOngoing] = await Activity.update(
        { activity_status: 2 },
        {
          where: {
            activity_status: 1,
            start_time: { [Op.lte]: now },
          },
        }
      );

      if (publishedToOngoing > 0) {
        console.log(`[Scheduler] 活动状态同步: ${publishedToOngoing}条活动已更新为进行中`);
      }

      const [ongoingToEnded] = await Activity.update(
        { activity_status: 3 },
        {
          where: {
            activity_status: 2,
            end_time: { [Op.lte]: now },
          },
        }
      );

      if (ongoingToEnded > 0) {
        console.log(`[Scheduler] 活动状态同步: ${ongoingToEnded}条活动已更新为已结束`);
      }

      await this._clearActivityCache();
    } catch (error) {
      console.error('[Scheduler] 活动状态同步任务异常:', error.message);
    }
  }

  async syncAdvertisementStatus() {
    const now = new Date();

    try {
      const [pendingToRunning] = await Advertisement.update(
        { ad_status: 2 },
        {
          where: {
            ad_status: 1,
            start_time: { [Op.lte]: now },
          },
        }
      );

      if (pendingToRunning > 0) {
        console.log(`[Scheduler] 广告状态同步: ${pendingToRunning}条广告已更新为投放中`);
      }

      const [runningToEnded] = await Advertisement.update(
        { ad_status: 4 },
        {
          where: {
            ad_status: 2,
            end_time: { [Op.lte]: now },
          },
        }
      );

      if (runningToEnded > 0) {
        console.log(`[Scheduler] 广告状态同步: ${runningToEnded}条广告已更新为已结束`);
      }

      await this._clearAdvertisementCache();
    } catch (error) {
      console.error('[Scheduler] 广告状态同步任务异常:', error.message);
    }
  }

  async refreshDashboardStats() {
    try {
      const { fn, col, literal } = Sequelize;

      const totalContent = await Content.count();
      const categoryStats = await Content.findAll({
        attributes: ['content_category', [fn('COUNT', literal('*')), 'count']],
        group: ['content_category'],
        raw: true,
      });
      const auditStatusStats = await Content.findAll({
        attributes: ['audit_status', [fn('COUNT', literal('*')), 'count']],
        group: ['audit_status'],
        raw: true,
      });

      const totalUsers = await User.count();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const activeUsers = await User.count({
        where: { last_login_at: { [Op.gte]: thirtyDaysAgo } },
      });

      const adStats = await Advertisement.findAll({
        attributes: [
          [fn('COALESCE', fn('SUM', col('budget_amount')), 0), 'totalBudget'],
          [fn('COALESCE', fn('SUM', col('spent_amount')), 0), 'totalSpent'],
          [fn('COALESCE', fn('SUM', col('impression_count')), 0), 'totalImpressions'],
          [fn('COALESCE', fn('SUM', col('click_count')), 0), 'totalClicks'],
        ],
        raw: true,
      });

      const activityStats = await Activity.findAll({
        attributes: [
          [fn('COALESCE', fn('SUM', col('total_budget')), 0), 'totalBudget'],
          [fn('COALESCE', fn('SUM', col('used_budget')), 0), 'totalSpent'],
          [fn('COALESCE', fn('SUM', col('participant_count')), 0), 'totalParticipants'],
        ],
        raw: true,
      });

      const stats = {
        content: {
          total: totalContent,
          byCategory: categoryStats.reduce((acc, item) => {
            acc[item.content_category] = parseInt(item.count, 10);
            return acc;
          }, {}),
          byAuditStatus: auditStatusStats.reduce((acc, item) => {
            acc[item.audit_status] = parseInt(item.count, 10);
            return acc;
          }, {}),
        },
        user: {
          total: totalUsers,
          active: activeUsers,
        },
        advertisement: {
          totalBudget: parseFloat(adStats[0].totalBudget) || 0,
          totalSpent: parseFloat(adStats[0].totalSpent) || 0,
          totalImpressions: parseInt(adStats[0].totalImpressions, 10) || 0,
          totalClicks: parseInt(adStats[0].totalClicks, 10) || 0,
        },
        activity: {
          totalBudget: parseFloat(activityStats[0].totalBudget) || 0,
          totalSpent: parseFloat(activityStats[0].totalSpent) || 0,
          totalParticipants: parseInt(activityStats[0].totalParticipants, 10) || 0,
        },
        updatedAt: new Date().toISOString(),
      };

      await setCache('dashboard:stats', stats, 1800);
      console.log('[Scheduler] 数据统计刷新完成');
    } catch (error) {
      console.error('[Scheduler] 数据统计刷新任务异常:', error.message);
    }
  }

  async start() {
    console.log('[Scheduler] 定时任务服务启动中...');

    await this._runAllTasks();

    this.timers.push(
      setInterval(() => this.checkCopyrightExpiry(), 60 * 60 * 1000)
    );
    this.timers.push(
      setInterval(() => this.syncActivityStatus(), 5 * 60 * 1000)
    );
    this.timers.push(
      setInterval(() => this.syncAdvertisementStatus(), 5 * 60 * 1000)
    );
    this.timers.push(
      setInterval(() => this.refreshDashboardStats(), 30 * 60 * 1000)
    );

    console.log('[Scheduler] 定时任务服务已启动');
    console.log('[Scheduler]   - 版权到期检测: 每小时执行一次');
    console.log('[Scheduler]   - 活动状态同步: 每5分钟执行一次');
    console.log('[Scheduler]   - 广告状态同步: 每5分钟执行一次');
    console.log('[Scheduler]   - 数据统计刷新: 每30分钟执行一次');
  }

  stop() {
    this.timers.forEach((timer) => clearInterval(timer));
    this.timers = [];
    console.log('[Scheduler] 定时任务服务已停止');
  }

  async _runAllTasks() {
    console.log('[Scheduler] 执行初始任务...');
    await Promise.allSettled([
      this.checkCopyrightExpiry(),
      this.syncActivityStatus(),
      this.syncAdvertisementStatus(),
      this.refreshDashboardStats(),
    ]);
    console.log('[Scheduler] 初始任务执行完毕');
  }

  async _clearCopyrightCache() {
    try {
      await deleteCache('copyright:list');
      await deleteCache('copyright:detail');
    } catch (error) {
      console.error('[Scheduler] 清除版权缓存异常:', error.message);
    }
  }

  async _clearActivityCache() {
    try {
      await deleteCache('activity:list');
      await deleteCache('activity:detail');
    } catch (error) {
      console.error('[Scheduler] 清除活动缓存异常:', error.message);
    }
  }

  async _clearAdvertisementCache() {
    try {
      await deleteCache('advertisement:list');
      await deleteCache('advertisement:detail');
    } catch (error) {
      console.error('[Scheduler] 清除广告缓存异常:', error.message);
    }
  }
}

module.exports = new SchedulerService();
