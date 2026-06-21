const { Danmaku, Content, DanmakuManageLog, EndUser } = require('../models');
const { Op } = require('../config/database');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch, generateBatchNo } = require('../utils/helpers');

const VALID_OPERATION_TYPES = ['APPROVE', 'TEMP_BLOCK', 'PERMA_BAN', 'UNBLOCK', 'DELETE'];
const BATCH_OPERATION_TYPES = ['BATCH_APPROVE', 'BATCH_BLOCK', 'BATCH_CLEAN', 'BATCH_ARCHIVE'];
const ALL_OPERATION_TYPES = [...VALID_OPERATION_TYPES, ...BATCH_OPERATION_TYPES];

const OPERATION_DESC_MAP = {
  APPROVE: '审核通过',
  TEMP_BLOCK: '临时屏蔽',
  PERMA_BAN: '永久封禁',
  UNBLOCK: '恢复展示',
  DELETE: '删除弹幕',
  BATCH_APPROVE: '批量审核通过',
  BATCH_BLOCK: '批量屏蔽',
  BATCH_CLEAN: '批量清理',
  BATCH_ARCHIVE: '批量归档',
};

class DanmakuManageService {
  async getDanmakuManageList(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query);

    const where = {};
    const contentWhere = {};
    const endUserWhere = {};
    let useContentInclude = false;
    let useEndUserInclude = false;
    let filterCount = 0;

    if (query.contentId !== undefined && query.contentId !== null && query.contentId !== '') {
      where.content_id = Number(query.contentId);
      filterCount++;
    }

    if (query.startDate && query.endDate) {
      where.created_at = {
        [Op.between]: [new Date(query.startDate), new Date(query.endDate)],
      };
      filterCount++;
    }

    if (query.userId !== undefined && query.userId !== null && query.userId !== '') {
      where.user_id = Number(query.userId);
      filterCount++;
    }

    if (query.violationLevel !== undefined && query.violationLevel !== null && query.violationLevel !== '') {
      where.violation_level = Number(query.violationLevel);
      filterCount++;
    }

    if (query.isHighRisk !== undefined && query.isHighRisk !== null && query.isHighRisk !== '') {
      where.is_high_risk = Number(query.isHighRisk);
      filterCount++;
    }

    if (query.danmakuStatus !== undefined && query.danmakuStatus !== null && query.danmakuStatus !== '') {
      where.danmaku_status = Number(query.danmakuStatus);
      filterCount++;
    }

    if (query.playTimeStart !== undefined && query.playTimeStart !== null && query.playTimeStart !== '') {
      where.play_time = where.play_time || {};
      where.play_time[Op.gte] = Number(query.playTimeStart);
      filterCount++;
    }

    if (query.playTimeEnd !== undefined && query.playTimeEnd !== null && query.playTimeEnd !== '') {
      where.play_time = where.play_time || {};
      where.play_time[Op.lte] = Number(query.playTimeEnd);
      filterCount++;
    }

    if (query.isRealTime !== undefined && query.isRealTime !== null && query.isRealTime !== '') {
      where.is_real_time = Number(query.isRealTime);
      filterCount++;
    }

    if (query.isArchived !== undefined && query.isArchived !== null && query.isArchived !== '') {
      where.is_archived = Number(query.isArchived);
      filterCount++;
    }

    if (query.isHotVideo !== undefined && query.isHotVideo !== null && query.isHotVideo !== '') {
      contentWhere.is_hot = Number(query.isHotVideo);
      useContentInclude = true;
      filterCount++;
    }

    if (query.violationType !== undefined && query.violationType !== null && query.violationType !== '') {
      where.violation_type = query.violationType;
      filterCount++;
    }

    if (query.keyword) {
      where.danmaku_content = { [Op.like]: `%${query.keyword}%` };
      filterCount++;
    }

    const include = [];

    include.push({
      model: Content,
      as: 'content',
      attributes: ['id', 'content_title', 'content_category', 'is_hot'],
      where: Object.keys(contentWhere).length > 0 ? contentWhere : undefined,
      required: Object.keys(contentWhere).length > 0,
    });

    include.push({
      model: EndUser,
      as: 'user',
      attributes: ['id', 'uid', 'nickname', 'member_level', 'activity_level', 'account_status'],
      where: Object.keys(endUserWhere).length > 0 ? endUserWhere : undefined,
      required: Object.keys(endUserWhere).length > 0,
    });

    include.push({
      model: DanmakuManageLog,
      as: 'manageLogs',
      attributes: ['id', 'operation_type', 'operation_desc', 'operator_name', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 1,
      separate: true,
    });

    const { count, rows } = await Danmaku.findAndCountAll({
      where,
      include,
      offset,
      limit: pageSize,
      order,
      distinct: true,
    });

    if (filterCount >= 6 && rows.length === 0) {
      throw new BadRequestError('筛选条件超限，请缩小查询范围');
    }

    return {
      list: rows.map((d) => {
        const lastLog = d.manageLogs && d.manageLogs.length > 0 ? d.manageLogs[0] : null;
        return {
          id: d.id,
          contentId: d.content_id,
          userId: d.user_id,
          danmakuContent: d.danmaku_content,
          playTime: d.play_time,
          danmakuType: d.danmaku_type,
          fontSize: d.font_size,
          danmakuColor: d.danmaku_color,
          danmakuStatus: d.danmaku_status,
          isHighRisk: d.is_high_risk,
          violationLevel: d.violation_level,
          violationType: d.violation_type,
          isArchived: d.is_archived,
          reportCount: d.report_count,
          likeCount: d.like_count,
          isRealTime: d.is_real_time,
          ipAddress: d.ip_address,
          source: d.source,
          createdAt: d.created_at,
          contentInfo: d.content ? {
            id: d.content.id,
            title: d.content.content_title,
            category: d.content.content_category,
            isHot: d.content.is_hot,
          } : null,
          userInfo: d.user ? {
            id: d.user.id,
            uid: d.user.uid,
            nickname: d.user.nickname,
            memberLevel: d.user.member_level,
            activityLevel: d.user.activity_level,
            accountStatus: d.user.account_status,
          } : null,
          lastOperation: lastLog ? {
            id: lastLog.id,
            operationType: lastLog.operation_type,
            operationDesc: lastLog.operation_desc,
            operatorName: lastLog.operator_name,
            createdAt: lastLog.created_at,
          } : null,
        };
      }),
      total: count,
      page,
      pageSize,
    };
  }

  async operateDanmaku(id, operationType, operatorId, operatorName, ip, remark) {
    if (!VALID_OPERATION_TYPES.includes(operationType)) {
      throw new BadRequestError(`不支持的操作类型: ${operationType}`);
    }

    const danmaku = await Danmaku.findByPk(id);
    if (!danmaku) throw new NotFoundError('弹幕不存在');

    const content = await Content.findByPk(danmaku.content_id);
    const isHotVideo = content && content.is_hot === 1 ? 1 : 0;

    const beforeData = {
      danmaku_status: danmaku.danmaku_status,
      is_high_risk: danmaku.is_high_risk,
      is_archived: danmaku.is_archived,
    };

    const updateData = {};

    switch (operationType) {
      case 'APPROVE':
        updateData.danmaku_status = 1;
        break;
      case 'TEMP_BLOCK':
        updateData.danmaku_status = 2;
        break;
      case 'PERMA_BAN':
        updateData.danmaku_status = 3;
        updateData.is_high_risk = 1;
        break;
      case 'UNBLOCK':
        updateData.danmaku_status = 1;
        break;
      case 'DELETE':
        updateData.danmaku_status = 4;
        break;
    }

    if (operationType === 'DELETE') {
      await Danmaku.destroy({ where: { id } });
    } else {
      await Danmaku.update(updateData, { where: { id } });
    }

    const afterData = { ...beforeData, ...updateData };

    await DanmakuManageLog.create({
      danmaku_id: id,
      content_id: danmaku.content_id,
      user_id: danmaku.user_id,
      operation_type: operationType,
      operation_desc: OPERATION_DESC_MAP[operationType] || operationType,
      before_data: beforeData,
      after_data: afterData,
      operator_id: operatorId,
      operator_name: operatorName,
      is_hot_video: isHotVideo,
      ip_address: ip,
      remark: remark || null,
    });

    if ((operationType === 'TEMP_BLOCK' || operationType === 'PERMA_BAN') && danmaku.user_id) {
      const user = await EndUser.findByPk(danmaku.user_id);
      if (user && user.rawAttributes && user.rawAttributes.danmaku_violation_count) {
        await EndUser.increment('danmaku_violation_count', { where: { id: danmaku.user_id } });
      }
    }

    const updatedDanmaku = await Danmaku.findByPk(id, { paranoid: false });

    return {
      success: true,
      danmakuStatus: updatedDanmaku ? updatedDanmaku.danmaku_status : 4,
      isHighRisk: updatedDanmaku ? updatedDanmaku.is_high_risk : danmaku.is_high_risk,
    };
  }

  async batchOperateDanmakus(ids, operationType, operatorId, operatorName, ip, remark) {
    if (!BATCH_OPERATION_TYPES.includes(operationType)) {
      throw new BadRequestError(`不支持的批量操作类型: ${operationType}`);
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError('请选择要操作的弹幕');
    }

    const batchNo = generateBatchNo('DM');

    const actualOpType = operationType.replace('BATCH_', '');

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const successIds = [];
    const skippedIds = [];

    const danmakus = await Danmaku.findAll({
      where: { id: { [Op.in]: ids.map(Number) } },
      include: [{ model: Content, as: 'content', attributes: ['id', 'is_hot'] }],
    });

    for (const danmaku of danmakus) {
      try {
        let shouldSkip = false;
        let skipReason = '';

        const isHotVideo = danmaku.content && danmaku.content.is_hot === 1 ? 1 : 0;

        switch (actualOpType) {
          case 'APPROVE':
            if (danmaku.danmaku_status === 1) {
              shouldSkip = true;
              skipReason = '已审核通过';
            }
            break;
          case 'BLOCK':
            if (danmaku.danmaku_status === 2 || danmaku.danmaku_status === 3 || danmaku.danmaku_status === 4) {
              shouldSkip = true;
              skipReason = '已屏蔽或已删除';
            }
            break;
          case 'CLEAN':
            if (danmaku.danmaku_status === 4 || danmaku.is_archived === 1) {
              shouldSkip = true;
              skipReason = '已删除或已归档';
            }
            break;
          case 'ARCHIVE':
            if (danmaku.is_archived === 1) {
              shouldSkip = true;
              skipReason = '已归档';
            }
            break;
        }

        if (shouldSkip) {
          skippedCount++;
          skippedIds.push(danmaku.id);
          continue;
        }

        const beforeData = {
          danmaku_status: danmaku.danmaku_status,
          is_high_risk: danmaku.is_high_risk,
          is_archived: danmaku.is_archived,
        };

        const updateData = {};

        switch (actualOpType) {
          case 'APPROVE':
            updateData.danmaku_status = 1;
            break;
          case 'BLOCK':
            updateData.danmaku_status = 2;
            break;
          case 'CLEAN':
            updateData.danmaku_status = 4;
            break;
          case 'ARCHIVE':
            updateData.is_archived = 1;
            updateData.danmaku_status = 4;
            break;
        }

        await Danmaku.update(updateData, { where: { id: danmaku.id } });

        const afterData = { ...beforeData, ...updateData };

        await DanmakuManageLog.create({
          danmaku_id: danmaku.id,
          content_id: danmaku.content_id,
          user_id: danmaku.user_id,
          operation_type: operationType,
          operation_desc: OPERATION_DESC_MAP[operationType] || operationType,
          before_data: beforeData,
          after_data: afterData,
          operator_id: operatorId,
          operator_name: operatorName,
          operation_batch: batchNo,
          is_hot_video: isHotVideo,
          ip_address: ip,
          remark: remark || null,
        });

        if ((actualOpType === 'BLOCK' || actualOpType === 'CLEAN') && danmaku.user_id) {
          const user = await EndUser.findByPk(danmaku.user_id);
          if (user && user.rawAttributes && user.rawAttributes.danmaku_violation_count) {
            await EndUser.increment('danmaku_violation_count', { where: { id: danmaku.user_id } });
          }
        }

        successCount++;
        successIds.push(danmaku.id);
      } catch (err) {
        failedCount++;
      }
    }

    return {
      batchId: batchNo,
      total: ids.length,
      successCount,
      failedCount,
      skippedCount,
      successIds,
      skippedIds,
    };
  }

  async traceDanmaku(query) {
    const { danmakuId, contentId, userUid } = query;

    let danmakuIds = [];

    if (danmakuId) {
      const danmaku = await Danmaku.findByPk(Number(danmakuId), { paranoid: false });
      if (!danmaku) throw new NotFoundError('弹幕不存在');
      danmakuIds = [danmaku.id];
    } else if (contentId) {
      const danmakus = await Danmaku.findAll({
        where: { content_id: Number(contentId) },
        paranoid: false,
      });
      if (danmakus.length === 0) throw new NotFoundError('该视频下无弹幕');
      danmakuIds = danmakus.map((d) => d.id);
    } else if (userUid) {
      const user = await EndUser.findOne({ where: { uid: userUid } });
      if (!user) throw new NotFoundError('用户不存在');
      const danmakus = await Danmaku.findAll({
        where: { user_id: user.id },
        paranoid: false,
      });
      if (danmakus.length === 0) throw new NotFoundError('该用户无弹幕');
      danmakuIds = danmakus.map((d) => d.id);
    } else {
      throw new BadRequestError('请提供danmakuId、contentId或userUid');
    }

    const danmakus = await Danmaku.findAll({
      where: { id: { [Op.in]: danmakuIds } },
      paranoid: false,
      include: [
        { model: Content, as: 'content', attributes: ['id', 'content_title', 'content_category', 'is_hot'] },
        { model: EndUser, as: 'user', attributes: ['id', 'uid', 'nickname', 'member_level', 'account_status'] },
      ],
    });

    const allLogs = await DanmakuManageLog.findAll({
      where: { danmaku_id: { [Op.in]: danmakuIds } },
      order: [['created_at', 'ASC']],
    });

    const logMap = {};
    for (const log of allLogs) {
      if (!logMap[log.danmaku_id]) logMap[log.danmaku_id] = [];
      logMap[log.danmaku_id].push(log);
    }

    const duplicateOperations = [];
    const abnormalOperations = [];
    const misjudgedDanmakus = [];

    for (const [dId, logs] of Object.entries(logMap)) {
      for (let i = 0; i < logs.length; i++) {
        for (let j = i + 1; j < logs.length; j++) {
          const diff = (new Date(logs[j].created_at) - new Date(logs[i].created_at)) / 60000;
          if (diff <= 5 && diff > 0 && logs[i].operation_type === logs[j].operation_type) {
            duplicateOperations.push({
              danmakuId: Number(dId),
              operationType: logs[i].operation_type,
              firstTime: logs[i].created_at,
              secondTime: logs[j].created_at,
              intervalMinutes: Math.round(diff * 10) / 10,
            });
          }
        }
      }
    }

    for (const danmaku of danmakus) {
      const logs = logMap[danmaku.id] || [];

      for (const log of logs) {
        if ((log.operation_type === 'APPROVE' || log.operation_type === 'BATCH_APPROVE') && danmaku.danmaku_status === 2) {
          abnormalOperations.push({
            danmakuId: danmaku.id,
            operationType: log.operation_type,
            reason: '对已屏蔽弹幕执行审核通过操作',
            operationTime: log.created_at,
          });
        }
        if ((log.operation_type === 'UNBLOCK') && danmaku.danmaku_status === 3) {
          abnormalOperations.push({
            danmakuId: danmaku.id,
            operationType: log.operation_type,
            reason: '对永久封禁弹幕执行恢复操作',
            operationTime: log.created_at,
          });
        }
      }

      if (danmaku.violation_level >= 2 && danmaku.danmaku_status === 1) {
        misjudgedDanmakus.push({
          danmakuId: danmaku.id,
          violationLevel: danmaku.violation_level,
          danmakuStatus: danmaku.danmaku_status,
          reason: `违规等级${danmaku.violation_level}的弹幕仍在正常展示`,
        });
      }

      if (danmaku.violation_level === 0 && (danmaku.danmaku_status === 2 || danmaku.danmaku_status === 3)) {
        misjudgedDanmakus.push({
          danmakuId: danmaku.id,
          violationLevel: danmaku.violation_level,
          danmakuStatus: danmaku.danmaku_status,
          reason: '无违规记录的弹幕被屏蔽或封禁',
        });
      }
    }

    return {
      danmakus: danmakus.map((d) => ({
        id: d.id,
        contentId: d.content_id,
        userId: d.user_id,
        danmakuContent: d.danmaku_content,
        playTime: d.play_time,
        danmakuType: d.danmaku_type,
        danmakuStatus: d.danmaku_status,
        isHighRisk: d.is_high_risk,
        violationLevel: d.violation_level,
        violationType: d.violation_type,
        isArchived: d.is_archived,
        reportCount: d.report_count,
        likeCount: d.like_count,
        isRealTime: d.is_real_time,
        createdAt: d.created_at,
        contentInfo: d.content ? {
          id: d.content.id,
          title: d.content.content_title,
          category: d.content.content_category,
          isHot: d.content.is_hot,
        } : null,
        userInfo: d.user ? {
          id: d.user.id,
          uid: d.user.uid,
          nickname: d.user.nickname,
          memberLevel: d.user.member_level,
          accountStatus: d.user.account_status,
        } : null,
        timeline: (logMap[d.id] || []).map((l) => ({
          id: l.id,
          operationType: l.operation_type,
          operationDesc: l.operation_desc,
          operatorName: l.operator_name,
          isHotVideo: l.is_hot_video,
          operationBatch: l.operation_batch,
          createdAt: l.created_at,
        })),
      })),
      duplicateOperations,
      abnormalOperations,
      misjudgedDanmakus,
    };
  }

  async checkDuplicateOperation(danmakuId, operationType) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const lastOperation = await DanmakuManageLog.findOne({
      where: {
        danmaku_id: Number(danmakuId),
        operation_type: operationType,
        created_at: { [Op.gte]: fiveMinutesAgo },
      },
      order: [['created_at', 'DESC']],
    });

    return {
      isDuplicate: !!lastOperation,
      lastOperation: lastOperation ? {
        id: lastOperation.id,
        operationType: lastOperation.operation_type,
        operationDesc: lastOperation.operation_desc,
        operatorName: lastOperation.operator_name,
        createdAt: lastOperation.created_at,
      } : null,
    };
  }

  async validateOperation(danmakuId, operationType) {
    const danmaku = await Danmaku.findByPk(Number(danmakuId), { paranoid: false });
    if (!danmaku) throw new NotFoundError('弹幕不存在');

    const reasons = [];
    let valid = true;

    switch (operationType) {
      case 'APPROVE':
        if (danmaku.danmaku_status === 1) {
          valid = false;
          reasons.push('弹幕已审核通过');
        }
        if (danmaku.danmaku_status === 3) {
          valid = false;
          reasons.push('永久封禁弹幕不能直接审核通过，请先解封');
        }
        if (danmaku.danmaku_status === 4) {
          valid = false;
          reasons.push('已删除弹幕不能审核通过');
        }
        break;
      case 'TEMP_BLOCK':
        if (danmaku.danmaku_status === 2) {
          valid = false;
          reasons.push('弹幕已临时屏蔽');
        }
        if (danmaku.danmaku_status === 3) {
          valid = false;
          reasons.push('弹幕已永久封禁，无需临时屏蔽');
        }
        if (danmaku.danmaku_status === 4) {
          valid = false;
          reasons.push('弹幕已删除，无需屏蔽');
        }
        break;
      case 'PERMA_BAN':
        if (danmaku.danmaku_status === 3) {
          valid = false;
          reasons.push('弹幕已永久封禁');
        }
        if (danmaku.danmaku_status === 4) {
          valid = false;
          reasons.push('弹幕已删除，无需封禁');
        }
        break;
      case 'UNBLOCK':
        if (danmaku.danmaku_status === 1) {
          valid = false;
          reasons.push('弹幕正常展示，无需恢复');
        }
        if (danmaku.danmaku_status === 3) {
          valid = false;
          reasons.push('永久封禁弹幕不能直接恢复，请使用其他方式');
        }
        if (danmaku.danmaku_status === 4) {
          valid = false;
          reasons.push('已删除弹幕不能恢复');
        }
        break;
      case 'DELETE':
        if (danmaku.danmaku_status === 4) {
          valid = false;
          reasons.push('弹幕已删除');
        }
        break;
    }

    return { valid, reasons };
  }

  async archiveDanmakusByContent(contentId) {
    const content = await Content.findByPk(contentId);
    if (!content) throw new NotFoundError('视频内容不存在');

    const danmakus = await Danmaku.findAll({
      where: {
        content_id: Number(contentId),
        is_archived: 0,
      },
    });

    if (danmakus.length === 0) {
      return {
        total: 0,
        archived: 0,
        message: '无需归档的弹幕',
      };
    }

    const batchNo = generateBatchNo('DMA');
    let archivedCount = 0;

    for (const danmaku of danmakus) {
      try {
        const beforeData = {
          danmaku_status: danmaku.danmaku_status,
          is_archived: danmaku.is_archived,
        };

        const updateData = {
          is_archived: 1,
          danmaku_status: 4,
        };

        await Danmaku.update(updateData, { where: { id: danmaku.id } });

        const afterData = { ...beforeData, ...updateData };

        await DanmakuManageLog.create({
          danmaku_id: danmaku.id,
          content_id: danmaku.content_id,
          user_id: danmaku.user_id,
          operation_type: 'BATCH_ARCHIVE',
          operation_desc: '视频下架自动归档',
          before_data: beforeData,
          after_data: afterData,
          operation_batch: batchNo,
          is_hot_video: content.is_hot === 1 ? 1 : 0,
          remark: '视频下架自动归档弹幕',
        });

        archivedCount++;
      } catch (err) {
        // continue with next danmaku
      }
    }

    return {
      total: danmakus.length,
      archived: archivedCount,
      batchId: batchNo,
      message: `成功归档 ${archivedCount} 条弹幕`,
    };
  }
}

module.exports = new DanmakuManageService();
