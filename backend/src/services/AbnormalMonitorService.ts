import { AbnormalTransactionRepository, MonitorRuleRepository, MonitorAlertBatchRepository, MonitorTraceLogRepository, TransactionRepository, CustomerRepository, UserRepository } from '../repositories';
import { PaginatedResult, AlertTypeText, AlertRiskLevelText, AlertRiskLevelColor, AlertStatusText, InterceptStatusText, RuleTypeText, MonitorDimensionText, AlertActionText, AlertBatchTypeText, AlertBatchStatusText, TraceTypeText } from '../types';
import { throwBusinessError, throwNotFoundError, throwValidationError } from '../utils';
import { isValidId } from '../utils/validate';
import dayjs from 'dayjs';
import { Op } from 'sequelize';

export class AbnormalMonitorService {
  private alertRepo = new AbnormalTransactionRepository();
  private ruleRepo = new MonitorRuleRepository();
  private batchRepo = new MonitorAlertBatchRepository();
  private traceRepo = new MonitorTraceLogRepository();
  private transactionRepo = new TransactionRepository();
  private customerRepo = new CustomerRepository();
  private userRepo = new UserRepository();

  async realTimeMonitor(transactionId: string): Promise<any> {
    if (!isValidId(transactionId)) throwValidationError('无效的交易ID');

    const transaction = await this.transactionRepo.findById(transactionId);
    if (!transaction) throwNotFoundError('交易记录不存在');

    const enabledRules = await this.ruleRepo.findAllEnabled();
    if (enabledRules.length === 0) throwBusinessError('未配置监控规则，无法执行实时监控');

    const requiredRules = await this.ruleRepo.findRequiredRules();
    for (const reqRule of requiredRules) {
      if (!reqRule.is_enabled) throwBusinessError(`必选规则 ${reqRule.rule_name} 未启用，禁止执行监控`);
    }

    const triggeredRules: any[] = [];
    let maxRiskLevel = 1;
    let interceptRequired = false;
    let reviewRequired = false;
    let maxAlertAction = 1;

    const transactionTime = transaction.transaction_time ? dayjs(transaction.transaction_time) : dayjs();
    const transactionAmount = parseFloat(String(transaction.amount || 0));

    for (const rule of enabledRules) {
      const thresholdConfig = rule.threshold_config ? JSON.parse(rule.threshold_config) : {};
      let isTriggered = false;
      let actualValue: any = 0;
      let thresholdValue: any = 0;

      switch (rule.rule_type) {
        case 1: {
          const freqInfo: any = { count_1h: 0, count_24h: 0, count_7d: 0, count_30d: 0 };
          if (transaction.customer_id) {
            const recentTxns = await this.transactionRepo.findAndCountAll({
              customer_id: transaction.customer_id,
              start_time: dayjs().subtract(24, 'hour').format('YYYY-MM-DD'),
              pageSize: 1000
            });
            freqInfo.count_24h = recentTxns.rows?.length || 0;
          }
          actualValue = freqInfo.count_24h;
          thresholdValue = thresholdConfig.count_threshold_24h || 10;
          isTriggered = actualValue >= thresholdValue;
          break;
        }
        case 2: {
          const locInfo: any = { distance_from_usual: 0 };
          actualValue = locInfo.distance_from_usual;
          thresholdValue = thresholdConfig.distance_threshold_km || 500;
          isTriggered = actualValue >= thresholdValue;
          break;
        }
        case 3: {
          actualValue = transactionAmount;
          thresholdValue = thresholdConfig.amount_threshold_single || 50000;
          isTriggered = actualValue >= thresholdValue;
          break;
        }
        case 4: {
          const hour = transactionTime.hour();
          const nightStart = thresholdConfig.night_start_hour || 23;
          const nightEnd = thresholdConfig.night_end_hour || 6;
          actualValue = hour;
          thresholdValue = nightStart;
          if (nightStart > nightEnd) {
            isTriggered = hour >= nightStart || hour < nightEnd;
          } else {
            isTriggered = hour >= nightStart && hour < nightEnd;
          }
          break;
        }
      }

      if (isTriggered) {
        const riskMapping = rule.risk_level_mapping ? JSON.parse(rule.risk_level_mapping) : null;
        let ruleRiskLevel = 2;
        if (riskMapping) {
          if (riskMapping.high_conditions && riskMapping.high_conditions.length > 0) ruleRiskLevel = 4;
          else if (riskMapping.high_medium_conditions && riskMapping.high_medium_conditions.length > 0) ruleRiskLevel = 3;
        }

        if (ruleRiskLevel > maxRiskLevel) maxRiskLevel = ruleRiskLevel;

        if (rule.alert_action >= 2) interceptRequired = true;
        if (rule.alert_action >= 3) reviewRequired = true;
        if (rule.alert_action > maxAlertAction) maxAlertAction = rule.alert_action;

        triggeredRules.push({
          rule_id: rule.id,
          rule_code: rule.rule_code,
          rule_name: rule.rule_name,
          rule_type: rule.rule_type,
          dimension: rule.dimension,
          threshold_value: thresholdValue,
          actual_value: actualValue,
          trigger_time: new Date().toISOString()
        });

        await this.ruleRepo.incrementTriggerCount(rule.id);
      }
    }

    if (triggeredRules.length === 0) {
      return {
        is_abnormal: false,
        triggered_rules: [],
        risk_level: 0,
        risk_level_text: '无风险',
        intercept_required: false,
        review_required: false,
        alert_action: 0
      };
    }

    const alertNo = await this.alertRepo.generateAlertNo();
    const alertRecord = await this.alertRepo.create({
      alert_no: alertNo,
      transaction_id: transaction.id,
      transaction_no: transaction.transaction_no || transaction.id,
      customer_id: transaction.customer_id || '',
      customer_no: transaction.customer_no || '',
      customer_name: transaction.customer_name || '',
      account_id: transaction.account_id || '',
      account_no: transaction.account_no || '',
      trigger_rules: JSON.stringify(triggeredRules),
      alert_type: triggeredRules[0].rule_type,
      risk_level: maxRiskLevel,
      status: maxRiskLevel <= 2 ? 1 : (reviewRequired ? 2 : 0),
      transaction_amount: transactionAmount,
      transaction_time: transaction.transaction_time || new Date(),
      transaction_scene: transaction.scene || '',
      device_info: JSON.stringify({ device_id: transaction.device_id, ip_address: transaction.ip_address }),
      intercept_status: interceptRequired ? 1 : 0,
      alert_notify_status: 1,
      alert_notify_time: new Date(),
      org_id: transaction.org_id || '',
      previous_alerts_count: 0,
      is_false_positive: 0
    } as any);

    await this.traceRepo.create({
      alert_id: alertRecord.id,
      alert_no: alertNo,
      trace_type: 1,
      operation_detail: JSON.stringify({ triggered_rules: triggeredRules, risk_level: maxRiskLevel }),
      before_status: null,
      after_status: alertRecord.status,
      is_compliant: 1,
      remark: '实时监控规则触发'
    } as any);

    return {
      is_abnormal: true,
      alert_id: alertRecord.id,
      alert_no: alertNo,
      triggered_rules: triggeredRules,
      risk_level: maxRiskLevel,
      risk_level_text: AlertRiskLevelText[maxRiskLevel] || '未知',
      intercept_required: interceptRequired,
      review_required: reviewRequired,
      alert_action: maxAlertAction
    };
  }

  async getAlertList(params: any): Promise<PaginatedResult<any>> {
    const { page = 1, pageSize = 10, ...queryParams } = params;
    const where = this.alertRepo.buildQuery(queryParams);
    const result = await this.alertRepo.findAndCountAll({
      where,
      page,
      pageSize,
      include: [this.alertRepo.getCustomerInclude(), this.alertRepo.getHandlerInclude(), this.alertRepo.getOrganizationInclude()],
      order: [['created_at', 'DESC']]
    });

    return {
      ...result,
      rows: result.rows.map((item: any) => this.convertAlertToVO(item))
    };
  }

  async getAlertDetail(id: string): Promise<any> {
    const alert = await this.alertRepo.findById(id, {
      include: [this.alertRepo.getCustomerInclude(), this.alertRepo.getHandlerInclude(), this.alertRepo.getOrganizationInclude(), this.alertRepo.getBatchInclude()]
    });
    if (!alert) throwNotFoundError('异常交易记录不存在');

    const traceLogs = await this.traceRepo.findByAlertId(id);
    const vo = this.convertAlertToVO(alert);
    return { ...vo, trace_logs: traceLogs.map((t: any) => this.convertTraceToVO(t)) };
  }

  async handleAlert(id: string, handlerId: string, request: any): Promise<any> {
    const alert = await this.alertRepo.findById(id);
    if (!alert) throwNotFoundError('异常交易记录不存在');

    if (alert.status === 1 || alert.status === 4 || alert.status === 5) {
      throwBusinessError('当前状态不允许处理');
    }

    const complianceCheck = await this.checkCompliance(id, request);
    if (!complianceCheck.is_compliant) {
      if (complianceCheck.violations.includes('违规解除风控')) {
        await this.traceRepo.create({
          alert_id: id,
          alert_no: alert.alert_no,
          trace_type: 7,
          operator_id: handlerId,
          operation_detail: JSON.stringify({ request, violations: complianceCheck.violations }),
          before_status: alert.status,
          after_status: alert.status,
          is_compliant: 0,
          violation_type: '违规解除风控',
          remark: complianceCheck.release_block_reason || '违规解除风控被拦截'
        } as any);
        throwBusinessError(complianceCheck.release_block_reason || '违规操作已被拦截');
      }
    }

    const beforeStatus = alert.status;
    const updateData: any = {
      handler_id: handlerId,
      handle_time: new Date(),
      handle_result: request.handle_result || '',
      handle_remark: request.handle_remark || ''
    };

    if (request.risk_level !== undefined) updateData.risk_level = request.risk_level;
    if (request.risk_tags) updateData.risk_tags = request.risk_tags.join(',');

    switch (request.status) {
      case 3:
        updateData.status = 3;
        updateData.intercept_status = 1;
        break;
      case 4:
        if (alert.intercept_status === 1) updateData.intercept_status = 2;
        updateData.status = 4;
        break;
      case 5:
        updateData.status = 5;
        break;
      default:
        updateData.status = request.status;
    }

    if (request.is_false_positive === 1) {
      updateData.is_false_positive = 1;
      updateData.false_positive_reason = request.false_positive_reason || '';
    }

    await this.alertRepo.update(id, updateData);

    await this.traceRepo.create({
      alert_id: id,
      alert_no: alert.alert_no,
      trace_type: 2,
      operator_id: handlerId,
      operation_detail: JSON.stringify(request),
      before_status: beforeStatus,
      after_status: updateData.status,
      is_compliant: complianceCheck.is_compliant ? 1 : 0,
      violation_type: complianceCheck.is_compliant ? undefined : complianceCheck.violations.join(','),
      remark: request.handle_remark || '人工处理'
    } as any);

    const updated = await this.alertRepo.findById(id, {
      include: [this.alertRepo.getCustomerInclude(), this.alertRepo.getHandlerInclude()]
    });
    return this.convertAlertToVO(updated!);
  }

  async createBatchHandle(request: any, creatorId: string, orgId: string): Promise<any> {
    const enabledRules = await this.ruleRepo.findAllEnabled();
    if (enabledRules.length === 0) throwBusinessError('未配置监控规则，无法执行批量处理');

    const batchNo = await this.batchRepo.generateBatchNo();
    const batch = await this.batchRepo.create({
      batch_no: batchNo,
      batch_name: request.batch_name,
      batch_type: request.batch_type,
      status: 1,
      filter_condition: request.filter_condition ? JSON.stringify(request.filter_condition) : null,
      risk_level_filter: request.filter_condition?.risk_level,
      alert_type_filter: request.filter_condition?.alert_type,
      handle_action: request.handle_action,
      creator_id: creatorId,
      org_id: orgId,
      remark: request.handle_remark || ''
    } as any);

    const where: any = { status: 0 };
    if (request.alert_ids && request.alert_ids.length > 0) {
      where.id = { [Op.in]: request.alert_ids };
    } else if (request.filter_condition) {
      if (request.filter_condition.risk_level) where.risk_level = request.filter_condition.risk_level;
      if (request.filter_condition.alert_type) where.alert_type = request.filter_condition.alert_type;
      if (request.filter_condition.start_time) where.transaction_time = { ...where.transaction_time, [Op.gte]: dayjs(request.filter_condition.start_time).startOf('day').toDate() };
      if (request.filter_condition.end_time) where.transaction_time = { ...where.transaction_time, [Op.lte]: dayjs(request.filter_condition.end_time).endOf('day').toDate() };
    }

    if (request.batch_type === 1) {
      where.risk_level = { [Op.in]: [1, 2] };
    } else if (request.batch_type === 2) {
      where.risk_level = { [Op.in]: [3, 4] };
    }

    const alerts = await this.alertRepo.model.findAll({ where });
    let successCount = 0;
    let failCount = 0;
    const logs: string[] = [];

    for (const alert of alerts) {
      try {
        const updateData: any = {
          batch_id: batch.id,
          handler_id: creatorId,
          handle_time: new Date(),
          handle_remark: request.handle_remark || '批量处理'
        };

        switch (request.handle_action) {
          case 1:
            updateData.status = 1;
            updateData.handle_result = '批量确认归档';
            break;
          case 2:
            updateData.status = 3;
            updateData.intercept_status = 1;
            updateData.handle_result = '批量锁定拦截';
            break;
          case 3:
            updateData.status = 4;
            updateData.intercept_status = 2;
            updateData.handle_result = '批量解除拦截';
            break;
          case 4:
            updateData.is_false_positive = 1;
            updateData.false_positive_reason = '批量标记误判';
            updateData.handle_result = '批量标记误判';
            updateData.status = 4;
            break;
        }

        await this.alertRepo.update(alert.id, updateData);

        await this.traceRepo.create({
          alert_id: alert.id,
          alert_no: alert.alert_no,
          trace_type: 3,
          operator_id: creatorId,
          operation_detail: JSON.stringify({ batch_id: batch.id, batch_no: batchNo, action: request.handle_action }),
          before_status: alert.status,
          after_status: updateData.status,
          is_compliant: 1,
          remark: '批量处理'
        } as any);

        successCount++;
      } catch (e: any) {
        failCount++;
        logs.push(`[${alert.alert_no}] 处理失败: ${e.message}`);
      }
    }

    await this.batchRepo.update(batch.id, {
      status: failCount === 0 ? 2 : (successCount > 0 ? 3 : 4),
      total_count: alerts.length,
      success_count: successCount,
      fail_count: failCount,
      execute_start_time: new Date(),
      execute_end_time: new Date(),
      execute_log: logs.length > 0 ? logs.join('\n') : '批量处理完成'
    } as any);

    const result = await this.batchRepo.findById(batch.id, {
      include: [this.batchRepo.getCreatorInclude(), this.batchRepo.getOrganizationInclude()]
    });
    return this.convertBatchToVO(result!);
  }

  async getBatchList(params: any): Promise<PaginatedResult<any>> {
    const { page = 1, pageSize = 10, ...queryParams } = params;
    const where = this.batchRepo.buildQuery(queryParams);
    const result = await this.batchRepo.findAndCountAll({
      where,
      page,
      pageSize,
      include: [this.batchRepo.getCreatorInclude(), this.batchRepo.getOrganizationInclude()],
      order: [['created_at', 'DESC']]
    });

    return {
      ...result,
      rows: result.rows.map((item: any) => this.convertBatchToVO(item))
    };
  }

  async getBatchDetail(id: string): Promise<any> {
    const batch = await this.batchRepo.findById(id, {
      include: [this.batchRepo.getCreatorInclude(), this.batchRepo.getOrganizationInclude()]
    });
    if (!batch) throwNotFoundError('批量处理批次不存在');

    const vo = this.convertBatchToVO(batch);
    const alertList = await this.alertRepo.findByBatchId(id);
    return { ...vo, alert_list: alertList.map((a: any) => this.convertAlertToVO(a)) };
  }

  async getTraceList(params: any): Promise<PaginatedResult<any>> {
    const { page = 1, pageSize = 10, ...queryParams } = params;
    const where = this.traceRepo.buildQuery(queryParams);
    const result = await this.traceRepo.findAndCountAll({
      where,
      page,
      pageSize,
      include: [this.traceRepo.getAlertInclude(), this.traceRepo.getOperatorInclude(), this.traceRepo.getRuleInclude()],
      order: [['created_at', 'DESC']]
    });

    return {
      ...result,
      rows: result.rows.map((item: any) => this.convertTraceToVO(item))
    };
  }

  async getAlertTrace(alertId: string): Promise<any> {
    if (!isValidId(alertId)) throwValidationError('无效的异常交易ID');
    const traces = await this.traceRepo.findByAlertId(alertId);
    return traces.map((t: any) => this.convertTraceToVO(t));
  }

  async getRuleList(params: any): Promise<PaginatedResult<any>> {
    const { page = 1, pageSize = 10, ...queryParams } = params;
    const where = this.ruleRepo.buildQuery(queryParams);
    return await this.ruleRepo.findAndCountAll({
      where,
      page,
      pageSize,
      order: [['priority', 'DESC'], ['sort_order', 'ASC']]
    });
  }

  async getRuleDetail(id: string): Promise<any> {
    const rule = await this.ruleRepo.findById(id);
    if (!rule) throwNotFoundError('监控规则不存在');
    return this.convertRuleToVO(rule);
  }

  async createRule(request: any): Promise<any> {
    const existing = await this.ruleRepo.findByRuleCode(request.rule_code);
    if (existing) throwBusinessError(`规则编码 ${request.rule_code} 已存在`);

    const rule = await this.ruleRepo.create({
      rule_code: request.rule_code,
      rule_name: request.rule_name,
      rule_type: request.rule_type,
      dimension: request.dimension,
      threshold_config: request.threshold_config ? JSON.stringify(request.threshold_config) : null,
      risk_level_mapping: request.risk_level_mapping ? JSON.stringify(request.risk_level_mapping) : null,
      alert_action: request.alert_action || 1,
      priority: request.priority || 0,
      is_required: request.is_required || 0,
      description: request.description || '',
      sort_order: request.sort_order || 0,
      is_enabled: 1,
      status: 1,
      trigger_count: 0
    } as any);

    return this.convertRuleToVO(rule);
  }

  async updateRule(id: string, request: any): Promise<any> {
    const rule = await this.ruleRepo.findById(id);
    if (!rule) throwNotFoundError('监控规则不存在');

    const updateData: any = {};
    if (request.rule_name !== undefined) updateData.rule_name = request.rule_name;
    if (request.threshold_config !== undefined) updateData.threshold_config = JSON.stringify(request.threshold_config);
    if (request.risk_level_mapping !== undefined) updateData.risk_level_mapping = JSON.stringify(request.risk_level_mapping);
    if (request.alert_action !== undefined) updateData.alert_action = request.alert_action;
    if (request.priority !== undefined) updateData.priority = request.priority;
    if (request.is_enabled !== undefined) updateData.is_enabled = request.is_enabled;
    if (request.description !== undefined) updateData.description = request.description;
    if (request.sort_order !== undefined) updateData.sort_order = request.sort_order;

    await this.ruleRepo.update(id, updateData);
    const updated = await this.ruleRepo.findById(id);
    return this.convertRuleToVO(updated!);
  }

  async deleteRule(id: string): Promise<void> {
    const rule = await this.ruleRepo.findById(id);
    if (!rule) throwNotFoundError('监控规则不存在');
    if (rule.is_required === 1) throwBusinessError('必选规则不允许删除');
    await this.ruleRepo.delete(id);
  }

  async validateRules(): Promise<any> {
    const allRules = await this.ruleRepo.model.findAll();
    const enabledRules = allRules.filter((r: any) => r.is_enabled === 1 && r.status === 1);
    const requiredRules = allRules.filter((r: any) => r.is_required === 1);

    const missingRequired = requiredRules
      .filter((r: any) => r.is_enabled !== 1 || r.status !== 1)
      .map((r: any) => r.rule_code);

    const ruleCodes = allRules.map((r: any) => r.rule_code);
    const duplicateCodes = ruleCodes.filter((code: string, index: number) => ruleCodes.indexOf(code) !== index);
    const uniqueDuplicates = [...new Set(duplicateCodes)];

    const isValid = enabledRules.length > 0 && missingRequired.length === 0 && uniqueDuplicates.length === 0;

    return {
      is_valid: isValid,
      enabled_rules_count: enabledRules.length,
      required_rules_count: requiredRules.length,
      missing_required_rules: missingRequired,
      duplicate_rules: uniqueDuplicates,
      error_message: !isValid
        ? [
            enabledRules.length === 0 ? '无启用的监控规则' : '',
            missingRequired.length > 0 ? `必选规则未启用: ${missingRequired.join(', ')}` : '',
            uniqueDuplicates.length > 0 ? `规则编码重复: ${uniqueDuplicates.join(', ')}` : ''
          ].filter(Boolean).join('; ')
        : undefined
    };
  }

  async checkCompliance(alertId: string, request: any): Promise<any> {
    const alert = await this.alertRepo.findById(alertId);
    if (!alert) throwNotFoundError('异常交易记录不存在');

    const violations: string[] = [];
    let canRelease = true;
    let releaseBlockReason: string | undefined;
    let isFalsePositive = false;
    const falsePositiveEvidence: string[] = [];

    if (request.status === 4 && alert.intercept_status === 1) {
      if (alert.risk_level >= 4) {
        canRelease = false;
        releaseBlockReason = '高风险异常交易不允许直接解除拦截，需升级审批';
        violations.push('违规解除风控');
      }
      if (alert.risk_level >= 3 && !request.handle_remark) {
        canRelease = false;
        releaseBlockReason = '较高风险以上异常交易解除拦截必须填写原因';
        violations.push('解除拦截缺少原因说明');
      }
    }

    if (request.is_false_positive === 1) {
      isFalsePositive = true;
      if (!request.false_positive_reason) {
        violations.push('标记误判需提供误判原因');
      }
      const triggerRules = alert.trigger_rules ? JSON.parse(alert.trigger_rules) : [];
      falsePositiveEvidence.push(`触发规则数: ${triggerRules.length}`);
      if (triggerRules.length === 1) {
        falsePositiveEvidence.push('仅单一规则触发，误判可能性较高');
      }
    }

    if (request.risk_level && request.risk_level < alert.risk_level) {
      if (request.risk_level < 3 && alert.risk_level >= 3) {
        violations.push('违规降低风险等级');
      }
    }

    return {
      is_compliant: violations.length === 0,
      violations,
      can_release: canRelease,
      release_block_reason: releaseBlockReason,
      is_false_positive: isFalsePositive,
      false_positive_evidence: falsePositiveEvidence
    };
  }

  async getAlertStatistics(startTime?: string, endTime?: string, orgId?: string): Promise<any> {
    const where: any = {};
    if (orgId) where.org_id = orgId;
    if (startTime || endTime) {
      where.created_at = {};
      if (startTime) where.created_at[Op.gte] = dayjs(startTime).startOf('day').toDate();
      if (endTime) where.created_at[Op.lte] = dayjs(endTime).endOf('day').toDate();
    }

    const allAlerts = await this.alertRepo.model.findAll({ where });

    const totalCount = allAlerts.length;
    const pendingCount = allAlerts.filter((a: any) => a.status === 0).length;
    const autoArchivedCount = allAlerts.filter((a: any) => a.status === 1).length;
    const reviewingCount = allAlerts.filter((a: any) => a.status === 2).length;
    const interceptedCount = allAlerts.filter((a: any) => a.status === 3).length;
    const releasedCount = allAlerts.filter((a: any) => a.status === 4).length;
    const confirmedCount = allAlerts.filter((a: any) => a.status === 5).length;
    const falsePositiveCount = allAlerts.filter((a: any) => a.is_false_positive === 1).length;

    const todayStart = dayjs().startOf('day').toDate();
    const todayAlerts = allAlerts.filter((a: any) => new Date(a.created_at) >= todayStart);
    const todayIntercepted = todayAlerts.filter((a: any) => a.intercept_status === 1);

    const byType = [1, 2, 3, 4].map(type => ({
      type,
      type_text: AlertTypeText[type] || '未知',
      count: allAlerts.filter((a: any) => a.alert_type === type).length
    }));

    const byRiskLevel = [1, 2, 3, 4].map(level => ({
      level,
      level_text: AlertRiskLevelText[level] || '未知',
      count: allAlerts.filter((a: any) => a.risk_level === level).length
    }));

    return {
      total_count: totalCount,
      pending_count: pendingCount,
      auto_archived_count: autoArchivedCount,
      reviewing_count: reviewingCount,
      intercepted_count: interceptedCount,
      released_count: releasedCount,
      confirmed_count: confirmedCount,
      by_type: byType,
      by_risk_level: byRiskLevel,
      false_positive_rate: totalCount > 0 ? parseFloat((falsePositiveCount / totalCount * 100).toFixed(2)) : 0,
      today_count: todayAlerts.length,
      today_intercepted_count: todayIntercepted.length
    };
  }

  async getMonitorConfig(): Promise<any> {
    return {
      alert_types: [
        { value: 1, text: '高频交易' },
        { value: 2, text: '异地交易' },
        { value: 3, text: '大额异动' },
        { value: 4, text: '夜间异常' }
      ],
      risk_levels: [
        { value: 1, text: '低风险', color: 'success' },
        { value: 2, text: '中风险', color: 'warning' },
        { value: 3, text: '较高风险', color: 'danger' },
        { value: 4, text: '高风险', color: 'danger' }
      ],
      alert_statuses: [
        { value: 0, text: '待处理' },
        { value: 1, text: '自动归档' },
        { value: 2, text: '人工复核中' },
        { value: 3, text: '已拦截' },
        { value: 4, text: '已解除' },
        { value: 5, text: '已确认异常' }
      ],
      intercept_statuses: [
        { value: 0, text: '未拦截' },
        { value: 1, text: '已拦截' },
        { value: 2, text: '已解除拦截' }
      ],
      rule_types: [
        { value: 1, text: '高频交易监控' },
        { value: 2, text: '异地交易监控' },
        { value: 3, text: '大额异动监控' },
        { value: 4, text: '夜间异常监控' }
      ],
      monitor_dimensions: [
        { value: 1, text: '频次维度' },
        { value: 2, text: '金额维度' },
        { value: 3, text: '地域维度' },
        { value: 4, text: '时间维度' },
        { value: 5, text: '设备维度' },
        { value: 6, text: '场景维度' }
      ],
      alert_actions: [
        { value: 1, text: '仅预警' },
        { value: 2, text: '预警+拦截' },
        { value: 3, text: '预警+拦截+强制复核' }
      ],
      batch_types: [
        { value: 1, text: '低风险批量确认' },
        { value: 2, text: '高风险批量锁定' },
        { value: 3, text: '自定义' }
      ],
      handle_actions: [
        { value: 1, text: '确认归档' },
        { value: 2, text: '锁定拦截' },
        { value: 3, text: '解除拦截' },
        { value: 4, text: '标记误判' }
      ]
    };
  }

  private convertAlertToVO(alert: any): any {
    const triggerRules = alert.trigger_rules ? (typeof alert.trigger_rules === 'string' ? JSON.parse(alert.trigger_rules) : alert.trigger_rules) : [];
    const deviceInfo = alert.device_info ? (typeof alert.device_info === 'string' ? JSON.parse(alert.device_info) : alert.device_info) : null;
    const locationInfo = alert.location_info ? (typeof alert.location_info === 'string' ? JSON.parse(alert.location_info) : alert.location_info) : null;
    const frequencyInfo = alert.frequency_info ? (typeof alert.frequency_info === 'string' ? JSON.parse(alert.frequency_info) : alert.frequency_info) : null;

    return {
      id: alert.id,
      alert_no: alert.alert_no,
      transaction_id: alert.transaction_id,
      transaction_no: alert.transaction_no,
      customer_id: alert.customer_id,
      customer_no: alert.customer_no,
      customer_name: alert.customer_name,
      account_id: alert.account_id,
      account_no: alert.account_no,
      trigger_rules: triggerRules,
      alert_type: alert.alert_type,
      alert_type_text: AlertTypeText[alert.alert_type] || '未知',
      risk_level: alert.risk_level,
      risk_level_text: AlertRiskLevelText[alert.risk_level] || '未知',
      risk_level_color: AlertRiskLevelColor[alert.risk_level] || 'info',
      risk_tags: alert.risk_tags,
      status: alert.status,
      status_text: AlertStatusText[alert.status] || '未知',
      transaction_amount: parseFloat(String(alert.transaction_amount || 0)),
      transaction_time: alert.transaction_time,
      transaction_scene: alert.transaction_scene,
      device_info: deviceInfo,
      location_info: locationInfo,
      frequency_info: frequencyInfo,
      intercept_status: alert.intercept_status,
      intercept_status_text: InterceptStatusText[alert.intercept_status] || '未知',
      alert_notify_status: alert.alert_notify_status,
      alert_notify_time: alert.alert_notify_time,
      handler_id: alert.handler_id,
      handler_name: alert.handler?.real_name || alert.handler?.username,
      handle_time: alert.handle_time,
      handle_result: alert.handle_result,
      handle_remark: alert.handle_remark,
      batch_id: alert.batch_id,
      batch_no: alert.alertBatch?.batch_no,
      org_id: alert.org_id,
      org_name: alert.organization?.name,
      previous_alerts_count: alert.previous_alerts_count || 0,
      is_false_positive: alert.is_false_positive,
      false_positive_reason: alert.false_positive_reason,
      created_at: alert.created_at,
      updated_at: alert.updated_at
    };
  }

  private convertRuleToVO(rule: any): any {
    return {
      id: rule.id,
      rule_code: rule.rule_code,
      rule_name: rule.rule_name,
      rule_type: rule.rule_type,
      rule_type_text: RuleTypeText[rule.rule_type] || '未知',
      dimension: rule.dimension,
      dimension_text: MonitorDimensionText[rule.dimension] || '未知',
      is_enabled: rule.is_enabled,
      priority: rule.priority,
      threshold_config: rule.threshold_config ? (typeof rule.threshold_config === 'string' ? JSON.parse(rule.threshold_config) : rule.threshold_config) : null,
      risk_level_mapping: rule.risk_level_mapping ? (typeof rule.risk_level_mapping === 'string' ? JSON.parse(rule.risk_level_mapping) : rule.risk_level_mapping) : null,
      alert_action: rule.alert_action,
      alert_action_text: AlertActionText[rule.alert_action] || '未知',
      is_required: rule.is_required,
      description: rule.description,
      sort_order: rule.sort_order,
      status: rule.status,
      trigger_count: rule.trigger_count || 0,
      created_at: rule.created_at,
      updated_at: rule.updated_at
    };
  }

  private convertBatchToVO(batch: any): any {
    return {
      id: batch.id,
      batch_no: batch.batch_no,
      batch_name: batch.batch_name,
      batch_type: batch.batch_type,
      batch_type_text: AlertBatchTypeText[batch.batch_type] || '未知',
      status: batch.status,
      status_text: AlertBatchStatusText[batch.status] || '未知',
      total_count: batch.total_count,
      success_count: batch.success_count,
      fail_count: batch.fail_count,
      progress: batch.total_count > 0 ? Math.round((batch.success_count + batch.fail_count) / batch.total_count * 100) : 0,
      filter_condition: batch.filter_condition ? (typeof batch.filter_condition === 'string' ? JSON.parse(batch.filter_condition) : batch.filter_condition) : null,
      risk_level_filter: batch.risk_level_filter,
      alert_type_filter: batch.alert_type_filter,
      handle_action: batch.handle_action,
      creator_id: batch.creator_id,
      creator_name: batch.creator?.real_name || batch.creator?.username,
      org_id: batch.org_id,
      org_name: batch.organization?.name,
      execute_start_time: batch.execute_start_time,
      execute_end_time: batch.execute_end_time,
      execute_log: batch.execute_log,
      remark: batch.remark,
      created_at: batch.created_at,
      updated_at: batch.updated_at
    };
  }

  private convertTraceToVO(trace: any): any {
    return {
      id: trace.id,
      alert_id: trace.alert_id,
      alert_no: trace.alert_no || trace.alert?.alert_no,
      trace_type: trace.trace_type,
      trace_type_text: TraceTypeText[trace.trace_type] || '未知',
      operator_id: trace.operator_id,
      operator_name: trace.operator_name || trace.operator?.real_name || trace.operator?.username,
      operation_detail: trace.operation_detail ? (typeof trace.operation_detail === 'string' ? JSON.parse(trace.operation_detail) : trace.operation_detail) : null,
      rule_id: trace.rule_id,
      rule_name: trace.rule_name || trace.rule?.rule_name,
      before_status: trace.before_status,
      before_status_text: trace.before_status !== null && trace.before_status !== undefined ? (AlertStatusText[trace.before_status] || '未知') : undefined,
      after_status: trace.after_status,
      after_status_text: trace.after_status !== null && trace.after_status !== undefined ? (AlertStatusText[trace.after_status] || '未知') : undefined,
      is_compliant: trace.is_compliant,
      violation_type: trace.violation_type,
      remark: trace.remark,
      created_at: trace.created_at
    };
  }
}
