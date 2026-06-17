import permissionChangeLogDao, { PermissionChangeLogQueryParams, AnomalyDetectionParams } from '../dao/PermissionChangeLog.dao';
import { PermissionChangeLogCreationAttributes, ChangeAction, ChangeTargetType } from '../models/PermissionChangeLog.model';
import { PaginationResult } from '../types';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';
import * as ExcelJS from 'exceljs';

const MAX_TIME_RANGE_DAYS = 90;

function validateTimeRange(startTime?: string, endTime?: string): void {
  if (!startTime || !endTime) return;
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const diffDays = (end - start) / (1000 * 60 * 60 * 24);
  if (diffDays > MAX_TIME_RANGE_DAYS) {
    throw new Error(`时间区间不能超过 ${MAX_TIME_RANGE_DAYS} 天`);
  }
}

function compareObjects(before: any, after: any): any {
  const changes: any = {};
  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  for (const key of allKeys) {
    const beforeVal = JSON.stringify(before?.[key]);
    const afterVal = JSON.stringify(after?.[key]);
    if (beforeVal !== afterVal) {
      changes[key] = { before: before?.[key], after: after?.[key] };
    }
  }
  return changes;
}

class PermissionChangeLogService {
  public async logChange(data: PermissionChangeLogCreationAttributes): Promise<void> {
    try {
      const changeData = { ...data };
      if (changeData.beforeData || changeData.afterData) {
        changeData.changedFields = compareObjects(changeData.beforeData, changeData.afterData);
      }
      await permissionChangeLogDao.create(changeData);
      CacheUtils.delPattern('permission:change:*');
    } catch (err) {
      console.error('Failed to log permission change:', err);
    }
  }

  public async findAll(params: PermissionChangeLogQueryParams): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;

    validateTimeRange(params.startTime, params.endTime);

    const cacheKey = `permission:change:list:${JSON.stringify(params)}`;
    const cached = await CacheUtils.get<any>(cacheKey);
    if (cached) return cached;

    const { rows, count } = await permissionChangeLogDao.findAllPaged(params);
    const result: PaginationResult<any> = { list: rows, total: count, page, pageSize, totalPages: Math.ceil(count / pageSize) };

    await CacheUtils.set(cacheKey, result, CacheTTL.SHORT);
    return result;
  }

  public async getDetail(id: string): Promise<any> {
    const cacheKey = `${CacheKey.PERMISSION_DETAIL}${id}`;
    const cached = await CacheUtils.get<any>(cacheKey);
    if (cached) return cached;

    const log = await permissionChangeLogDao.findById(id);
    if (!log) throw new Error('变更记录不存在');

    const detail = {
      ...log.toJSON(),
      changedFields: compareObjects(log.beforeData, log.afterData),
    };

    await CacheUtils.set(cacheKey, detail, CacheTTL.MEDIUM);
    return detail;
  }

  public async exportLogs(params: Omit<PermissionChangeLogQueryParams, 'page' | 'pageSize'>, fields: string[], sortBy: string, sortOrder: string): Promise<Buffer> {
    validateTimeRange(params.startTime, params.endTime);

    const rateLimitKey = `permission:change:export:${params.operatorId || 'all'}`;
    const lastExport = await CacheUtils.get<string>(rateLimitKey);
    if (lastExport) {
      throw new Error('导出操作过于频繁，请 60 秒后重试');
    }
    await CacheUtils.set(rateLimitKey, '1', 60);

    const logs = await permissionChangeLogDao.findAllForExport(params);

    const fieldMap: Record<string, string> = {
      id: 'ID',
      operatorName: '操作人',
      targetType: '目标类型',
      targetName: '目标名称',
      action: '操作类型',
      module: '所属模块',
      reason: '变更原因',
      affectedUserCount: '影响账号数',
      ip: 'IP地址',
      createdAt: '操作时间',
    };

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('权限变更记录');

    const columns = fields.map(f => ({ header: fieldMap[f] || f, key: f, width: 20 }));
    worksheet.columns = columns;

    const sortedLogs = [...logs].sort((a, b) => {
      const aVal = (a as any)[sortBy];
      const bVal = (b as any)[sortBy];
      if (sortOrder === 'desc') return aVal > bVal ? -1 : 1;
      return aVal < bVal ? -1 : 1;
    });

    for (const log of sortedLogs) {
      const row: any = {};
      for (const f of fields) {
        const val = (log as any)[f];
        if (f === 'targetType') {
          row[f] = val === 'role' ? '角色' : val === 'permission' ? '权限' : '用户';
        } else if (f === 'action') {
          const actionMap: Record<string, string> = {
            create: '创建', update: '编辑', delete: '删除',
            batch_assign: '批量分配', batch_revoke: '批量撤销', batch_copy: '批量复制',
          };
          row[f] = actionMap[val] || val;
        } else if (f === 'module') {
          const moduleMap: Record<string, string> = {
            system: '系统管理', channel: '渠道管理', promoter: '推客管理',
            order: '订单管理', commission: '佣金管理', marketing: '营销管理',
            withdraw: '提现管理', log: '日志管理', dashboard: '数据看板',
          };
          row[f] = moduleMap[val] || val;
        } else if (f === 'createdAt') {
          row[f] = new Date(val).toLocaleString('zh-CN');
        } else {
          row[f] = val !== undefined && val !== null ? String(val) : '';
        }
      }
      worksheet.addRow(row);
    }

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F4FF' } };

    return await workbook.xlsx.writeBuffer() as unknown as Buffer;
  }

  public async detectAnomalies(params: AnomalyDetectionParams): Promise<any> {
    const dedupKey = `permission:anomaly:query:${JSON.stringify(params)}`;
    const exists = await CacheUtils.exists(dedupKey);
    if (exists) {
      throw new Error('相同条件的溯源查询正在执行，请稍后再试');
    }
    await CacheUtils.set(dedupKey, '1', 10);

    try {
      const [highFreq, anomalies] = await Promise.all([
        permissionChangeLogDao.detectHighFrequencyOperations(params),
        permissionChangeLogDao.findAnomalyOperations(params),
      ]);

      const suspiciousIps = new Map<string, any[]>();
      for (const log of anomalies) {
        const key = `${log.operatorId}|${log.ip}`;
        if (!suspiciousIps.has(key)) suspiciousIps.set(key, []);
        suspiciousIps.get(key)!.push(log);
      }

      const suspiciousAccounts = Array.from(suspiciousIps.entries()).map(([key, logs]) => ({
        operatorId: logs[0].operatorId,
        operatorName: logs[0].operatorName,
        ip: logs[0].ip,
        userAgent: logs[0].userAgent,
        operationCount: logs.length,
        latestOperationTime: logs[0].createdAt,
        highRiskActions: logs.map(l => l.action).filter(a => ['delete', 'batch_revoke'].includes(a)),
      }));

      return {
        highFrequencyOperations: highFreq,
        suspiciousAccounts,
        anomalyCount: anomalies.length,
        highFrequencyCount: highFreq.length,
      };
    } finally {
      await CacheUtils.del(dedupKey);
    }
  }
}

export default new PermissionChangeLogService();
