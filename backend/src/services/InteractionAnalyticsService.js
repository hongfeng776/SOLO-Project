const { Content, Comment, Danmaku, ContentInteractionStat, InteractionStatTraceLog } = require('../models');
const { Op, sequelize } = require('../config/database');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch, generateBatchNo } = require('../utils/helpers');

const VALID_INTERACTION_TYPES = ['comment', 'danmaku', 'like', 'share', 'collect'];

class InteractionAnalyticsService {
  async aggregateInteractionStats(query) {
    const { contentCategory, startDate, endDate, interactionTypes } = query;

    if (!contentCategory || !startDate || !endDate || !interactionTypes) {
      throw new BadRequestError('筛选维度不全，请完善内容品类、统计时段、互动类型');
    }

    const types = interactionTypes.split(',').filter((t) => VALID_INTERACTION_TYPES.includes(t.trim()));
    if (types.length === 0) {
      throw new BadRequestError('请选择有效的互动类型');
    }

    const contentWhere = {
      content_category: Number(contentCategory),
    };

    const contents = await Content.findAll({
      where: contentWhere,
      attributes: ['id', 'content_title', 'content_category', 'is_hot', 'play_count', 'like_count', 'share_count', 'collect_count', 'comment_count', 'danmaku_count'],
    });

    if (contents.length === 0) {
      throw new BadRequestError('所选时段暂无互动数据');
    }

    const contentIds = contents.map((c) => c.id);

    const commentCounts = await Comment.findAll({
      attributes: ['content_id', [sequelize.fn('COUNT', '*'), 'count']],
      where: {
        content_id: { [Op.in]: contentIds },
        created_at: { [Op.between]: [new Date(startDate), new Date(endDate)] },
        comment_status: { [Op.in]: [1, 2] },
      },
      group: ['content_id'],
      raw: true,
    });

    const danmakuCounts = await Danmaku.findAll({
      attributes: ['content_id', [sequelize.fn('COUNT', '*'), 'count']],
      where: {
        content_id: { [Op.in]: contentIds },
        created_at: { [Op.between]: [new Date(startDate), new Date(endDate)] },
        danmaku_status: { [Op.in]: [1, 2] },
      },
      group: ['content_id'],
      raw: true,
    });

    const commentCountMap = {};
    for (const item of commentCounts) {
      commentCountMap[item.content_id] = Number(item.count);
    }

    const danmakuCountMap = {};
    for (const item of danmakuCounts) {
      danmakuCountMap[item.content_id] = Number(item.count);
    }

    const statBatch = generateBatchNo('IAS');
    const results = [];
    const statRecords = [];

    for (const content of contents) {
      const commentCount = commentCountMap[content.id] || 0;
      const danmakuCount = danmakuCountMap[content.id] || 0;
      const likeCount = Number(content.like_count || 0);
      const shareCount = Number(content.share_count || 0);
      const collectCount = Number(content.collect_count || 0);
      const playCount = Number(content.play_count || 0);

      let totalInteractions = 0;
      if (types.includes('comment')) totalInteractions += commentCount;
      if (types.includes('danmaku')) totalInteractions += danmakuCount;
      if (types.includes('like')) totalInteractions += likeCount;
      if (types.includes('share')) totalInteractions += shareCount;
      if (types.includes('collect')) totalInteractions += collectCount;

      const interactionRate = playCount > 0 ? Number(((totalInteractions / playCount) * 100).toFixed(4)) : 0;

      let interactionTag = 0;
      let isAnomaly = 0;

      if (totalInteractions >= 5000 || interactionRate >= 5) {
        interactionTag = 1;
      } else if (totalInteractions < 100 && playCount >= 1000) {
        interactionTag = 2;
      }

      statRecords.push({
        content_id: content.id,
        stat_date: endDate,
        comment_count: commentCount,
        danmaku_count: danmakuCount,
        like_count: likeCount,
        share_count: shareCount,
        collect_count: collectCount,
        play_count: playCount,
        total_interactions: totalInteractions,
        interaction_rate: interactionRate,
        interaction_tag: interactionTag,
        is_anomaly: isAnomaly,
        anomaly_types: [],
        stat_batch: statBatch,
      });

      results.push({
        contentId: content.id,
        contentTitle: content.content_title,
        contentCategory: content.content_category,
        isHot: content.is_hot,
        commentCount,
        danmakuCount,
        likeCount,
        shareCount,
        collectCount,
        playCount,
        totalInteractions,
        interactionRate,
        interactionTag,
        isAnomaly,
      });
    }

    if (statRecords.length > 0) {
      try {
        await ContentInteractionStat.bulkCreate(statRecords, {
          ignoreDuplicates: true,
        });
      } catch (err) {
        // ignore duplicate errors
      }
    }

    if (results.length === 0) {
      throw new BadRequestError('所选时段暂无互动数据');
    }

    return {
      list: results,
      statBatch,
      total: results.length,
    };
  }

  async getInteractionTrend(query) {
    const { contentCategory, startDate, endDate, interactionTypes } = query;

    if (!contentCategory || !startDate || !endDate) {
      throw new BadRequestError('请完善内容品类和统计时段');
    }

    const types = interactionTypes ? interactionTypes.split(',').filter((t) => VALID_INTERACTION_TYPES.includes(t.trim())) : VALID_INTERACTION_TYPES;

    const contents = await Content.findAll({
      where: { content_category: Number(contentCategory) },
      attributes: ['id'],
    });

    if (contents.length === 0) {
      throw new BadRequestError('所选时段暂无互动数据');
    }

    const contentIds = contents.map((c) => c.id);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d).toISOString().slice(0, 10));
    }

    const trendData = [];

    for (const day of days) {
      const dayStart = new Date(day);
      const dayEnd = new Date(day);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayData = { date: day };

      if (types.includes('comment')) {
        const result = await Comment.findOne({
          attributes: [[sequelize.fn('COUNT', '*'), 'count']],
          where: {
            content_id: { [Op.in]: contentIds },
            created_at: { [Op.between]: [dayStart, dayEnd] },
            comment_status: { [Op.in]: [1, 2] },
          },
          raw: true,
        });
        dayData.commentCount = Number(result?.count || 0);
      }

      if (types.includes('danmaku')) {
        const result = await Danmaku.findOne({
          attributes: [[sequelize.fn('COUNT', '*'), 'count']],
          where: {
            content_id: { [Op.in]: contentIds },
            created_at: { [Op.between]: [dayStart, dayEnd] },
            danmaku_status: { [Op.in]: [1, 2] },
          },
          raw: true,
        });
        dayData.danmakuCount = Number(result?.count || 0);
      }

      if (types.includes('like') || types.includes('share') || types.includes('collect')) {
        const aggResult = await Content.findOne({
          attributes: [
            [sequelize.fn('SUM', sequelize.col('like_count')), 'likeSum'],
            [sequelize.fn('SUM', sequelize.col('share_count')), 'shareSum'],
            [sequelize.fn('SUM', sequelize.col('collect_count')), 'collectSum'],
          ],
          where: { id: { [Op.in]: contentIds } },
          raw: true,
        });
        if (types.includes('like')) dayData.likeCount = Number(aggResult?.likeSum || 0);
        if (types.includes('share')) dayData.shareCount = Number(aggResult?.shareSum || 0);
        if (types.includes('collect')) dayData.collectCount = Number(aggResult?.collectSum || 0);
      }

      trendData.push(dayData);
    }

    return {
      trendData,
      dateRange: { start: startDate, end: endDate },
      interactionTypes: types,
    };
  }

  async getCategoryComparison(query) {
    const { contentCategories, startDate, endDate } = query;

    if (!startDate || !endDate) {
      throw new BadRequestError('请完善统计时段');
    }

    let categoryList;
    if (contentCategories) {
      categoryList = contentCategories.split(',').map((c) => Number(c.trim())).filter((c) => !isNaN(c));
    }

    const contentWhere = {};
    if (categoryList && categoryList.length > 0) {
      contentWhere.content_category = { [Op.in]: categoryList };
    }

    const contents = await Content.findAll({
      where: contentWhere,
      attributes: ['id', 'content_category', 'content_title', 'like_count', 'share_count', 'collect_count', 'play_count', 'comment_count', 'danmaku_count'],
    });

    if (contents.length === 0) {
      throw new BadRequestError('所选时段暂无互动数据');
    }

    const contentIds = contents.map((c) => c.id);

    const commentCounts = await Comment.findAll({
      attributes: ['content_id', [sequelize.fn('COUNT', '*'), 'count']],
      where: {
        content_id: { [Op.in]: contentIds },
        created_at: { [Op.between]: [new Date(startDate), new Date(endDate)] },
        comment_status: { [Op.in]: [1, 2] },
      },
      group: ['content_id'],
      raw: true,
    });

    const danmakuCounts = await Danmaku.findAll({
      attributes: ['content_id', [sequelize.fn('COUNT', '*'), 'count']],
      where: {
        content_id: { [Op.in]: contentIds },
        created_at: { [Op.between]: [new Date(startDate), new Date(endDate)] },
        danmaku_status: { [Op.in]: [1, 2] },
      },
      group: ['content_id'],
      raw: true,
    });

    const commentCountMap = {};
    for (const item of commentCounts) {
      commentCountMap[item.content_id] = Number(item.count);
    }
    const danmakuCountMap = {};
    for (const item of danmakuCounts) {
      danmakuCountMap[item.content_id] = Number(item.count);
    }

    const categoryStats = {};

    for (const content of contents) {
      const cat = content.content_category;
      if (!categoryStats[cat]) {
        categoryStats[cat] = {
          category: cat,
          contentCount: 0,
          commentCount: 0,
          danmakuCount: 0,
          likeCount: 0,
          shareCount: 0,
          collectCount: 0,
          playCount: 0,
          totalInteractions: 0,
        };
      }
      const cc = commentCountMap[content.id] || 0;
      const dc = danmakuCountMap[content.id] || 0;
      const lc = Number(content.like_count || 0);
      const sc = Number(content.share_count || 0);
      const coc = Number(content.collect_count || 0);
      const pc = Number(content.play_count || 0);
      const total = cc + dc + lc + sc + coc;

      categoryStats[cat].contentCount += 1;
      categoryStats[cat].commentCount += cc;
      categoryStats[cat].danmakuCount += dc;
      categoryStats[cat].likeCount += lc;
      categoryStats[cat].shareCount += sc;
      categoryStats[cat].collectCount += coc;
      categoryStats[cat].playCount += pc;
      categoryStats[cat].totalInteractions += total;
    }

    const comparisonList = Object.values(categoryStats).map((s) => ({
      ...s,
      avgInteractionPerContent: s.contentCount > 0 ? Number((s.totalInteractions / s.contentCount).toFixed(2)) : 0,
      interactionRate: s.playCount > 0 ? Number(((s.totalInteractions / s.playCount) * 100).toFixed(4)) : 0,
    }));

    return {
      comparisonList,
      dateRange: { start: startDate, end: endDate },
      totalCategories: comparisonList.length,
    };
  }

  async batchExportReport(query) {
    const { contentCategory, startDate, endDate, sortBy, sortOrder, selectedFields } = query;

    if (!contentCategory || !startDate || !endDate) {
      throw new BadRequestError('请完善内容品类和统计时段');
    }

    const { page, pageSize, offset } = parsePagination({ ...query, pageSize: query.pageSize || 1000 });
    const order = parseSort({ sortBy: sortBy || 'total_interactions', sortOrder: sortOrder || 'DESC' }, [['total_interactions', 'DESC']]);

    const contents = await Content.findAll({
      where: { content_category: Number(contentCategory) },
      attributes: ['id', 'content_title', 'content_category', 'is_hot', 'play_count', 'like_count', 'share_count', 'collect_count', 'comment_count', 'danmaku_count', 'created_at'],
      limit: pageSize,
      offset,
      order: [['created_at', 'DESC']],
    });

    if (contents.length === 0) {
      throw new BadRequestError('所选时段暂无互动数据');
    }

    const contentIds = contents.map((c) => c.id);

    const commentCounts = await Comment.findAll({
      attributes: ['content_id', [sequelize.fn('COUNT', '*'), 'count']],
      where: {
        content_id: { [Op.in]: contentIds },
        created_at: { [Op.between]: [new Date(startDate), new Date(endDate)] },
        comment_status: { [Op.in]: [1, 2] },
      },
      group: ['content_id'],
      raw: true,
    });

    const danmakuCounts = await Danmaku.findAll({
      attributes: ['content_id', [sequelize.fn('COUNT', '*'), 'count']],
      where: {
        content_id: { [Op.in]: contentIds },
        created_at: { [Op.between]: [new Date(startDate), new Date(endDate)] },
        danmaku_status: { [Op.in]: [1, 2] },
      },
      group: ['content_id'],
      raw: true,
    });

    const commentCountMap = {};
    for (const item of commentCounts) {
      commentCountMap[item.content_id] = Number(item.count);
    }
    const danmakuCountMap = {};
    for (const item of danmakuCounts) {
      danmakuCountMap[item.content_id] = Number(item.count);
    }

    const statBatch = generateBatchNo('EXP');
    const fields = selectedFields && selectedFields.length > 0 ? selectedFields : null;

    const exportData = [];
    for (const content of contents) {
      const commentCount = commentCountMap[content.id] || 0;
      const danmakuCount = danmakuCountMap[content.id] || 0;
      const likeCount = Number(content.like_count || 0);
      const shareCount = Number(content.share_count || 0);
      const collectCount = Number(content.collect_count || 0);
      const playCount = Number(content.play_count || 0);
      const totalInteractions = commentCount + danmakuCount + likeCount + shareCount + collectCount;
      const interactionRate = playCount > 0 ? Number(((totalInteractions / playCount) * 100).toFixed(4)) : 0;

      let interactionTag = 0;
      if (totalInteractions >= 5000 || interactionRate >= 5) {
        interactionTag = 1;
      } else if (totalInteractions < 100 && playCount >= 1000) {
        interactionTag = 2;
      }

      const fullRow = {
        contentId: content.id,
        contentTitle: content.content_title,
        contentCategory: content.content_category,
        isHot: content.is_hot,
        commentCount,
        danmakuCount,
        likeCount,
        shareCount,
        collectCount,
        playCount,
        totalInteractions,
        interactionRate,
        interactionTag,
        statBatch,
        statDate: endDate,
        createdAt: content.created_at,
      };

      if (fields) {
        const filtered = {};
        for (const f of fields) {
          if (fullRow[f] !== undefined) filtered[f] = fullRow[f];
        }
        exportData.push(filtered);
      } else {
        exportData.push(fullRow);
      }
    }

    if (sortBy && exportData.length > 0 && exportData[0][sortBy] !== undefined) {
      exportData.sort((a, b) => {
        const va = a[sortBy];
        const vb = b[sortBy];
        if (typeof va === 'number' && typeof vb === 'number') {
          return sortOrder === 'ASC' ? va - vb : vb - va;
        }
        return sortOrder === 'ASC' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
      });
    }

    return {
      exportData,
      statBatch,
      total: exportData.length,
      dateRange: { start: startDate, end: endDate },
      exportedFields: fields || Object.keys(exportData[0] || {}),
    };
  }

  async batchScreenLowInteraction(query) {
    const { contentCategory, startDate, endDate, threshold } = query;

    if (!contentCategory || !startDate || !endDate) {
      throw new BadRequestError('请完善内容品类和统计时段');
    }

    const thresholdValue = threshold ? Number(threshold) : 100;
    const playThreshold = thresholdValue * 5;

    const contents = await Content.findAll({
      where: {
        content_category: Number(contentCategory),
        play_count: { [Op.gte]: playThreshold },
      },
      attributes: ['id', 'content_title', 'content_category', 'is_hot', 'play_count', 'like_count', 'share_count', 'collect_count', 'comment_count', 'danmaku_count'],
    });

    if (contents.length === 0) {
      return {
        lowInteractionContents: [],
        total: 0,
        threshold: thresholdValue,
        playThreshold,
      };
    }

    const contentIds = contents.map((c) => c.id);

    const commentCounts = await Comment.findAll({
      attributes: ['content_id', [sequelize.fn('COUNT', '*'), 'count']],
      where: {
        content_id: { [Op.in]: contentIds },
        created_at: { [Op.between]: [new Date(startDate), new Date(endDate)] },
        comment_status: { [Op.in]: [1, 2] },
      },
      group: ['content_id'],
      raw: true,
    });

    const danmakuCounts = await Danmaku.findAll({
      attributes: ['content_id', [sequelize.fn('COUNT', '*'), 'count']],
      where: {
        content_id: { [Op.in]: contentIds },
        created_at: { [Op.between]: [new Date(startDate), new Date(endDate)] },
        danmaku_status: { [Op.in]: [1, 2] },
      },
      group: ['content_id'],
      raw: true,
    });

    const commentCountMap = {};
    for (const item of commentCounts) {
      commentCountMap[item.content_id] = Number(item.count);
    }
    const danmakuCountMap = {};
    for (const item of danmakuCounts) {
      danmakuCountMap[item.content_id] = Number(item.count);
    }

    const lowInteractionContents = [];
    const statBatch = generateBatchNo('LOW');

    for (const content of contents) {
      const commentCount = commentCountMap[content.id] || 0;
      const danmakuCount = danmakuCountMap[content.id] || 0;
      const likeCount = Number(content.like_count || 0);
      const shareCount = Number(content.share_count || 0);
      const collectCount = Number(content.collect_count || 0);
      const playCount = Number(content.play_count || 0);
      const totalInteractions = commentCount + danmakuCount + likeCount + shareCount + collectCount;

      if (totalInteractions < thresholdValue && playCount >= playThreshold) {
        lowInteractionContents.push({
          contentId: content.id,
          contentTitle: content.content_title,
          contentCategory: content.content_category,
          isHot: content.is_hot,
          commentCount,
          danmakuCount,
          likeCount,
          shareCount,
          collectCount,
          playCount,
          totalInteractions,
          interactionRate: playCount > 0 ? Number(((totalInteractions / playCount) * 100).toFixed(4)) : 0,
          interactionTag: 2,
        });

        try {
          await ContentInteractionStat.upsert({
            content_id: content.id,
            stat_date: endDate,
            comment_count: commentCount,
            danmaku_count: danmakuCount,
            like_count: likeCount,
            share_count: shareCount,
            collect_count: collectCount,
            play_count: playCount,
            total_interactions: totalInteractions,
            interaction_rate: playCount > 0 ? Number(((totalInteractions / playCount) * 100).toFixed(4)) : 0,
            interaction_tag: 2,
            is_anomaly: 0,
            anomaly_types: [],
            stat_batch: statBatch,
            remark: '低互动批量筛查标记',
          });
        } catch (err) {
          // ignore
        }
      }
    }

    return {
      lowInteractionContents,
      total: lowInteractionContents.length,
      threshold: thresholdValue,
      playThreshold,
      statBatch,
    };
  }

  async traceInteractionStats(query) {
    const { statBatch, contentId, startDate, endDate } = query;
    const findings = [];
    const traceLogs = [];

    if (!statBatch && !contentId && !startDate) {
      throw new BadRequestError('请提供statBatch、contentId或统计时段');
    }

    const statWhere = {};
    if (statBatch) statWhere.stat_batch = statBatch;
    if (contentId) statWhere.content_id = Number(contentId);
    if (startDate && endDate) {
      statWhere.stat_date = { [Op.between]: [startDate, endDate] };
    }

    const stats = await ContentInteractionStat.findAll({
      where: statWhere,
      order: [['content_id', 'ASC'], ['stat_date', 'ASC']],
    });

    if (statBatch) {
      const groupedByContentDate = {};
      for (const stat of stats) {
        const key = `${stat.content_id}_${stat.stat_date}`;
        if (!groupedByContentDate[key]) groupedByContentDate[key] = [];
        groupedByContentDate[key].push(stat);
      }

      for (const [key, group] of Object.entries(groupedByContentDate)) {
        if (group.length > 1) {
          const [cId, sDate] = key.split('_');
          findings.push({
            type: 'DUPLICATE_STAT',
            severity: 2,
            contentId: Number(cId),
            statDate: sDate,
            description: `内容${cId}在${sDate}存在${group.length}条重复统计记录`,
            duplicateCount: group.length,
          });
          traceLogs.push({
            content_id: Number(cId),
            stat_batch: statBatch,
            stat_date: sDate,
            trace_type: 'DUPLICATE_STAT',
            trace_desc: `内容${cId}在${sDate}存在${group.length}条重复统计记录`,
            before_data: { count: group.length },
            severity: 2,
            resolved: 0,
          });
        }
      }
    }

    const statsByContent = {};
    for (const stat of stats) {
      if (!statsByContent[stat.content_id]) statsByContent[stat.content_id] = [];
      statsByContent[stat.content_id].push(stat);
    }

    for (const [cId, contentStats] of Object.entries(statsByContent)) {
      contentStats.sort((a, b) => new Date(a.stat_date) - new Date(b.stat_date));

      for (let i = 1; i < contentStats.length; i++) {
        const prev = contentStats[i - 1];
        const curr = contentStats[i];

        const prevTotal = Number(prev.total_interactions || 0);
        const currTotal = Number(curr.total_interactions || 0);

        if (prevTotal > 0) {
          const change = Math.abs(currTotal - prevTotal) / prevTotal * 100;
          if (change > 500) {
            findings.push({
              type: 'ABNORMAL_FLUCTUATION',
              severity: 3,
              contentId: Number(cId),
              statDate: curr.stat_date,
              description: `内容${cId}在${curr.stat_date}互动量波动${change.toFixed(2)}%，超过500%阈值`,
              prevTotal,
              currTotal,
              changePercent: Number(change.toFixed(2)),
            });
            traceLogs.push({
              content_id: Number(cId),
              stat_batch: curr.stat_batch || statBatch || null,
              stat_date: curr.stat_date,
              trace_type: 'ABNORMAL_FLUCTUATION',
              trace_desc: `互动量从${prevTotal}变为${currTotal}，波动${change.toFixed(2)}%`,
              before_data: { total_interactions: prevTotal },
              after_data: { total_interactions: currTotal },
              severity: 3,
              resolved: 0,
            });
          }
        }

        const fields = ['comment_count', 'danmaku_count', 'like_count', 'share_count', 'collect_count'];
        let allSameDelta = true;
        let delta = null;
        for (const f of fields) {
          const d = Number(curr[f] || 0) - Number(prev[f] || 0);
          if (delta === null) {
            delta = d;
          } else if (d !== delta) {
            allSameDelta = false;
            break;
          }
        }
        if (allSameDelta && delta !== null && delta > 0 && delta % 10 === 0) {
          findings.push({
            type: 'FAKE_INTERACTION',
            severity: 3,
            contentId: Number(cId),
            statDate: curr.stat_date,
            description: `内容${cId}所有互动类型均增加${delta}，疑似刷量`,
            delta,
          });
          traceLogs.push({
            content_id: Number(cId),
            stat_batch: curr.stat_batch || statBatch || null,
            stat_date: curr.stat_date,
            trace_type: 'FAKE_INTERACTION',
            trace_desc: `所有互动类型均增加${delta}，疑似刷量行为`,
            before_data: {
              comment_count: prev.comment_count,
              danmaku_count: prev.danmaku_count,
              like_count: prev.like_count,
              share_count: prev.share_count,
              collect_count: prev.collect_count,
            },
            after_data: {
              comment_count: curr.comment_count,
              danmaku_count: curr.danmaku_count,
              like_count: curr.like_count,
              share_count: curr.share_count,
              collect_count: curr.collect_count,
            },
            severity: 3,
            resolved: 0,
          });
        }
      }
    }

    if (contentId) {
      const content = await Content.findByPk(Number(contentId));
      if (content) {
        const contentStats = statsByContent[contentId] || [];
        const sumComment = contentStats.reduce((s, x) => s + Number(x.comment_count || 0), 0);
        const sumDanmaku = contentStats.reduce((s, x) => s + Number(x.danmaku_count || 0), 0);
        const contentComment = Number(content.comment_count || 0);
        const contentDanmaku = Number(content.danmaku_count || 0);

        if (Math.abs(sumComment - contentComment) > 100) {
          findings.push({
            type: 'INCONSISTENT_DATA',
            severity: 2,
            contentId: Number(contentId),
            description: `内容${contentId}评论数据不一致：统计表累计${sumComment}，内容表${contentComment}`,
            statSum: sumComment,
            contentValue: contentComment,
          });
          traceLogs.push({
            content_id: Number(contentId),
            stat_batch: statBatch || null,
            stat_date: endDate || null,
            trace_type: 'INCONSISTENT_DATA',
            trace_desc: `评论数据不一致：统计表累计${sumComment}，内容表${contentComment}`,
            before_data: { stat_sum: sumComment },
            after_data: { content_value: contentComment },
            severity: 2,
            resolved: 0,
          });
        }

        if (Math.abs(sumDanmaku - contentDanmaku) > 100) {
          findings.push({
            type: 'INCONSISTENT_DATA',
            severity: 2,
            contentId: Number(contentId),
            description: `内容${contentId}弹幕数据不一致：统计表累计${sumDanmaku}，内容表${contentDanmaku}`,
            statSum: sumDanmaku,
            contentValue: contentDanmaku,
          });
          traceLogs.push({
            content_id: Number(contentId),
            stat_batch: statBatch || null,
            stat_date: endDate || null,
            trace_type: 'INCONSISTENT_DATA',
            trace_desc: `弹幕数据不一致：统计表累计${sumDanmaku}，内容表${contentDanmaku}`,
            before_data: { stat_sum: sumDanmaku },
            after_data: { content_value: contentDanmaku },
            severity: 2,
            resolved: 0,
          });
        }
      }
    }

    if (traceLogs.length > 0) {
      try {
        await InteractionStatTraceLog.bulkCreate(traceLogs);
      } catch (err) {
        // ignore
      }
    }

    return {
      findings,
      totalFindings: findings.length,
      bySeverity: {
        high: findings.filter((f) => f.severity === 3).length,
        medium: findings.filter((f) => f.severity === 2).length,
        low: findings.filter((f) => f.severity === 1).length,
      },
    };
  }

  async checkDuplicateStat(statBatch, contentId, statDate) {
    if (!statBatch || !contentId || !statDate) {
      throw new BadRequestError('请提供statBatch、contentId和statDate');
    }

    const count = await ContentInteractionStat.count({
      where: {
        stat_batch: statBatch,
        content_id: Number(contentId),
        stat_date: statDate,
      },
    });

    const duplicates = await ContentInteractionStat.findAll({
      where: {
        stat_batch: statBatch,
        content_id: Number(contentId),
        stat_date: statDate,
      },
      order: [['created_at', 'ASC']],
    });

    return {
      isDuplicate: count > 1,
      duplicateCount: count,
      duplicates: duplicates.map((d) => ({
        id: d.id,
        statBatch: d.stat_batch,
        contentId: d.content_id,
        statDate: d.stat_date,
        totalInteractions: d.total_interactions,
        createdAt: d.created_at,
      })),
    };
  }

  async validateInteractionConsistency(contentId, statDate) {
    if (!contentId || !statDate) {
      throw new BadRequestError('请提供contentId和statDate');
    }

    const content = await Content.findByPk(Number(contentId));
    if (!content) {
      throw new NotFoundError('内容不存在');
    }

    const statWhere = {
      content_id: Number(contentId),
    };
    if (statDate) {
      statWhere.stat_date = { [Op.lte]: statDate };
    }

    const stats = await ContentInteractionStat.findAll({
      where: statWhere,
    });

    const sumComment = stats.reduce((s, x) => s + Number(x.comment_count || 0), 0);
    const sumDanmaku = stats.reduce((s, x) => s + Number(x.danmaku_count || 0), 0);
    const sumLike = stats.reduce((s, x) => s + Number(x.like_count || 0), 0);
    const sumShare = stats.reduce((s, x) => s + Number(x.share_count || 0), 0);
    const sumCollect = stats.reduce((s, x) => s + Number(x.collect_count || 0), 0);

    const contentComment = Number(content.comment_count || 0);
    const contentDanmaku = Number(content.danmaku_count || 0);
    const contentLike = Number(content.like_count || 0);
    const contentShare = Number(content.share_count || 0);
    const contentCollect = Number(content.collect_count || 0);

    const inconsistencies = [];
    const threshold = 100;

    if (Math.abs(sumComment - contentComment) > threshold) {
      inconsistencies.push({
        field: 'comment_count',
        statSum: sumComment,
        contentValue: contentComment,
        diff: Math.abs(sumComment - contentComment),
      });
    }
    if (Math.abs(sumDanmaku - contentDanmaku) > threshold) {
      inconsistencies.push({
        field: 'danmaku_count',
        statSum: sumDanmaku,
        contentValue: contentDanmaku,
        diff: Math.abs(sumDanmaku - contentDanmaku),
      });
    }
    if (Math.abs(sumLike - contentLike) > threshold) {
      inconsistencies.push({
        field: 'like_count',
        statSum: sumLike,
        contentValue: contentLike,
        diff: Math.abs(sumLike - contentLike),
      });
    }
    if (Math.abs(sumShare - contentShare) > threshold) {
      inconsistencies.push({
        field: 'share_count',
        statSum: sumShare,
        contentValue: contentShare,
        diff: Math.abs(sumShare - contentShare),
      });
    }
    if (Math.abs(sumCollect - contentCollect) > threshold) {
      inconsistencies.push({
        field: 'collect_count',
        statSum: sumCollect,
        contentValue: contentCollect,
        diff: Math.abs(sumCollect - contentCollect),
      });
    }

    return {
      contentId: Number(contentId),
      statDate,
      consistent: inconsistencies.length === 0,
      inconsistencies,
      statSummary: {
        commentCount: sumComment,
        danmakuCount: sumDanmaku,
        likeCount: sumLike,
        shareCount: sumShare,
        collectCount: sumCollect,
      },
      contentSummary: {
        commentCount: contentComment,
        danmakuCount: contentDanmaku,
        likeCount: contentLike,
        shareCount: contentShare,
        collectCount: contentCollect,
      },
    };
  }
}

module.exports = new InteractionAnalyticsService();
