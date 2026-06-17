"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PermissionChangeLog_dao_1 = __importDefault(require("../dao/PermissionChangeLog.dao"));
const cache_1 = __importStar(require("../utils/cache"));
const ExcelJS = __importStar(require("exceljs"));
const MAX_TIME_RANGE_DAYS = 90;
function validateTimeRange(startTime, endTime) {
    if (!startTime || !endTime)
        return;
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const diffDays = (end - start) / (1000 * 60 * 60 * 24);
    if (diffDays > MAX_TIME_RANGE_DAYS) {
        throw new Error(`时间区间不能超过 ${MAX_TIME_RANGE_DAYS} 天`);
    }
}
function compareObjects(before, after) {
    const changes = {};
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
    async logChange(data) {
        try {
            const changeData = { ...data };
            if (changeData.beforeData || changeData.afterData) {
                changeData.changedFields = compareObjects(changeData.beforeData, changeData.afterData);
            }
            await PermissionChangeLog_dao_1.default.create(changeData);
            cache_1.default.delPattern('permission:change:*');
        }
        catch (err) {
            console.error('Failed to log permission change:', err);
        }
    }
    async findAll(params) {
        const { page, pageSize } = params;
        validateTimeRange(params.startTime, params.endTime);
        const cacheKey = `permission:change:list:${JSON.stringify(params)}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const { rows, count } = await PermissionChangeLog_dao_1.default.findAllPaged(params);
        const result = { list: rows, total: count, page, pageSize, totalPages: Math.ceil(count / pageSize) };
        await cache_1.default.set(cacheKey, result, cache_1.CacheTTL.SHORT);
        return result;
    }
    async getDetail(id) {
        const cacheKey = `${cache_1.CacheKey.PERMISSION_DETAIL}${id}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const log = await PermissionChangeLog_dao_1.default.findById(id);
        if (!log)
            throw new Error('变更记录不存在');
        const detail = {
            ...log.toJSON(),
            changedFields: compareObjects(log.beforeData, log.afterData),
        };
        await cache_1.default.set(cacheKey, detail, cache_1.CacheTTL.MEDIUM);
        return detail;
    }
    async exportLogs(params, fields, sortBy, sortOrder) {
        validateTimeRange(params.startTime, params.endTime);
        const rateLimitKey = `permission:change:export:${params.operatorId || 'all'}`;
        const lastExport = await cache_1.default.get(rateLimitKey);
        if (lastExport) {
            throw new Error('导出操作过于频繁，请 60 秒后重试');
        }
        await cache_1.default.set(rateLimitKey, '1', 60);
        const logs = await PermissionChangeLog_dao_1.default.findAllForExport(params);
        const fieldMap = {
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
            const aVal = a[sortBy];
            const bVal = b[sortBy];
            if (sortOrder === 'desc')
                return aVal > bVal ? -1 : 1;
            return aVal < bVal ? -1 : 1;
        });
        for (const log of sortedLogs) {
            const row = {};
            for (const f of fields) {
                const val = log[f];
                if (f === 'targetType') {
                    row[f] = val === 'role' ? '角色' : val === 'permission' ? '权限' : '用户';
                }
                else if (f === 'action') {
                    const actionMap = {
                        create: '创建', update: '编辑', delete: '删除',
                        batch_assign: '批量分配', batch_revoke: '批量撤销', batch_copy: '批量复制',
                    };
                    row[f] = actionMap[val] || val;
                }
                else if (f === 'module') {
                    const moduleMap = {
                        system: '系统管理', channel: '渠道管理', promoter: '推客管理',
                        order: '订单管理', commission: '佣金管理', marketing: '营销管理',
                        withdraw: '提现管理', log: '日志管理', dashboard: '数据看板',
                    };
                    row[f] = moduleMap[val] || val;
                }
                else if (f === 'createdAt') {
                    row[f] = new Date(val).toLocaleString('zh-CN');
                }
                else {
                    row[f] = val !== undefined && val !== null ? String(val) : '';
                }
            }
            worksheet.addRow(row);
        }
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F4FF' } };
        return await workbook.xlsx.writeBuffer();
    }
    async detectAnomalies(params) {
        const dedupKey = `permission:anomaly:query:${JSON.stringify(params)}`;
        const exists = await cache_1.default.exists(dedupKey);
        if (exists) {
            throw new Error('相同条件的溯源查询正在执行，请稍后再试');
        }
        await cache_1.default.set(dedupKey, '1', 10);
        try {
            const [highFreq, anomalies] = await Promise.all([
                PermissionChangeLog_dao_1.default.detectHighFrequencyOperations(params),
                PermissionChangeLog_dao_1.default.findAnomalyOperations(params),
            ]);
            const suspiciousIps = new Map();
            for (const log of anomalies) {
                const key = `${log.operatorId}|${log.ip}`;
                if (!suspiciousIps.has(key))
                    suspiciousIps.set(key, []);
                suspiciousIps.get(key).push(log);
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
        }
        finally {
            await cache_1.default.del(dedupKey);
        }
    }
}
exports.default = new PermissionChangeLogService();
//# sourceMappingURL=PermissionChangeLog.service.js.map