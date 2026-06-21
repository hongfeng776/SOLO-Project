import { Op } from 'sequelize';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';
import businessInspectionDAO from '@dao/BusinessInspectionDAO';

function generateInspectionNo(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BI${dateStr}${random}`;
}

function generateIssueNo(inspectionNo: string, seq: number): string {
  return `${inspectionNo}-I${seq.toString().padStart(3, '0')}`;
}

const SCAN_RULES: Record<string, Array<{ ruleCode: string; ruleName: string; level: string; checkFn: (data: any, params: any) => { violated: boolean; description: string; actualValue: string; expectedValue: string } }>> = {
  trade: [
    { ruleCode: 'TRADE_001', ruleName: '单笔交易金额超限', level: 'severe', checkFn: (d, p) => ({ violated: d.trade_amount >= (p.tradeAmountThreshold || 500000), description: `交易金额${d.trade_amount}超过阈值${p.tradeAmountThreshold || 500000}`, actualValue: String(d.trade_amount), expectedValue: `<${p.tradeAmountThreshold || 500000}` }) },
    { ruleCode: 'TRADE_002', ruleName: '频繁交易异常', level: 'normal', checkFn: (d, p) => ({ violated: d.trade_count >= (p.tradeFrequencyLimit || 10), description: `当日交易${d.trade_count}次，超过频率限制`, actualValue: `${d.trade_count}次`, expectedValue: `<${p.tradeFrequencyLimit || 10}次` }) },
    { ruleCode: 'TRADE_003', ruleName: '未授权交易', level: 'severe', checkFn: (d) => ({ violated: !d.authorized, description: '交易未经授权', actualValue: '未授权', expectedValue: '已授权' }) },
  ],
  asset: [
    { ruleCode: 'ASSET_001', ruleName: '资产集中度超标', level: 'normal', checkFn: (d, p) => ({ violated: d.concentration >= (p.assetConcentrationLimit || 30), description: `资产集中度${d.concentration}%超过限制`, actualValue: `${d.concentration}%`, expectedValue: `<${p.assetConcentrationLimit || 30}%` }) },
    { ruleCode: 'ASSET_002', ruleName: '持仓比例超限', level: 'severe', checkFn: (d, p) => ({ violated: d.position_percent >= (p.positionLimitPercent || 25), description: `单只持仓占比${d.position_percent}%`, actualValue: `${d.position_percent}%`, expectedValue: `<${p.positionLimitPercent || 25}%` }) },
  ],
  risk: [
    { ruleCode: 'RISK_001', ruleName: '风险评分超标', level: 'severe', checkFn: (d, p) => ({ violated: d.risk_score >= (p.riskScoreThreshold || 80), description: `风险评分${d.risk_score}超过阈值`, actualValue: String(d.risk_score), expectedValue: `<${p.riskScoreThreshold || 80}` }) },
    { ruleCode: 'RISK_002', ruleName: '风控告警未处理', level: 'normal', checkFn: (d) => ({ violated: d.unresolved_alerts > 0, description: `存在${d.unresolved_alerts}条未处理风控告警`, actualValue: `${d.unresolved_alerts}条`, expectedValue: '0条' }) },
  ],
};

const VIOLATION_LEVEL_MAP: Record<string, string> = { minor: 'minor', normal: 'normal', severe: 'severe' };

class BusinessInspectionService {
  async getInspectionList(params: any) {
    const { page = 1, pageSize = 20, inspectionNo, inspectionCycle, inspectionStatus, inspectionScope, startDate, endDate } = params;
    const where: any = {};
    if (inspectionNo) where.inspection_no = { [Op.like]: `%${inspectionNo}%` };
    if (inspectionCycle) where.inspection_cycle = inspectionCycle;
    if (inspectionStatus) where.inspection_status = inspectionStatus;
    if (inspectionScope) where.inspection_scopes = { [Op.contains]: [inspectionScope] };
    if (startDate && endDate) where.created_at = { [Op.between]: [startDate, endDate] };

    const { count, rows } = await db.BusinessInspection.findAndCountAll({ where, order: [['created_at', 'DESC']], limit: pageSize, offset: (page - 1) * pageSize });
    return { list: rows, total: count, page, pageSize };
  }

  async getInspectionById(id: number) {
    const inspection = await businessInspectionDAO.findById(id);
    if (!inspection) throw new AppError(404, '巡检记录不存在');
    return inspection;
  }

  async getIssueList(params: any) {
    const { page = 1, pageSize = 20, inspectionId, violationLevel, issueStatus, scope, businessType, archived } = params;
    const where: any = {};
    if (inspectionId) where.inspection_id = inspectionId;
    if (violationLevel) where.violation_level = violationLevel;
    if (issueStatus) where.issue_status = issueStatus;
    if (scope) where.scope = scope;
    if (businessType) where.business_type = businessType;
    if (archived !== undefined) where.archived = archived;

    const { count, rows } = await db.BusinessInspectionIssue.findAndCountAll({ where, order: [['violation_level', 'DESC'], ['created_at', 'ASC']], limit: pageSize, offset: (page - 1) * pageSize });
    return { list: rows, total: count, page, pageSize };
  }

  async getInspectionLogs(inspectionId: number) {
    return db.BusinessInspectionLog.findAll({ where: { inspection_id: inspectionId }, order: [['created_at', 'ASC']] });
  }

  async preCheck(params: any, permissions: string[]) {
    const { inspectionCycle, inspectionScopes, configParams } = params;
    const messages: string[] = [];
    const warnings: string[] = [];

    const permissionValid = permissions.includes('compliance:inspection:manage') || permissions.includes('compliance:manage');
    if (!permissionValid) messages.push('当前用户无巡检管理权限');

    const validCycles = ['daily', 'weekly', 'monthly'];
    const cycleValid = validCycles.includes(inspectionCycle);
    if (!cycleValid) messages.push('巡检周期参数无效');

    const validScopes = ['trade', 'asset', 'risk'];
    const scopeValid = Array.isArray(inspectionScopes) && inspectionScopes.length > 0 && inspectionScopes.every((s: string) => validScopes.includes(s));
    if (!scopeValid) messages.push('巡检范围不能为空且必须为有效维度');
    if (Array.isArray(inspectionScopes) && inspectionScopes.length === 0) messages.push('巡检范围为空，无法启动巡检');

    const paramsValid = !configParams || typeof configParams === 'object';
    if (!paramsValid) messages.push('巡检参数格式无效');

    const blocked = !permissionValid || !cycleValid || !scopeValid || !paramsValid;

    return { canStart: !blocked, permissionValid, cycleValid, scopeValid, paramsValid, blocked, messages, warnings };
  }

  async createInspection(data: any, operatorId: number, operatorName: string) {
    const preCheckResult = await this.preCheck(data, ['compliance:inspection:manage', 'compliance:manage']);
    if (preCheckResult.blocked) throw new AppError(400, preCheckResult.messages.join('; '));

    const inspectionNo = generateInspectionNo();
    const now = new Date();
    const inspection = await db.BusinessInspection.create({
      inspection_no: inspectionNo,
      inspection_cycle: data.inspectionCycle,
      inspection_scopes: data.inspectionScopes,
      inspection_status: 'configured',
      config_params: data.configParams || {},
      scheduled_at: data.scheduledAt || now,
      total_scanned: 0, total_issues: 0, minor_count: 0, normal_count: 0, severe_count: 0,
      coverage_score: 0, accuracy_score: 0,
      operator_id: operatorId,
      operator_name: operatorName,
    } as any);

    await db.BusinessInspectionLog.create({
      inspection_id: inspection.id, inspection_no: inspectionNo,
      action: 'configure', operator_id: operatorId, operator_name: operatorName,
      detail: { cycle: data.inspectionCycle, scopes: data.inspectionScopes, configParams: data.configParams },
      created_at: now,
    } as any);

    return inspection;
  }

  async startInspection(id: number, operatorId: number, operatorName: string, permissions: string[]) {
    const inspection = await this.getInspectionById(id);
    if (inspection.inspection_status === 'running') throw new AppError(400, '巡检已在运行中');

    const preCheckResult = await this.preCheck({
      inspectionCycle: inspection.inspection_cycle,
      inspectionScopes: inspection.inspection_scopes,
      configParams: inspection.config_params,
    }, permissions);
    if (preCheckResult.blocked) throw new AppError(400, `前置校验失败: ${preCheckResult.messages.join('; ')}`);

    const now = new Date();
    await inspection.update({ inspection_status: 'running', started_at: now } as any);

    await db.BusinessInspectionLog.create({
      inspection_id: id, inspection_no: inspection.inspection_no,
      action: 'pre_check', operator_id: operatorId, operator_name: operatorName,
      detail: preCheckResult,
      created_at: now,
    } as any);

    await db.BusinessInspectionLog.create({
      inspection_id: id, inspection_no: inspection.inspection_no,
      action: 'start', operator_id: operatorId, operator_name: operatorName,
      detail: { fromStatus: inspection.inspection_status },
      created_at: now,
    } as any);

    const scopes: string[] = inspection.inspection_scopes || [];
    const configParams = inspection.config_params || {};
    let totalScanned = 0;
    let totalIssues = 0;
    let minorCount = 0;
    let normalCount = 0;
    let severeCount = 0;
    let issueSeq = 1;

    for (const scope of scopes) {
      const rules = SCAN_RULES[scope] || [];
      const mockData = this.generateMockScanData(scope, 20);
      totalScanned += mockData.length;

      for (const dataItem of mockData) {
        for (const rule of rules) {
          const result = rule.checkFn(dataItem, configParams);
          if (result.violated) {
            totalIssues++;
            const level = VIOLATION_LEVEL_MAP[rule.level] || 'normal';
            if (level === 'minor') minorCount++;
            else if (level === 'normal') normalCount++;
            else severeCount++;

            await db.BusinessInspectionIssue.create({
              inspection_id: id, inspection_no: inspection.inspection_no,
              issue_no: generateIssueNo(inspection.inspection_no, issueSeq++),
              scope, violation_level: level, issue_status: 'pending',
              business_type: scope, business_id: dataItem.id || 0, business_no: dataItem.no || '',
              description: result.description, rule_code: rule.ruleCode, rule_name: rule.ruleName,
              actual_value: result.actualValue, expected_value: result.expectedValue,
              archived: false,
            } as any);
          }
        }
      }

      await db.BusinessInspectionLog.create({
        inspection_id: id, inspection_no: inspection.inspection_no,
        action: `scan_${scope}` as any, operator_id: 0, operator_name: 'system',
        detail: { scannedCount: mockData.length, issuesFound: totalIssues, rulesApplied: rules.length },
        created_at: new Date(),
      } as any);
    }

    const coverageScore = scopes.length >= 3 ? 100 : Math.round((scopes.length / 3) * 100);
    const accuracyScore = totalIssues > 0 ? Math.round(Math.max(60, 95 - severeCount * 3)) : 100;

    await inspection.update({
      inspection_status: 'completed', completed_at: new Date(),
      total_scanned: totalScanned, total_issues: totalIssues,
      minor_count: minorCount, normal_count: normalCount, severe_count: severeCount,
      coverage_score: coverageScore, accuracy_score: accuracyScore,
    } as any);

    await db.BusinessInspectionLog.create({
      inspection_id: id, inspection_no: inspection.inspection_no,
      action: 'complete', operator_id: 0, operator_name: 'system',
      detail: { totalScanned, totalIssues, minorCount, normalCount, severeCount, coverageScore, accuracyScore },
      coverage_check: { passed: coverageScore >= 80, score: coverageScore, issues: coverageScore < 80 ? [`巡检覆盖度仅${coverageScore}%，建议覆盖全部维度`] : [] },
      accuracy_check: { passed: accuracyScore >= 70, score: accuracyScore, issues: accuracyScore < 70 ? ['问题判定准确性不足，建议优化规则'] : [] },
      created_at: new Date(),
    } as any);

    return inspection;
  }

  private generateMockScanData(scope: string, count: number): any[] {
    const data: any[] = [];
    for (let i = 0; i < count; i++) {
      const item: any = { id: i + 1, no: `${scope.toUpperCase()}-${String(i + 1).padStart(4, '0')}` };
      if (scope === 'trade') {
        item.trade_amount = Math.floor(Math.random() * 2000000);
        item.trade_count = Math.floor(Math.random() * 15);
        item.authorized = Math.random() > 0.1;
      } else if (scope === 'asset') {
        item.concentration = Math.floor(Math.random() * 50);
        item.position_percent = Math.floor(Math.random() * 40);
      } else if (scope === 'risk') {
        item.risk_score = Math.floor(Math.random() * 100);
        item.unresolved_alerts = Math.floor(Math.random() * 5);
      }
      data.push(item);
    }
    return data;
  }

  async batchProcessIssues(params: any, operatorName: string) {
    const { ids, action, processNote, rectifyEvidence } = params;
    const now = new Date();
    const results: any[] = [];

    for (const id of ids) {
      try {
        const issue = await db.BusinessInspectionIssue.findByPk(id);
        if (!issue) { results.push({ success: false, id, message: '问题不存在' }); continue; }
        if (issue.issue_status !== 'pending') { results.push({ success: false, id, message: '问题已处理' }); continue; }

        if (action === 'rectify') {
          if (!rectifyEvidence && !processNote) { results.push({ success: false, id, message: '整改需提供整改说明或证据' }); continue; }
          await issue.update({ issue_status: 'rectified', processed_by: operatorName, processed_at: now, process_note: processNote, rectify_evidence: rectifyEvidence, archived: true } as any);
        } else if (action === 'ignore') {
          await issue.update({ issue_status: 'ignored', processed_by: operatorName, processed_at: now, process_note: processNote } as any);
        } else if (action === 'report') {
          await issue.update({ issue_status: 'reported', processed_by: operatorName, processed_at: now, process_note: processNote } as any);
        }
        results.push({ success: true, id });
      } catch (err: any) {
        results.push({ success: false, id, message: err.message });
      }
    }

    const logAction = action === 'rectify' ? 'batch_rectify' : action === 'ignore' ? 'batch_ignore' : 'batch_report';
    const firstIssue = await db.BusinessInspectionIssue.findByPk(ids[0]);
    if (firstIssue) {
      await db.BusinessInspectionLog.create({
        inspection_id: firstIssue.inspection_id, inspection_no: firstIssue.inspection_no,
        action: logAction, operator_id: 0, operator_name: operatorName,
        detail: { totalCount: ids.length, successCount: results.filter(r => r.success).length, action, processNote },
        created_at: now,
      } as any);
    }

    return { total: ids.length, successCount: results.filter(r => r.success).length, results };
  }

  async batchPreviewIssues(ids: number[]) {
    const issues = await db.BusinessInspectionIssue.findAll({ where: { id: { [Op.in]: ids } } });
    const byViolationLevel: Record<string, number> = {};
    const byScope: Record<string, number> = {};
    const byIssueStatus: Record<string, number> = {};
    const blockReasons: any[] = [];

    issues.forEach((issue: any) => {
      byViolationLevel[issue.violation_level] = (byViolationLevel[issue.violation_level] || 0) + 1;
      byScope[issue.scope] = (byScope[issue.scope] || 0) + 1;
      byIssueStatus[issue.issue_status] = (byIssueStatus[issue.issue_status] || 0) + 1;

      if (issue.issue_status !== 'pending') {
        blockReasons.push({ id: issue.id, issueNo: issue.issue_no, reason: `问题已处理（${issue.issue_status}）` });
      }
    });

    return { byViolationLevel, byScope, byIssueStatus, blockReasons, totalCount: issues.length };
  }

  async getStats() {
    const [totalInspections, totalRunning, totalCompleted] = await Promise.all([
      db.BusinessInspection.count(),
      db.BusinessInspection.count({ where: { inspection_status: 'running' } }),
      db.BusinessInspection.count({ where: { inspection_status: 'completed' } }),
    ]);

    const allCompleted = await db.BusinessInspection.findAll({ where: { inspection_status: 'completed' } });
    const totalIssues = allCompleted.reduce((sum, i: any) => sum + (i.total_issues || 0), 0);
    const severeIssues = allCompleted.reduce((sum, i: any) => sum + (i.severe_count || 0), 0);

    const pendingIssues = await db.BusinessInspectionIssue.count({ where: { issue_status: 'pending' } });
    const rectifiedIssues = await db.BusinessInspectionIssue.count({ where: { issue_status: 'rectified' } });

    const avgCoverageScore = allCompleted.length > 0 ? Math.round(allCompleted.reduce((s, i: any) => s + Number(i.coverage_score || 0), 0) / allCompleted.length) : 0;
    const avgAccuracyScore = allCompleted.length > 0 ? Math.round(allCompleted.reduce((s, i: any) => s + Number(i.accuracy_score || 0), 0) / allCompleted.length) : 0;

    const byCycle: Record<string, number> = {};
    const byViolationLevel: Record<string, number> = { minor: 0, normal: 0, severe: 0 };
    const byScope: Record<string, number> = {};

    allCompleted.forEach((i: any) => {
      byCycle[i.inspection_cycle] = (byCycle[i.inspection_cycle] || 0) + 1;
      byViolationLevel.minor += i.minor_count || 0;
      byViolationLevel.normal += i.normal_count || 0;
      byViolationLevel.severe += i.severe_count || 0;
      (i.inspection_scopes || []).forEach((s: string) => { byScope[s] = (byScope[s] || 0) + 1; });
    });

    return { totalInspections, totalRunning, totalCompleted, totalIssues, pendingIssues, rectifiedIssues, severeIssues, avgCoverageScore, avgAccuracyScore, byCycle, byViolationLevel, byScope };
  }
}

export default new BusinessInspectionService();
