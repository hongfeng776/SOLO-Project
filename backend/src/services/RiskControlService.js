const { Copyright, Content, Advertisement, Activity, Comment } = require('../models');
const { Op } = require('../config/database');
const { NotFoundError, BadRequestError, ConflictError, ValidationError } = require('../utils/errors');
const { setCache, getCache, deleteCache } = require('../config/redis');
const { formatDate } = require('../utils/helpers');

const SENSITIVE_WORDS = {
  porn: ['色情', '裸体', '黄色', '淫秽', '涉黄', '成人视频', '招嫖', '色诱', '艳舞', '情趣用品'],
  violence: ['杀人', '砍人', '爆炸', '恐怖袭击', '血腥', '虐杀', '自杀指南', '炸弹制作', '涉枪', '暴力恐吓'],
  politics: ['颠覆政权', '分裂国家', '反动', '邪教', '煽动叛乱', '政治谣言', '国家机密', '攻击领导人', '境外渗透', '邪教组织'],
  ad: ['加微信', '免费领取', '代开发票', '刷单', '兼职日结', '低价代购', '赌博网站', '博彩平台', '套现', '黑产'],
};

const SPAM_USER_WINDOW = 5 * 60;
const SPAM_USER_MAX_COMMENTS = 3;
const RATE_LIMIT_IP_WINDOW = 60 * 60;
const RATE_LIMIT_IP_MAX_COMMENTS = 10;

const AUDIT_TRANSITIONS = {
  0: [1],
  1: [2, 3],
  2: [4],
  3: [0],
  4: [],
};

const ACTIVITY_TRANSITIONS = {
  0: [1],
  1: [2, 4],
  2: [3, 4],
  3: [],
  4: [1],
};

class RiskControlService {
  async checkCopyrightExpiry() {
    const now = new Date();
    const expired = await Copyright.findAll({
      where: {
        end_date: { [Op.lt]: now },
        status: { [Op.ne]: 0 },
      },
    });
    const expiringThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiring = await Copyright.findAll({
      where: {
        end_date: { [Op.between]: [now, expiringThreshold] },
        status: 1,
      },
    });

    const results = { expired: [], expiring: [], handledContents: 0 };

    for (const copyright of expired) {
      await copyright.update({ status: 0 });
      const handledCount = await this.handleCopyrightExpired(copyright.id);
      results.expired.push({ id: copyright.id, name: copyright.copyright_name, handledContents: handledCount });
      results.handledContents += handledCount;
    }

    for (const copyright of expiring) {
      await copyright.update({ status: 2 });
      results.expiring.push({ id: copyright.id, name: copyright.copyright_name, endDate: copyright.end_date });
    }

    return results;
  }

  async handleCopyrightExpired(copyrightId) {
    const [affectedCount] = await Content.update(
      { audit_status: 4, status: 0 },
      { where: { copyright_id: copyrightId, audit_status: { [Op.ne]: 4 } } }
    );
    return affectedCount;
  }

  async getExpiringCopyrights(days = 30) {
    const now = new Date();
    const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const copyrights = await Copyright.findAll({
      where: {
        end_date: { [Op.between]: [now, threshold] },
        status: { [Op.in]: [1, 2] },
      },
      include: [{ model: Content, as: 'contents', attributes: ['id', 'content_title', 'audit_status', 'status'] }],
      order: [['end_date', 'ASC']],
    });

    return copyrights.map((c) => ({
      id: c.id,
      name: c.copyright_name,
      code: c.copyright_code,
      type: c.copyright_type,
      supplierName: c.supplier_name,
      endDate: c.end_date,
      status: c.status,
      remainingDays: Math.ceil((new Date(c.end_date) - now) / (24 * 60 * 60 * 1000)),
      relatedContents: (c.contents || []).length,
    }));
  }

  validateAuditTransition(currentStatus, targetStatus) {
    const allowed = AUDIT_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(targetStatus)) {
      const statusLabels = { 0: '待审核', 1: '审核中', 2: '通过', 3: '驳回', 4: '下架' };
      throw new BadRequestError(
        `审核状态不允许从"${statusLabels[currentStatus] || currentStatus}"转换到"${statusLabels[targetStatus] || targetStatus}"，请按流程操作`
      );
    }
    return true;
  }

  async auditWithCopyrightCheck(contentId, targetAuditStatus, auditRemark, auditorId) {
    const content = await Content.findByPk(contentId, {
      include: [{ model: Copyright, as: 'copyright' }],
    });
    if (!content) {
      throw new NotFoundError('内容不存在');
    }

    this.validateAuditTransition(content.audit_status, targetAuditStatus);

    if (targetAuditStatus === 2 && content.copyright_id) {
      if (!content.copyright || content.copyright.status === 0) {
        throw new BadRequestError('关联版权已失效，无法审核通过，请先更新版权信息');
      }
      if (content.copyright.status === 2) {
        throw new BadRequestError('关联版权即将到期，请确认版权续约后再审核通过');
      }
    }

    await Content.update({
      audit_status: targetAuditStatus,
      audit_remark: auditRemark,
      auditor_id: auditorId,
      audit_time: new Date(),
    }, { where: { id: contentId } });

    return true;
  }

  async batchAuditWithValidation(ids, targetAuditStatus, auditRemark, auditorId) {
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择要审核的内容');
    }

    const contents = await Content.findAll({
      where: { id: { [Op.in]: ids } },
      include: [{ model: Copyright, as: 'copyright' }],
    });

    if (contents.length === 0) {
      throw new NotFoundError('未找到对应内容');
    }

    const invalidItems = [];
    const validIds = [];

    for (const content of contents) {
      try {
        this.validateAuditTransition(content.audit_status, targetAuditStatus);

        if (targetAuditStatus === 2 && content.copyright_id) {
          if (!content.copyright || content.copyright.status === 0) {
            throw new BadRequestError('关联版权已失效');
          }
        }

        validIds.push(content.id);
      } catch (err) {
        invalidItems.push({ id: content.id, title: content.content_title, reason: err.message });
      }
    }

    if (validIds.length > 0) {
      await Content.update({
        audit_status: targetAuditStatus,
        audit_remark: auditRemark,
        auditor_id: auditorId,
        audit_time: new Date(),
      }, { where: { id: { [Op.in]: validIds } } });
    }

    return {
      successCount: validIds.length,
      failCount: invalidItems.length,
      invalidItems,
    };
  }

  async filterComment(content, userId, ip) {
    const result = {
      isSafe: true,
      violationLevel: 0,
      violationType: null,
      filterResult: { sensitiveWords: [], isSpam: false, isRateLimited: false },
    };

    const sensitiveHits = this._matchSensitiveWords(content);
    if (sensitiveHits.length > 0) {
      result.isSafe = false;
      result.filterResult.sensitiveWords = sensitiveHits;
      const hasHighRisk = sensitiveHits.some((h) => h.category === 'politics' || h.category === 'violence');
      result.violationLevel = hasHighRisk ? 3 : sensitiveHits.some((h) => h.category === 'porn') ? 2 : 1;
      result.violationType = sensitiveHits[0].category;
    }

    if (userId) {
      const isSpam = await this._checkUserSpam(userId);
      if (isSpam) {
        result.isSafe = false;
        result.filterResult.isSpam = true;
        if (result.violationLevel < 2) {
          result.violationLevel = 2;
          result.violationType = 'spam';
        }
      }
    }

    if (ip) {
      const isRateLimited = await this._checkIpRateLimit(ip);
      if (isRateLimited) {
        result.isSafe = false;
        result.filterResult.isRateLimited = true;
        if (result.violationLevel < 1) {
          result.violationLevel = 1;
          result.violationType = 'spam';
        }
      }
    }

    return result;
  }

  _matchSensitiveWords(text) {
    const hits = [];
    for (const [category, words] of Object.entries(SENSITIVE_WORDS)) {
      for (const word of words) {
        if (text.includes(word)) {
          hits.push({ word, category });
        }
      }
    }
    return hits;
  }

  async _checkUserSpam(userId) {
    const cacheKey = `comment:spam:user:${userId}`;
    const count = await getCache(cacheKey);
    const currentCount = (count || 0) + 1;
    await setCache(cacheKey, currentCount, SPAM_USER_WINDOW);
    return currentCount > SPAM_USER_MAX_COMMENTS;
  }

  async _checkIpRateLimit(ip) {
    const cacheKey = `comment:ratelimit:ip:${ip}`;
    const count = await getCache(cacheKey);
    const currentCount = (count || 0) + 1;
    await setCache(cacheKey, currentCount, RATE_LIMIT_IP_WINDOW);
    return currentCount > RATE_LIMIT_IP_MAX_COMMENTS;
  }

  async validateAdCompliance(adData) {
    const errors = {};

    if (!adData.adTitle || !adData.adTitle.trim()) {
      errors.adTitle = '广告标题不能为空';
    }
    if (!adData.adImage || !adData.adImage.trim()) {
      errors.adImage = '广告图片不能为空';
    }

    if (adData.redirectUrl) {
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(adData.redirectUrl)) {
        errors.redirectUrl = '跳转链接格式不正确，必须以http://或https://开头';
      }
    }

    if (adData.budgetAmount !== undefined && adData.budgetAmount !== null) {
      const budget = parseFloat(adData.budgetAmount);
      if (isNaN(budget) || budget < 0) {
        errors.budgetAmount = '预算金额不能为负数';
      }
      if (budget > 10000000) {
        errors.budgetAmount = '预算金额超出合理范围（上限1000万）';
      }
      if (adData.spentAmount !== undefined) {
        const spent = parseFloat(adData.spentAmount) || 0;
        if (spent > budget) {
          errors.budgetAmount = '已消耗金额不能超过预算金额';
        }
      }
    }

    if (adData.startTime && adData.endTime) {
      const start = new Date(adData.startTime);
      const end = new Date(adData.endTime);
      if (end <= start) {
        errors.endTime = '投放结束时间必须晚于开始时间';
      }
      const maxDuration = 365 * 24 * 60 * 60 * 1000;
      if (end - start > maxDuration) {
        errors.endTime = '投放周期不能超过1年';
      }
    }

    if (adData.targetId) {
      const content = await Content.findByPk(adData.targetId, {
        include: [{ model: Copyright, as: 'copyright' }],
      });
      if (!content) {
        errors.targetId = '关联内容不存在';
      } else if (content.copyright_id) {
        if (!content.copyright || content.copyright.status === 0) {
          errors.targetId = '广告主关联内容的版权已失效，请先更新版权信息';
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('广告合规校验失败', errors);
    }
    return true;
  }

  async syncActivityStatus() {
    const now = new Date();

    const toOngoing = await Activity.update(
      { activity_status: 2 },
      {
        where: {
          activity_status: 1,
          start_time: { [Op.lte]: now },
          end_time: { [Op.gt]: now },
        },
      }
    );

    const toEnded = await Activity.update(
      { activity_status: 3 },
      {
        where: {
          activity_status: { [Op.in]: [1, 2] },
          end_time: { [Op.lte]: now },
        },
      }
    );

    return {
      toOngoing: toOngoing[0],
      toEnded: toEnded[0],
    };
  }

  validateActivityTransition(currentStatus, targetStatus) {
    const allowed = ACTIVITY_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(targetStatus)) {
      const statusLabels = { 0: '草稿', 1: '已发布', 2: '进行中', 3: '已结束', 4: '已取消' };
      throw new BadRequestError(
        `活动状态不允许从"${statusLabels[currentStatus] || currentStatus}"转换到"${statusLabels[targetStatus] || targetStatus}"，请按流程操作`
      );
    }
    return true;
  }
}

module.exports = new RiskControlService();
