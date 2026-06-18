const { CopyrightValidity, CopyrightValidityLog, CopyrightValidityTask, Copyright, Content } = require('../models');
const { Op } = require('../config/database');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch, generateRandomString, chunkArray } = require('../utils/helpers');
const copyrightService = require('./CopyrightService');

const VALIDITY_STATUS = {
  NORMAL: 1,
  WARNING: 2,
  EXPIRED: 3,
};

const VALIDITY_STATUS_LABEL = {
  1: '正常',
  2: '预警',
  3: '已过期',
};

const EVENT_TYPE = {
  SCAN: 'SCAN',
  WARNING: 'WARNING',
  EXPIRE: 'EXPIRE',
  HANDLE: 'HANDLE',
  RENEW: 'RENEW',
  REMOVE: 'REMOVE',
  ARCHIVE: 'ARCHIVE',
};

const EVENT_TYPE_LABEL = {
  SCAN: '全量扫描',
  WARNING: '预警推送',
  EXPIRE: '过期处理',
  HANDLE: '预警处理',
  RENEW: '续期操作',
  REMOVE: '下架操作',
  ARCHIVE: '归档操作',
};

const TASK_TYPE = {
  RENEW_WARNING: 'RENEW_WARNING',
  REMOVE: 'REMOVE',
  ARCHIVE: 'ARCHIVE',
};

const TASK_TYPE_LABEL = {
  RENEW_WARNING: '批量续期预警',
  REMOVE: '批量下架',
  ARCHIVE: '批量归档',
};

const TASK_STATUS = {
  PENDING: 0,
  RUNNING: 1,
  COMPLETED: 2,
  FAILED: 3,
  CANCELLED: 4,
};

const TASK_STATUS_LABEL = {
  0: '待执行',
  1: '执行中',
  2: '已完成',
  3: '已失败',
  4: '已取消',
};

const THRESHOLD_UNIT = {
  DAY: 1,
  WEEK: 2,
  MONTH: 3,
};

const THRESHOLD_UNIT_LABEL = {
  1: '天',
  2: '周',
  3: '月',
};

const UNIT_TO_DAYS = {
  1: 1,
  2: 7,
  3: 30,
};

const MAX_THRESHOLD = {
  1: 3650,
  2: 520,
  3: 120,
};

const EXPIRE_HANDLER_RULE_LABEL = {
  1: '自动下架内容',
  2: '自动下架+停止流量',
  3: '仅停止流量',
  4: '仅记录留存',
};

const RELATED_CONTENT_SCOPE_LABEL = {
  1: '全部关联内容',
  2: '仅已上架内容',
  3: '指定内容类型',
};

function generateBatchNo(prefix = 'BATCH') {
  const date = new Date();
  const y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}_${y}${M}${d}${h}${m}${s}${rand}`;
}

function getDaysDiff(endDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

function convertToDays(threshold, unit) {
  return threshold * (UNIT_TO_DAYS[unit] || 1);
}

function createLogData(config, copyright, eventType, params = {}) {
  const remainingDays = getDaysDiff(copyright.end_date);
  const validityStatus = params.validityStatus || _applyStatusClassification(remainingDays, config.threshold_days);
  return {
    config_id: config.id,
    copyright_id: copyright.id,
    copyright_code: copyright.copyright_code,
    validity_status: validityStatus,
    validity_status_label: VALIDITY_STATUS_LABEL[validityStatus],
    remaining_days: remainingDays,
    end_date: copyright.end_date,
    event_type: eventType,
    event_type_label: EVENT_TYPE_LABEL[eventType] || eventType,
    action_result: params.actionResult ?? 1,
    action_detail: params.actionDetail || null,
    push_status: params.pushStatus ?? 0,
    push_channels: params.pushChannels || [],
    operator_id: params.operatorId || null,
    operator_name: params.operatorName || null,
    batch_no: params.batchNo || null,
    exception_type: params.exceptionType || null,
    exception_detail: params.exceptionDetail || null,
    environment_mode: params.environmentMode || 'prod',
  };
}

function _applyStatusClassification(remainingDays, thresholdDays) {
  if (remainingDays <= 0) return VALIDITY_STATUS.EXPIRED;
  if (remainingDays <= thresholdDays) return VALIDITY_STATUS.WARNING;
  return VALIDITY_STATUS.NORMAL;
}

function mapConfig(config) {
  return {
    id: config.id,
    configName: config.config_name,
    enabled: config.enabled === 1,
    warningThreshold: config.warning_threshold,
    thresholdUnit: config.threshold_unit,
    thresholdUnitLabel: THRESHOLD_UNIT_LABEL[config.threshold_unit],
    thresholdDays: config.threshold_days,
    expireHandlerRule: config.expire_handler_rule,
    expireHandlerRuleLabel: EXPIRE_HANDLER_RULE_LABEL[config.expire_handler_rule],
    relatedContentScope: config.related_content_scope,
    relatedContentScopeLabel: RELATED_CONTENT_SCOPE_LABEL[config.related_content_scope],
    pushChannels: config.push_channels || [],
    receiverRoles: config.receiver_roles || [],
    remark: config.remark,
    version: config.version,
    lastScanAt: config.last_scan_at,
    scanCount: config.scan_count,
    createdAt: config.created_at,
    updatedAt: config.updated_at,
    createdBy: config.created_by,
    updatedBy: config.updated_by,
  };
}

function mapLog(log) {
  return {
    id: log.id,
    configId: log.config_id,
    copyrightId: log.copyright_id,
    copyrightCode: log.copyright_code,
    validityStatus: log.validity_status,
    validityStatusLabel: log.validity_status_label,
    remainingDays: log.remaining_days,
    endDate: log.end_date,
    eventType: log.event_type,
    eventTypeLabel: log.event_type_label,
    actionResult: log.action_result,
    actionDetail: log.action_detail,
    pushStatus: log.push_status,
    pushChannels: log.push_channels || [],
    operatorId: log.operator_id,
    operatorName: log.operator_name,
    batchNo: log.batch_no,
    exceptionType: log.exception_type,
    exceptionDetail: log.exception_detail,
    environmentMode: log.environment_mode,
    createdAt: log.created_at,
  };
}

function mapTask(task) {
  return {
    id: task.id,
    taskNo: task.task_no,
    taskType: task.task_type,
    taskTypeLabel: task.task_type_label,
    configId: task.config_id,
    environmentMode: task.environment_mode,
    totalCount: task.total_count,
    successCount: task.success_count,
    failedCount: task.failed_count,
    skippedCount: task.skipped_count,
    status: task.status,
    statusLabel: task.status_label || TASK_STATUS_LABEL[task.status],
    progress: Number(task.progress),
    taskParams: task.task_params,
    copyrightIds: task.copyright_ids || [],
    resultSummary: task.result_summary,
    remark: task.remark,
    operatorId: task.operator_id,
    operatorName: task.operator_name,
    startedAt: task.started_at,
    completedAt: task.completed_at,
    createdAt: task.created_at,
  };
}

class CopyrightValidityService {
  validateThresholdConfig(warningThreshold, thresholdUnit) {
    const threshold = Number(warningThreshold);
    const unit = Number(thresholdUnit);

    if (isNaN(threshold) || threshold <= 0) {
      throw new BadRequestError('预警阈值必须大于0');
    }

    if (![1, 2, 3].includes(unit)) {
      throw new BadRequestError('阈值单位不合法，仅支持天、周、月');
    }

    const maxLimit = MAX_THRESHOLD[unit];
    if (threshold > maxLimit) {
      throw new BadRequestError(`预警阈值超出上限，${THRESHOLD_UNIT_LABEL[unit]}单位最大允许${maxLimit}${THRESHOLD_UNIT_LABEL[unit]}`);
    }

    const thresholdDays = convertToDays(threshold, unit);

    return {
      warningThreshold: threshold,
      thresholdUnit: unit,
      thresholdDays,
      valid: true,
    };
  }

  applyStatusClassification(endDate, thresholdDays) {
    const remainingDays = getDaysDiff(endDate);
    const status = _applyStatusClassification(remainingDays, thresholdDays);
    return {
      status,
      statusLabel: VALIDITY_STATUS_LABEL[status],
      remainingDays,
      thresholdDays,
    };
  }

  async _pushWarningNotification(config, copyright, validityInfo, params = {}) {
    const pushChannels = config.push_channels || [];
    const receiverRoles = config.receiver_roles || [];
    const environmentMode = params.environmentMode || 'prod';

    if (pushChannels.length === 0 || receiverRoles.length === 0) {
      return {
        pushStatus: 0,
        pushChannels: pushChannels.map((c) => ({ channel: c, status: 0, remark: '缺少推送渠道或接收角色配置' })),
      };
    }

    const results = [];
    for (const channel of pushChannels) {
      if (environmentMode === 'test') {
        results.push({ channel, status: 1, remark: `[TEST] 模拟推送预警: ${copyright.copyright_name}剩余${validityInfo.remainingDays}天到期` });
      } else {
        results.push({ channel, status: 1, remark: `推送预警: ${copyright.copyright_name}剩余${validityInfo.remainingDays}天到期`, pushedAt: new Date() });
      }
    }

    const hasFailed = results.some((r) => r.status !== 1);

    return {
      pushStatus: hasFailed ? 2 : 1,
      pushChannels: results,
    };
  }

  async triggerFullScan(configId, operatorId, operatorName, params = {}) {
    const config = await CopyrightValidity.findByPk(configId);
    if (!config) throw new NotFoundError('有效期管控配置不存在');

    const environmentMode = params.environmentMode || 'prod';
    const batchNo = generateBatchNo('SCAN');

    if (config.enabled !== 1) {
      throw new BadRequestError('配置未启用，无法触发扫描');
    }

    const thresholdDays = config.threshold_days;
    const contentScope = config.related_content_scope;

    let copyrightWhere = {};
    if (contentScope === 2) {
      const boundContentCopyrightIds = await Content.findAll({
        where: { copyright_id: { [Op.ne]: null } },
        attributes: ['copyright_id'],
        group: ['copyright_id'],
      }).then((rows) => rows.map((r) => r.copyright_id));
      if (boundContentCopyrightIds.length > 0) {
        copyrightWhere.id = { [Op.in]: boundContentCopyrightIds };
      } else {
        copyrightWhere.id = { [Op.eq]: 0 };
      }
    }

    const copyrights = await Copyright.findAll({ where: copyrightWhere });
    const stats = {
      total: copyrights.length,
      normal: 0,
      warning: 0,
      expired: 0,
      warningsPushed: 0,
      contentsRemoved: 0,
      trafficStopped: 0,
    };

    const logCreates = [];
    const changedCopyrightIds = { warning: [], expired: [] };

    for (const copyright of copyrights) {
      const remainingDays = getDaysDiff(copyright.end_date);
      const validityStatus = _applyStatusClassification(remainingDays, thresholdDays);

      if (validityStatus === VALIDITY_STATUS.NORMAL) {
        stats.normal++;
      } else if (validityStatus === VALIDITY_STATUS.WARNING) {
        stats.warning++;
        changedCopyrightIds.warning.push(copyright.id);

        const validityInfo = { status: validityStatus, remainingDays };
        const pushResult = await this._pushWarningNotification(config, copyright, validityInfo, { environmentMode });
        if (pushResult.pushStatus === 1) stats.warningsPushed++;

        logCreates.push(createLogData(config, copyright, EVENT_TYPE.WARNING, {
          validityStatus,
          actionResult: 1,
          pushStatus: pushResult.pushStatus,
          pushChannels: pushResult.pushChannels,
          operatorId,
          operatorName,
          batchNo,
          environmentMode,
        }));
      } else if (validityStatus === VALIDITY_STATUS.EXPIRED) {
        stats.expired++;
        changedCopyrightIds.expired.push(copyright.id);

        const handlerResult = await this._executeExpireHandler(config, copyright, environmentMode);
        stats.contentsRemoved += handlerResult.contentsRemoved;
        stats.trafficStopped += handlerResult.trafficStopped;

        logCreates.push(createLogData(config, copyright, EVENT_TYPE.EXPIRE, {
          validityStatus,
          actionResult: handlerResult.success ? 1 : 0,
          actionDetail: handlerResult,
          operatorId,
          operatorName,
          batchNo,
          environmentMode,
        }));
      }
    }

    if (logCreates.length > 0 && environmentMode === 'prod') {
      const chunks = chunkArray(logCreates, 200);
      for (const chunk of chunks) {
        await CopyrightValidityLog.bulkCreate(chunk);
      }
    } else if (logCreates.length > 0 && environmentMode === 'test') {
    }

    if (environmentMode === 'prod') {
      await CopyrightValidity.update(
        {
          last_scan_at: new Date(),
          scan_count: (config.scan_count || 0) + 1,
          version: config.version + 1,
          updated_by: operatorId,
        },
        { where: { id: configId } }
      );

      for (const cid of changedCopyrightIds.warning) {
        try {
          await copyrightService.syncValidityToCopyright(cid, VALIDITY_STATUS.WARNING, operatorId);
        } catch (e) {}
      }
      for (const cid of changedCopyrightIds.expired) {
        try {
          await copyrightService.syncValidityToCopyright(cid, VALIDITY_STATUS.EXPIRED, operatorId);
        } catch (e) {}
      }
    }

    return {
      configId,
      batchNo,
      environmentMode,
      stats,
      processedCount: logCreates.length,
    };
  }

  async _executeExpireHandler(config, copyright, environmentMode = 'prod') {
    const handlerRule = config.expire_handler_rule;
    const result = {
      handlerRule,
      handlerRuleLabel: EXPIRE_HANDLER_RULE_LABEL[handlerRule],
      success: true,
      contentsRemoved: 0,
      trafficStopped: 0,
      archived: false,
      details: [],
    };

    const contentWhere = { copyright_id: copyright.id };
    if (config.related_content_scope === 2) {
      contentWhere.status = 1;
    }

    const contents = await Content.findAll({ where: contentWhere });

    if (handlerRule === 1 || handlerRule === 2) {
      if (contents.length > 0) {
        if (environmentMode === 'prod') {
          await Content.update({ status: 0 }, { where: { id: { [Op.in]: contents.map((c) => c.id) } } });
        }
        result.contentsRemoved = contents.length;
        result.details.push({ action: 'remove_content', count: contents.length, ids: contents.map((c) => c.id) });
      }
    }

    if (handlerRule === 2 || handlerRule === 3) {
      if (contents.length > 0) {
        if (environmentMode === 'prod') {
          await Content.update({ audit_status: 4 }, { where: { id: { [Op.in]: contents.map((c) => c.id) } } });
        }
        result.trafficStopped = contents.length;
        result.details.push({ action: 'stop_traffic', count: contents.length, ids: contents.map((c) => c.id) });
      }
    }

    if (handlerRule === 4) {
      result.archived = true;
      result.details.push({ action: 'record_only', remark: '仅记录留存，不执行操作' });
    }

    return result;
  }

  async changeValidityStatus(configId, copyrightId, targetStatus, operatorId, operatorName, params = {}) {
    const config = await CopyrightValidity.findByPk(configId);
    if (!config) throw new NotFoundError('有效期管控配置不存在');

    const copyright = await Copyright.findByPk(copyrightId);
    if (!copyright) throw new NotFoundError('版权信息不存在');

    const environmentMode = params.environmentMode || 'prod';
    const batchNo = params.batchNo || generateBatchNo('STATUS');
    const remainingDays = getDaysDiff(copyright.end_date);
    const validityInfo = this.applyStatusClassification(copyright.end_date, config.threshold_days);

    const result = {
      configId,
      copyrightId,
      copyrightCode: copyright.copyright_code,
      fromStatus: validityInfo.status,
      fromStatusLabel: validityInfo.statusLabel,
      toStatus: targetStatus,
      toStatusLabel: VALIDITY_STATUS_LABEL[targetStatus],
      remainingDays,
      thresholdDays: config.threshold_days,
      actions: [],
      pushResult: null,
      handlerResult: null,
      environmentMode,
      batchNo,
      success: true,
    };

    if (targetStatus === VALIDITY_STATUS.WARNING) {
      if (validityInfo.status === VALIDITY_STATUS.EXPIRED) {
        throw new BadRequestError('已过期版权无法转为预警状态，请先续期');
      }

      const pushResult = await this._pushWarningNotification(config, copyright, { ...validityInfo, status: VALIDITY_STATUS.WARNING }, { environmentMode });
      result.pushResult = pushResult;
      result.actions.push({ type: 'push_warning', result: pushResult.pushStatus === 1 ? 'success' : pushResult.pushStatus === 2 ? 'partial' : 'skipped' });

      if (environmentMode === 'prod') {
        await CopyrightValidityLog.create(createLogData(config, copyright, EVENT_TYPE.WARNING, {
          validityStatus: VALIDITY_STATUS.WARNING,
          actionResult: 1,
          pushStatus: pushResult.pushStatus,
          pushChannels: pushResult.pushChannels,
          operatorId,
          operatorName,
          batchNo,
          environmentMode,
        }));
        await copyrightService.syncValidityToCopyright(copyrightId, VALIDITY_STATUS.WARNING, operatorId);
      }
    } else if (targetStatus === VALIDITY_STATUS.EXPIRED) {
      const handlerResult = await this._executeExpireHandler(config, copyright, environmentMode);
      result.handlerResult = handlerResult;
      if (handlerResult.contentsRemoved > 0) result.actions.push({ type: 'remove_content', count: handlerResult.contentsRemoved });
      if (handlerResult.trafficStopped > 0) result.actions.push({ type: 'stop_traffic', count: handlerResult.trafficStopped });

      if (environmentMode === 'prod') {
        await CopyrightValidityLog.create(createLogData(config, copyright, EVENT_TYPE.EXPIRE, {
          validityStatus: VALIDITY_STATUS.EXPIRED,
          actionResult: handlerResult.success ? 1 : 0,
          actionDetail: handlerResult,
          operatorId,
          operatorName,
          batchNo,
          environmentMode,
        }));
        await copyrightService.syncValidityToCopyright(copyrightId, VALIDITY_STATUS.EXPIRED, operatorId);
      }
    } else if (targetStatus === VALIDITY_STATUS.NORMAL) {
      if (validityInfo.status === VALIDITY_STATUS.EXPIRED) {
        throw new BadRequestError('已过期版权无法直接转为正常状态，请先续期');
      }

      result.actions.push({ type: 'mark_normal', remark: '标记为正常状态，清除预警' });

      if (environmentMode === 'prod') {
        await CopyrightValidityLog.create(createLogData(config, copyright, EVENT_TYPE.HANDLE, {
          validityStatus: VALIDITY_STATUS.NORMAL,
          actionResult: 1,
          actionDetail: { action: 'mark_normal', remark: params.remark || '人工标记为正常' },
          operatorId,
          operatorName,
          batchNo,
          environmentMode,
        }));
        await copyrightService.syncValidityToCopyright(copyrightId, VALIDITY_STATUS.NORMAL, operatorId);
      }
    } else {
      throw new BadRequestError('不支持的目标状态');
    }

    return result;
  }

  async batchExecuteAction(params, operatorId, operatorName) {
    const { taskType, copyrightIds, configId, environmentMode = 'prod', remark } = params;

    if (!TASK_TYPE[taskType]) {
      throw new BadRequestError(`不支持的任务类型，支持: ${Object.keys(TASK_TYPE).join(',')}`);
    }
    if (!copyrightIds || copyrightIds.length === 0) {
      throw new BadRequestError('请指定要操作的版权ID列表');
    }

    const config = configId ? await CopyrightValidity.findByPk(configId) : await CopyrightValidity.findOne({ where: { enabled: 1 } });

    const taskNo = generateBatchNo('TASK');
    const task = await CopyrightValidityTask.create({
      task_no: taskNo,
      task_type: taskType,
      task_type_label: TASK_TYPE_LABEL[taskType],
      config_id: configId || null,
      environment_mode: environmentMode,
      total_count: copyrightIds.length,
      success_count: 0,
      failed_count: 0,
      skipped_count: 0,
      status: TASK_STATUS.RUNNING,
      status_label: TASK_STATUS_LABEL[TASK_STATUS.RUNNING],
      progress: 0,
      task_params: { taskType, configId, remark },
      copyright_ids: copyrightIds,
      remark: remark || null,
      operator_id: operatorId,
      operator_name: operatorName,
      started_at: new Date(),
    });

    const results = {
      success: [],
      failed: [],
      skipped: [],
    };

    let processed = 0;

    for (const copyrightId of copyrightIds) {
      try {
        const copyright = await Copyright.findByPk(copyrightId);
        if (!copyright) {
          results.skipped.push({ id: copyrightId, reason: '版权不存在' });
          processed++;
          continue;
        }

        if (taskType === TASK_TYPE.RENEW_WARNING) {
          if (!config) {
            throw new BadRequestError('没有可用的启用配置');
          }
          const checkResult = this.checkRenewalValid(config, copyright);
          if (!checkResult.valid) {
            results.skipped.push({ id: copyrightId, copyrightCode: copyright.copyright_code, reason: checkResult.reason });
          } else {
            await this.changeValidityStatus(config.id, copyrightId, VALIDITY_STATUS.WARNING, operatorId, operatorName, {
              environmentMode,
              batchNo: taskNo,
            });
            results.success.push({ id: copyrightId, copyrightCode: copyright.copyright_code });
          }
        } else if (taskType === TASK_TYPE.REMOVE) {
          if (!config) {
            throw new BadRequestError('没有可用的启用配置');
          }
          await this.changeValidityStatus(config.id, copyrightId, VALIDITY_STATUS.EXPIRED, operatorId, operatorName, {
            environmentMode,
            batchNo: taskNo,
          });
          results.success.push({ id: copyrightId, copyrightCode: copyright.copyright_code });
        } else if (taskType === TASK_TYPE.ARCHIVE) {
          const actionDetail = { action: 'archive', archivedAt: new Date(), remark: remark || '批量归档' };
          results.success.push({ id: copyrightId, copyrightCode: copyright.copyright_code, archivedAt: new Date() });

          if (environmentMode === 'prod' && config) {
            await CopyrightValidityLog.create(createLogData(config, copyright, EVENT_TYPE.ARCHIVE, {
              validityStatus: VALIDITY_STATUS.EXPIRED,
              actionResult: 1,
              actionDetail,
              operatorId,
              operatorName,
              batchNo: taskNo,
              environmentMode,
            }));
          }
        }
      } catch (err) {
        results.failed.push({ id: copyrightId, reason: err.message });
      }

      processed++;
      const progress = Number(((processed / copyrightIds.length) * 100).toFixed(2));
      if (environmentMode === 'prod') {
        await CopyrightValidityTask.update(
          {
            success_count: results.success.length,
            failed_count: results.failed.length,
            skipped_count: results.skipped.length,
            progress,
          },
          { where: { id: task.id } }
        );
      }
    }

    const hasFailed = results.failed.length > 0;
    const finalStatus = hasFailed && results.success.length === 0 ? TASK_STATUS.FAILED : TASK_STATUS.COMPLETED;

    if (environmentMode === 'prod') {
      await CopyrightValidityTask.update(
        {
          status: finalStatus,
          status_label: TASK_STATUS_LABEL[finalStatus],
          progress: 100,
          success_count: results.success.length,
          failed_count: results.failed.length,
          skipped_count: results.skipped.length,
          result_summary: {
            successCount: results.success.length,
            failedCount: results.failed.length,
            skippedCount: results.skipped.length,
            sampleSuccess: results.success.slice(0, 5),
            sampleFailed: results.failed.slice(0, 5),
            sampleSkipped: results.skipped.slice(0, 5),
          },
          completed_at: new Date(),
        },
        { where: { id: task.id } }
      );
    }

    const updatedTask = await CopyrightValidityTask.findByPk(task.id);
    return {
      ...mapTask(updatedTask || task),
      details: results,
    };
  }

  checkRenewalValid(config, copyright) {
    const remainingDays = getDaysDiff(copyright.end_date);
    const thresholdDays = config.threshold_days;

    if (remainingDays <= 0) {
      return { valid: false, reason: '版权已过期，无法发送续期预警，请先续期' };
    }
    if (remainingDays > thresholdDays) {
      return { valid: false, reason: `剩余${remainingDays}天，未达到${thresholdDays}天预警阈值` };
    }

    return {
      valid: true,
      remainingDays,
      thresholdDays,
      shouldRenew: remainingDays <= Math.ceil(thresholdDays / 2),
    };
  }

  async traceValidityFlow(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query, [['created_at', 'DESC']]);
    const where = {};

    if (query.configId) where.config_id = query.configId;
    if (query.copyrightId) where.copyright_id = query.copyrightId;
    if (query.copyrightCode) where.copyright_code = { [Op.like]: `%${query.copyrightCode}%` };
    if (query.validityStatus) where.validity_status = query.validityStatus;
    if (query.eventType) where.event_type = query.eventType;
    if (query.batchNo) where.batch_no = query.batchNo;
    if (query.operatorId) where.operator_id = query.operatorId;
    if (query.startTime && query.endTime) {
      where.created_at = { [Op.between]: [query.startTime, query.endTime] };
    } else if (query.startTime) {
      where.created_at = { [Op.gte]: query.startTime };
    } else if (query.endTime) {
      where.created_at = { [Op.lte]: query.endTime };
    }

    const { count, rows } = await CopyrightValidityLog.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order,
    });

    const copyrightIds = [...new Set(rows.map((r) => r.copyright_id))];
    const configIds = [...new Set(rows.map((r) => r.config_id))];

    const copyrightMap = {};
    if (copyrightIds.length > 0) {
      const crs = await Copyright.findAll({ where: { id: { [Op.in]: copyrightIds } }, attributes: ['id', 'copyright_code', 'copyright_name', 'end_date'] });
      for (const c of crs) copyrightMap[c.id] = { id: c.id, code: c.copyright_code, name: c.copyright_name, endDate: c.end_date };
    }

    const configMap = {};
    if (configIds.length > 0) {
      const cfs = await CopyrightValidity.findAll({ where: { id: { [Op.in]: configIds } }, attributes: ['id', 'config_name', 'threshold_days'] });
      for (const c of cfs) configMap[c.id] = { id: c.id, configName: c.config_name, thresholdDays: c.threshold_days };
    }

    const list = rows.map((log) => {
      const mapped = mapLog(log);
      mapped.copyrightName = copyrightMap[log.copyright_id]?.name;
      mapped.configName = configMap[log.config_id]?.config_name;
      return mapped;
    });

    return {
      list,
      total: count,
      page,
      pageSize,
      copyrightMap,
      configMap,
    };
  }

  async checkExecutionIntegrity(configId, params = {}) {
    const config = configId
      ? await CopyrightValidity.findByPk(configId)
      : await CopyrightValidity.findOne({ where: { enabled: 1 } });

    if (!config) throw new NotFoundError('未找到生效的有效期管控配置');

    const thresholdDays = config.threshold_days;
    const allCopyrights = await Copyright.findAll();

    const issues = [];
    const warnings = [];
    const summary = {
      totalCopyrights: allCopyrights.length,
      normalCount: 0,
      warningCount: 0,
      expiredCount: 0,
      missingWarnings: 0,
      missingExpireHandlers: 0,
      duplicateWarnings: 0,
      syncDelays: 0,
    };

    for (const copyright of allCopyrights) {
      const remainingDays = getDaysDiff(copyright.end_date);
      const expectedStatus = _applyStatusClassification(remainingDays, thresholdDays);

      if (expectedStatus === VALIDITY_STATUS.NORMAL) summary.normalCount++;
      else if (expectedStatus === VALIDITY_STATUS.WARNING) {
        summary.warningCount++;
        const recentLogs = await CopyrightValidityLog.findAll({
          where: {
            config_id: config.id,
            copyright_id: copyright.id,
            event_type: { [Op.in]: [EVENT_TYPE.WARNING, EVENT_TYPE.HANDLE] },
          },
          order: [['created_at', 'DESC']],
          limit: 10,
        });

        const hasRecentWarning = recentLogs.some((l) => {
          const logDate = new Date(l.created_at);
          const diffHours = (Date.now() - logDate.getTime()) / (1000 * 60 * 60);
          return diffHours <= 24 && l.event_type === EVENT_TYPE.WARNING && l.push_status === 1;
        });

        if (!hasRecentWarning) {
          summary.missingWarnings++;
          issues.push({
            type: 'MISSING_WARNING',
            copyrightId: copyright.id,
            copyrightCode: copyright.copyright_code,
            copyrightName: copyright.copyright_name,
            remainingDays,
            thresholdDays,
            severity: 'high',
            message: `剩余${remainingDays}天到期，已达预警阈值但24小时内未推送预警`,
          });
        }

        const warningLogs = recentLogs.filter((l) => l.event_type === EVENT_TYPE.WARNING);
        const uniqueDays = new Set(warningLogs.map((l) => new Date(l.created_at).toDateString()));
        if (warningLogs.length > uniqueDays.size * 2) {
          summary.duplicateWarnings++;
          warnings.push({
            type: 'DUPLICATE_WARNING',
            copyrightId: copyright.id,
            copyrightCode: copyright.copyright_code,
            warningCount: warningLogs.length,
            severity: 'low',
            message: `短期内重复推送${warningLogs.length}次预警，建议检查推送策略`,
          });
        }
      } else if (expectedStatus === VALIDITY_STATUS.EXPIRED) {
        summary.expiredCount++;
        const expireLogs = await CopyrightValidityLog.findAll({
          where: {
            config_id: config.id,
            copyright_id: copyright.id,
            event_type: EVENT_TYPE.EXPIRE,
          },
          order: [['created_at', 'DESC']],
          limit: 5,
        });

        if (expireLogs.length === 0) {
          summary.missingExpireHandlers++;
          issues.push({
            type: 'MISSING_EXPIRE_HANDLER',
            copyrightId: copyright.id,
            copyrightCode: copyright.copyright_code,
            copyrightName: copyright.copyright_name,
            expiredDays: Math.abs(remainingDays),
            severity: 'critical',
            message: `版权已过期${Math.abs(remainingDays)}天，未执行过期处理规则`,
          });
        } else {
          const boundContents = await Content.findAll({ where: { copyright_id: copyright.id, status: 1 } });
          if (config.expire_handler_rule === 1 || config.expire_handler_rule === 2) {
            if (boundContents.length > 0) {
              summary.missingExpireHandlers++;
              issues.push({
                type: 'CONTENT_NOT_REMOVED',
                copyrightId: copyright.id,
                copyrightCode: copyright.copyright_code,
                boundOnlineCount: boundContents.length,
                severity: 'critical',
                message: `过期版权仍有${boundContents.length}条内容处于上架状态，下架规则未生效`,
              });
            }
          }
        }

        if (copyright.compliance_status !== 3 && copyright.status !== 0) {
          summary.syncDelays++;
          warnings.push({
            type: 'SYNC_DELAY',
            copyrightId: copyright.id,
            copyrightCode: copyright.copyright_code,
            currentComplianceStatus: copyright.compliance_status,
            currentStatus: copyright.status,
            severity: 'medium',
            message: '版权表状态与有效期状态不同步',
          });
        }
      }
    }

    const totalIssues = issues.length;
    const totalWarnings = warnings.length;
    const maxScore = 100;
    let score = maxScore;
    score -= issues.filter((i) => i.severity === 'critical').length * 15;
    score -= issues.filter((i) => i.severity === 'high').length * 8;
    score -= issues.filter((i) => i.severity === 'medium').length * 4;
    score -= warnings.filter((w) => w.severity === 'medium').length * 2;
    score -= warnings.filter((w) => w.severity === 'low').length * 1;
    score = Math.max(0, Math.min(100, score));

    let grade = 'A';
    if (score < 60) grade = 'D';
    else if (score < 75) grade = 'C';
    else if (score < 90) grade = 'B';

    return {
      configId: config.id,
      configName: config.config_name,
      thresholdDays,
      checkedAt: new Date(),
      summary,
      issues,
      warnings,
      totalIssues,
      totalWarnings,
      integrityScore: score,
      grade,
      suggestions: [
        ...(summary.missingWarnings > 0 ? [`建议对${summary.missingWarnings}条预警缺失的版权立即补发预警通知`] : []),
        ...(summary.missingExpireHandlers > 0 ? [`建议对${summary.missingExpireHandlers}条过期版权立即执行下架/流量停止处理`] : []),
        ...(summary.syncDelays > 0 ? [`建议对${summary.syncDelays}条状态不同步的版权执行状态同步`] : []),
        ...(totalIssues === 0 && totalWarnings === 0 ? ['执行完整性校验通过，建议保持定期扫描'] : []),
      ],
    };
  }

  async getConfigList(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query);
    const search = parseSearch(query, ['config_name', 'remark']);

    const where = { ...search };
    if (query.enabled !== undefined && query.enabled !== null && query.enabled !== '') {
      where.enabled = query.enabled === 'true' || query.enabled === '1' ? 1 : 0;
    }
    if (query.thresholdUnit) where.threshold_unit = query.thresholdUnit;
    if (query.expireHandlerRule) where.expire_handler_rule = query.expireHandlerRule;
    if (query.relatedContentScope) where.related_content_scope = query.relatedContentScope;

    const { count, rows } = await CopyrightValidity.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order,
    });

    return {
      list: rows.map((r) => mapConfig(r)),
      total: count,
      page,
      pageSize,
    };
  }

  async getConfigDetail(id) {
    const config = await CopyrightValidity.findByPk(id);
    if (!config) throw new NotFoundError('有效期管控配置不存在');
    return mapConfig(config);
  }

  async createConfig(data, operatorId) {
    if (!data.configName) throw new BadRequestError('配置名称不能为空');

    const thresholdResult = this.validateThresholdConfig(data.warningThreshold ?? 30, data.thresholdUnit ?? 1);

    const exist = await CopyrightValidity.findOne({ where: { config_name: data.configName } });
    if (exist) throw new BadRequestError(`配置名称 ${data.configName} 已存在`);

    const config = await CopyrightValidity.create({
      config_name: data.configName,
      enabled: data.enabled === false ? 0 : 1,
      warning_threshold: thresholdResult.warningThreshold,
      threshold_unit: thresholdResult.thresholdUnit,
      threshold_days: thresholdResult.thresholdDays,
      expire_handler_rule: data.expireHandlerRule ?? 1,
      related_content_scope: data.relatedContentScope ?? 1,
      push_channels: data.pushChannels || [],
      receiver_roles: data.receiverRoles || [],
      remark: data.remark || null,
      version: 1,
      created_by: operatorId,
      updated_by: operatorId,
    });

    return this.getConfigDetail(config.id);
  }

  async updateConfig(id, data, operatorId) {
    const config = await CopyrightValidity.findByPk(id);
    if (!config) throw new NotFoundError('有效期管控配置不存在');

    const updateData = {};
    if (data.configName !== undefined) {
      const exist = await CopyrightValidity.findOne({ where: { config_name: data.configName, id: { [Op.ne]: id } } });
      if (exist) throw new BadRequestError(`配置名称 ${data.configName} 已存在`);
      updateData.config_name = data.configName;
    }
    if (data.enabled !== undefined) updateData.enabled = data.enabled ? 1 : 0;
    if (data.expireHandlerRule !== undefined) updateData.expire_handler_rule = data.expireHandlerRule;
    if (data.relatedContentScope !== undefined) updateData.related_content_scope = data.relatedContentScope;
    if (data.pushChannels !== undefined) updateData.push_channels = data.pushChannels;
    if (data.receiverRoles !== undefined) updateData.receiver_roles = data.receiverRoles;
    if (data.remark !== undefined) updateData.remark = data.remark;

    if (data.warningThreshold !== undefined || data.thresholdUnit !== undefined) {
      const threshold = data.warningThreshold !== undefined ? data.warningThreshold : config.warning_threshold;
      const unit = data.thresholdUnit !== undefined ? data.thresholdUnit : config.threshold_unit;
      const thresholdResult = this.validateThresholdConfig(threshold, unit);
      updateData.warning_threshold = thresholdResult.warningThreshold;
      updateData.threshold_unit = thresholdResult.thresholdUnit;
      updateData.threshold_days = thresholdResult.thresholdDays;
    }

    if (Object.keys(updateData).length === 0) {
      return this.getConfigDetail(id);
    }

    updateData.version = config.version + 1;
    updateData.updated_by = operatorId;

    await CopyrightValidity.update(updateData, { where: { id } });
    return this.getConfigDetail(id);
  }

  async deleteConfig(id) {
    const config = await CopyrightValidity.findByPk(id);
    if (!config) throw new NotFoundError('有效期管控配置不存在');

    const logCount = await CopyrightValidityLog.count({ where: { config_id: id } });
    if (logCount > 0) {
      throw new BadRequestError('该配置下存在操作日志，无法删除');
    }

    await CopyrightValidity.destroy({ where: { id } });
    return { success: true, id };
  }

  async getDashboardStats() {
    const enabledConfigs = await CopyrightValidity.findAll({ where: { enabled: 1 } });
    const totalConfigs = await CopyrightValidity.count();

    const now = new Date();
    const allCopyrights = await Copyright.findAll();

    const result = {
      configCount: {
        total: totalConfigs,
        enabled: enabledConfigs.length,
        disabled: totalConfigs - enabledConfigs.length,
      },
      copyrightCount: {
        total: allCopyrights.length,
        normal: 0,
        warning: 0,
        expired: 0,
        unknown: 0,
      },
      expiringIn7days: [],
      expiringIn30days: [],
      alreadyExpired: [],
      topThresholdConfig: null,
      recentScanSummary: {
        last24hScans: 0,
        last24hWarnings: 0,
        last24hExpireEvents: 0,
      },
    };

    for (const config of enabledConfigs) {
      const td = config.threshold_days;
      for (const copyright of allCopyrights) {
        const remainingDays = getDaysDiff(copyright.end_date);
        const status = _applyStatusClassification(remainingDays, td);

        if (status === VALIDITY_STATUS.NORMAL) {
          if (!result.topThresholdConfig) result.copyrightCount.normal++;
        } else if (status === VALIDITY_STATUS.WARNING) {
          if (!result.topThresholdConfig) result.copyrightCount.warning++;
          if (remainingDays > 0 && remainingDays <= 7) {
            if (!result.expiringIn7days.find((c) => c.id === copyright.id)) {
              result.expiringIn7days.push({
                id: copyright.id,
                code: copyright.copyright_code,
                name: copyright.copyright_name,
                remainingDays,
                endDate: copyright.end_date,
              });
            }
          }
          if (remainingDays > 0 && remainingDays <= 30) {
            if (!result.expiringIn30days.find((c) => c.id === copyright.id)) {
              result.expiringIn30days.push({
                id: copyright.id,
                code: copyright.copyright_code,
                name: copyright.copyright_name,
                remainingDays,
                endDate: copyright.end_date,
              });
            }
          }
        } else if (status === VALIDITY_STATUS.EXPIRED) {
          if (!result.topThresholdConfig) result.copyrightCount.expired++;
          if (!result.alreadyExpired.find((c) => c.id === copyright.id)) {
            result.alreadyExpired.push({
              id: copyright.id,
              code: copyright.copyright_code,
              name: copyright.copyright_name,
              expiredDays: Math.abs(remainingDays),
              endDate: copyright.end_date,
            });
          }
        }
      }
    }

    result.expiringIn7days.sort((a, b) => a.remainingDays - b.remainingDays);
    result.expiringIn30days.sort((a, b) => a.remainingDays - b.remainingDays);
    result.alreadyExpired.sort((a, b) => b.expiredDays - a.expiredDays);

    result.expiringIn7days = result.expiringIn7days.slice(0, 10);
    result.expiringIn30days = result.expiringIn30days.slice(0, 20);
    result.alreadyExpired = result.alreadyExpired.slice(0, 10);

    if (enabledConfigs.length > 0) {
      const configWithMaxThreshold = [...enabledConfigs].sort((a, b) => b.threshold_days - a.threshold_days)[0];
      result.topThresholdConfig = mapConfig(configWithMaxThreshold);
    }

    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    result.recentScanSummary.last24hScans = await CopyrightValidity.count({
      where: { last_scan_at: { [Op.gte]: yesterday } },
    });
    result.recentScanSummary.last24hWarnings = await CopyrightValidityLog.count({
      where: { created_at: { [Op.gte]: yesterday }, event_type: EVENT_TYPE.WARNING },
    });
    result.recentScanSummary.last24hExpireEvents = await CopyrightValidityLog.count({
      where: { created_at: { [Op.gte]: yesterday }, event_type: EVENT_TYPE.EXPIRE },
    });

    return result;
  }

  async getStatusHistory(copyrightId, query) {
    const { page, pageSize, offset } = parsePagination(query);

    const where = { copyright_id: copyrightId };
    if (query.configId) where.config_id = query.configId;
    if (query.eventType) where.event_type = query.eventType;

    const { count, rows } = await CopyrightValidityLog.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });

    return {
      list: rows.map((r) => mapLog(r)),
      total: count,
      page,
      pageSize,
    };
  }

  async handleWarning(warningLogId, handlerData, operatorId, operatorName) {
    const log = await CopyrightValidityLog.findByPk(warningLogId);
    if (!log) throw new NotFoundError('预警记录不存在');

    const config = await CopyrightValidity.findByPk(log.config_id);
    if (!config) throw new NotFoundError('关联配置不存在');

    const copyright = await Copyright.findByPk(log.copyright_id);
    if (!copyright) throw new NotFoundError('关联版权不存在');

    const environmentMode = handlerData.environmentMode || 'prod';
    const batchNo = generateBatchNo('HANDLE');

    if (log.event_type !== EVENT_TYPE.WARNING) {
      throw new BadRequestError('仅预警类型记录可处理');
    }

    const action = handlerData.action || 'mark_renewed';
    let resultAction = null;

    if (action === 'mark_renewed' && handlerData.newEndDate) {
      if (environmentMode === 'prod') {
        await copyright.update({
          end_date: handlerData.newEndDate,
          status: 1,
          compliance_status: 1,
          updated_by: operatorId,
        });
        await copyrightService.syncValidityToCopyright(copyright.id, VALIDITY_STATUS.NORMAL, operatorId);
      }
      resultAction = { type: 'mark_renewed', newEndDate: handlerData.newEndDate };
    } else if (action === 'mark_handled') {
      resultAction = { type: 'mark_handled', remark: handlerData.remark || '人工标记已处理' };
      if (environmentMode === 'prod') {
        await copyrightService.syncValidityToCopyright(copyright.id, VALIDITY_STATUS.NORMAL, operatorId);
      }
    } else if (action === 'escalate') {
      resultAction = { type: 'escalate', escalateTo: handlerData.escalateTo || 'supervisor', remark: handlerData.remark || '升级处理' };
    } else {
      throw new BadRequestError('不支持的处理动作');
    }

    if (environmentMode === 'prod') {
      await CopyrightValidityLog.create(createLogData(config, copyright, EVENT_TYPE.HANDLE, {
        validityStatus: VALIDITY_STATUS.NORMAL,
        actionResult: 1,
        actionDetail: {
          sourceLogId: warningLogId,
          action,
          ...resultAction,
          handlerData,
        },
        operatorId,
        operatorName,
        batchNo,
        environmentMode,
      }));
    }

    return {
      success: true,
      warningLogId,
      copyrightId: copyright.id,
      copyrightCode: copyright.copyright_code,
      action,
      actionDetail: resultAction,
      environmentMode,
      batchNo,
    };
  }

  async getTaskList(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query, [['created_at', 'DESC']]);
    const where = {};

    if (query.taskType) where.task_type = query.taskType;
    if (query.status !== undefined && query.status !== null && query.status !== '') where.status = query.status;
    if (query.environmentMode) where.environment_mode = query.environmentMode;
    if (query.configId) where.config_id = query.configId;
    if (query.operatorId) where.operator_id = query.operatorId;

    const { count, rows } = await CopyrightValidityTask.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order,
    });

    return {
      list: rows.map((r) => mapTask(r)),
      total: count,
      page,
      pageSize,
    };
  }

  async getTaskDetail(taskId) {
    const task = await CopyrightValidityTask.findByPk(taskId);
    if (!task) throw new NotFoundError('批量任务不存在');
    return mapTask(task);
  }

  async getTraceExceptions(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query, [['created_at', 'DESC']]);

    const where = {
      [Op.or]: [
        { exception_type: { [Op.ne]: null } },
        { exception_detail: { [Op.ne]: null } },
        { action_result: 0 },
        { push_status: 2 },
      ],
    };
    if (query.configId) where.config_id = query.configId;
    if (query.exceptionType) where.exception_type = query.exceptionType;
    if (query.startTime && query.endTime) {
      where.created_at = { [Op.between]: [query.startTime, query.endTime] };
    }

    const { count, rows } = await CopyrightValidityLog.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order,
    });

    const exceptionTypes = {};
    for (const r of rows) {
      const et = r.exception_type || (r.action_result === 0 ? 'ACTION_FAILED' : r.push_status === 2 ? 'PUSH_FAILED' : 'UNKNOWN');
      exceptionTypes[et] = (exceptionTypes[et] || 0) + 1;
    }

    return {
      list: rows.map((r) => ({
        ...mapLog(r),
        resolvedExceptionType: r.exception_type || (r.action_result === 0 ? 'ACTION_FAILED' : r.push_status === 2 ? 'PUSH_FAILED' : 'UNKNOWN'),
      })),
      total: count,
      page,
      pageSize,
      exceptionTypeStats: exceptionTypes,
    };
  }
}

module.exports = new CopyrightValidityService();
