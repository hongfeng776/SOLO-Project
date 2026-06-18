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
Object.defineProperty(exports, "__esModule", { value: true });
const dao_1 = require("../dao");
const statusCode_1 = require("../constants/statusCode");
const error_middleware_1 = require("../middleware/error.middleware");
const enum_1 = require("../constants/enum");
const cache_1 = __importStar(require("../utils/cache"));
const LEVEL_ORDER = [enum_1.PromoterLevel.L1, enum_1.PromoterLevel.L2, enum_1.PromoterLevel.L3, enum_1.PromoterLevel.L4, enum_1.PromoterLevel.L5];
const TOP_CORE_LEVEL = enum_1.PromoterLevel.L5;
const CORE_LEVELS = [enum_1.PromoterLevel.L4, enum_1.PromoterLevel.L5];
const MIN_GAP_FOR_ANOMALY = 50;
const MAX_DOWNGRADE_LEVELS = 2;
function getLevelIndex(level) {
    return LEVEL_ORDER.indexOf(level);
}
function parsePromoterMetrics(promoter) {
    return {
        monthlyAmount: Number(promoter.monthlyAmount || promoter.totalAmount || 0),
        monthlyOrders: Number(promoter.monthlyOrders || promoter.totalOrders || 0),
        activeDays: Number(promoter.activeDays || 0),
        reputationScore: Number(promoter.reputationScore ?? 100),
    };
}
class PromoterLevelService {
    async validateThresholds(level, metrics) {
        const rule = await this.getEffectiveRule(level);
        if (!rule) {
            throw new error_middleware_1.AppError('等级规则未配置', statusCode_1.BusinessCode.NOT_FOUND);
        }
        const failingFields = [];
        const fields = [
            { key: 'minMonthlyAmount', label: '推广业绩', value: metrics.monthlyAmount, threshold: Number(rule.minMonthlyAmount || 0) },
            { key: 'minMonthlyOrders', label: '订单量', value: metrics.monthlyOrders, threshold: Number(rule.minMonthlyOrders || 0) },
            { key: 'minActiveDays', label: '活跃度', value: metrics.activeDays, threshold: Number(rule.minActiveDays || 0) },
            { key: 'minReputationScore', label: '信誉分', value: metrics.reputationScore, threshold: Number(rule.minReputationScore || 0) },
        ];
        for (const f of fields) {
            if (f.value < f.threshold) {
                failingFields.push({
                    field: f.key,
                    label: f.label,
                    current: f.value,
                    required: f.threshold,
                    gap: f.threshold - f.value,
                });
            }
        }
        return {
            valid: failingFields.length === 0,
            failingFields,
        };
    }
    async getEffectiveRule(level) {
        const cacheKey = `level:rule:${level}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        let rule = await dao_1.promoterLevelRuleDao.findByLevel(level);
        if (!rule) {
            const fallback = enum_1.LEVEL_RULE_THRESHOLDS.find(t => t.level === level);
            const fallbackConfig = enum_1.PROMOTER_LEVEL_CONFIGS.find(c => c.level === level);
            rule = { ...fallback, ...fallbackConfig, level, levelName: `L${getLevelIndex(level) + 1}` };
        }
        await cache_1.default.set(cacheKey, rule, cache_1.CacheTTL.MEDIUM);
        return rule;
    }
    async getAllEffectiveRules() {
        const cacheKey = 'level:rules:all';
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const activeRules = await dao_1.promoterLevelRuleDao.findAllActive();
        const result = LEVEL_ORDER.map(level => {
            const rule = activeRules.find(r => r.level === level);
            if (rule)
                return rule;
            const fallback = enum_1.LEVEL_RULE_THRESHOLDS.find(t => t.level === level);
            const fallbackConfig = enum_1.PROMOTER_LEVEL_CONFIGS.find(c => c.level === level);
            return { ...fallback, ...fallbackConfig, level, levelName: `L${getLevelIndex(level) + 1}` };
        });
        await cache_1.default.set(cacheKey, result, cache_1.CacheTTL.MEDIUM);
        return result;
    }
    async saveLevelRule(ruleData, operatorId) {
        const fields = ['minMonthlyAmount', 'minMonthlyOrders', 'minActiveDays', 'minReputationScore'];
        for (const f of fields) {
            const v = Number(ruleData[f] ?? 0);
            if (isNaN(v) || v < 0) {
                throw new error_middleware_1.AppError(`${f}参数异常，必须为非负数`, statusCode_1.BusinessCode.PARAM_ERROR);
            }
        }
        const currentIdx = getLevelIndex(ruleData.level);
        if (currentIdx > 0) {
            const prevLevel = LEVEL_ORDER[currentIdx - 1];
            const prevRule = await this.getEffectiveRule(prevLevel);
            const checkPairs = [
                ['minMonthlyAmount', 'minMonthlyAmount'],
                ['minMonthlyOrders', 'minMonthlyOrders'],
                ['minActiveDays', 'minActiveDays'],
                ['minReputationScore', 'minReputationScore'],
            ];
            for (const [cur, prev] of checkPairs) {
                if (Number(ruleData[cur]) < Number(prevRule[prev] || 0)) {
                    throw new error_middleware_1.AppError(`${cur}阈值(${ruleData[cur]})不能低于上一级${prevLevel}的阈值(${prevRule[prev]})`, statusCode_1.BusinessCode.PARAM_ERROR);
                }
            }
        }
        if (ruleData.commissionRate !== undefined) {
            const rate = Number(ruleData.commissionRate);
            if (isNaN(rate) || rate < 0 || rate > 1) {
                throw new error_middleware_1.AppError('佣金比例必须在0到1之间', statusCode_1.BusinessCode.PARAM_ERROR);
            }
        }
        ruleData.updatedBy = operatorId;
        let result;
        const existing = await dao_1.promoterLevelRuleDao.findByLevel(ruleData.level);
        if (existing) {
            await dao_1.promoterLevelRuleDao.update(existing.id, ruleData);
            result = await dao_1.promoterLevelRuleDao.findByLevel(ruleData.level);
        }
        else {
            ruleData.createdBy = operatorId;
            result = await dao_1.promoterLevelRuleDao.create(ruleData);
        }
        await cache_1.default.delPattern('level:rule:*');
        await cache_1.default.delPattern('level:rules:*');
        return result;
    }
    async batchReEvaluateAllLevels(operatorId) {
        const allPromoters = await dao_1.promoterDao.findAll({
            where: { deletedAt: null },
        });
        const details = [];
        let regraded = 0;
        let skipped = 0;
        let failed = 0;
        for (const promoter of allPromoters) {
            try {
                if (promoter.isCorePromoter) {
                    skipped++;
                    details.push({
                        promoterId: promoter.id,
                        name: promoter.name,
                        code: promoter.code,
                        originalLevel: promoter.level,
                        newLevel: promoter.level,
                        changed: false,
                        metrics: parsePromoterMetrics(promoter),
                        reason: '顶级核心推客，禁止批量修改',
                    });
                    continue;
                }
                const result = await this.autoEvaluateSingleLevel(promoter, operatorId, enum_1.LevelChangeSource.RULE_CHANGE);
                details.push(result);
                if (result.changed)
                    regraded++;
                else
                    skipped++;
            }
            catch (err) {
                failed++;
                details.push({
                    promoterId: promoter.id,
                    name: promoter.name,
                    code: promoter.code,
                    originalLevel: promoter.level,
                    newLevel: promoter.level,
                    changed: false,
                    metrics: {},
                    reason: err.message,
                });
            }
        }
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
        return {
            total: allPromoters.length,
            regraded,
            skipped,
            failed,
            details,
        };
    }
    async autoEvaluateSingleLevel(promoter, operatorId, changeSource = enum_1.LevelChangeSource.AUTO) {
        const metrics = parsePromoterMetrics(promoter);
        const originalLevel = promoter.level;
        let highestValidLevel = enum_1.PromoterLevel.L1;
        for (const level of LEVEL_ORDER) {
            const validation = await this.validateThresholds(level, metrics);
            if (validation.valid) {
                highestValidLevel = level;
            }
            else {
                break;
            }
        }
        if (highestValidLevel === originalLevel) {
            return {
                promoterId: promoter.id,
                name: promoter.name,
                code: promoter.code,
                originalLevel,
                newLevel: originalLevel,
                changed: false,
                metrics,
            };
        }
        const operator = await dao_1.userDao.findById(operatorId);
        const operatorName = operator?.nickname || operator?.username || '系统';
        const compliance = await this.checkLevelChangeCompliance(promoter, originalLevel, highestValidLevel, metrics, changeSource);
        const levelChangedCount = Number(promoter.levelChangedCount || 0) + 1;
        await dao_1.promoterDao.update({
            level: highestValidLevel,
            levelChangedCount,
            lastLevelChangedAt: new Date(),
        }, { where: { id: promoter.id } });
        await dao_1.promoterLevelChangeLogDao.create({
            promoterId: promoter.id,
            changeSource,
            fromLevel: originalLevel,
            toLevel: highestValidLevel,
            operatorId,
            operatorName,
            metricsAtChange: JSON.stringify(metrics),
            meetsThreshold: true,
            changeReason: compliance.anomalyFlagged
                ? `[自动评级]${compliance.issues.join('；')}`
                : '自动评级：根据业绩/订单/活跃/信誉综合判定',
            complianceCheck: JSON.stringify(compliance),
            anomalyFlagged: compliance.anomalyFlagged,
            anomalyReason: compliance.anomalyReason,
            iterationCount: levelChangedCount,
        });
        await cache_1.default.del(`${cache_1.CacheKey.PROMOTER_DETAIL}${promoter.id}`);
        return {
            promoterId: promoter.id,
            name: promoter.name,
            code: promoter.code,
            originalLevel,
            newLevel: highestValidLevel,
            changed: true,
            metrics,
        };
    }
    async requestManualAdjust(promoterId, applicantId, targetLevel, adjustReason) {
        const promoter = await dao_1.promoterDao.findById(promoterId);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        const currentLevel = promoter.level;
        const targetIdx = getLevelIndex(targetLevel);
        const currentIdx = getLevelIndex(currentLevel);
        const metrics = parsePromoterMetrics(promoter);
        const thresholdCheck = await this.validateThresholds(targetLevel, metrics);
        const isUpgrade = targetIdx > currentIdx;
        const meetsThreshold = thresholdCheck.valid;
        if (isUpgrade && meetsThreshold) {
            const applicant = await dao_1.userDao.findById(applicantId);
            const result = await this.autoEvaluateSingleLevel(promoter, applicantId, enum_1.LevelChangeSource.MANUAL);
            await dao_1.promoterLevelAdjustRequestDao.create({
                promoterId,
                applicantId,
                applicantName: applicant?.nickname || applicant?.username || '-',
                fromLevel: currentLevel,
                toLevel: targetLevel,
                adjustReason: adjustReason || '(业绩达标，直接升级)',
                metricsSnapshot: JSON.stringify(metrics),
                meetsThreshold: true,
                approveStatus: enum_1.ManualLevelAdjustStatus.APPROVED,
                approverId: applicantId,
                approverName: '系统自动通过(业绩达标)',
                approvedAt: new Date(),
                syncedToFrontend: true,
            });
            return { autoApproved: true, result };
        }
        if (!adjustReason || adjustReason.trim().length < 5) {
            throw new error_middleware_1.AppError('未达标调整必须填写特殊调整理由(至少5个字)', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        const applicant = await dao_1.userDao.findById(applicantId);
        const request = await dao_1.promoterLevelAdjustRequestDao.create({
            promoterId,
            applicantId,
            applicantName: applicant?.nickname || applicant?.username || '-',
            fromLevel: currentLevel,
            toLevel: targetLevel,
            adjustReason: adjustReason.trim(),
            metricsSnapshot: JSON.stringify(metrics),
            meetsThreshold: false,
            approveStatus: enum_1.ManualLevelAdjustStatus.PENDING,
        });
        return { autoApproved: false, requestId: request.id, needsApproval: true };
    }
    async reviewManualAdjust(requestId, approverId, approved, approveRemark) {
        const request = await dao_1.promoterLevelAdjustRequestDao.findByPk(requestId);
        if (!request) {
            throw new error_middleware_1.AppError('调整申请不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        const req = request;
        if (req.approveStatus !== enum_1.ManualLevelAdjustStatus.PENDING) {
            throw new error_middleware_1.AppError('该申请已处理，不可重复审核', statusCode_1.BusinessCode.ERROR);
        }
        const approver = await dao_1.userDao.findById(approverId);
        const approverLevel = Number(approver?.accountLevel || enum_1.AccountLevel.OPERATOR);
        if (approverLevel >= enum_1.AccountLevel.OPERATOR && approverLevel < enum_1.AccountLevel.MANAGER) {
            throw new error_middleware_1.AppError('仅主管及以上角色可审核手动调整申请', statusCode_1.BusinessCode.FORBIDDEN);
        }
        const approverName = approver?.nickname || approver?.username || '-';
        if (approved) {
            const promoter = await dao_1.promoterDao.findById(req.promoterId);
            if (!promoter) {
                throw new error_middleware_1.AppError('推客不存在', statusCode_1.BusinessCode.NOT_FOUND);
            }
            const metrics = parsePromoterMetrics(promoter);
            const compliance = await this.checkLevelChangeCompliance(promoter, req.fromLevel, req.toLevel, metrics, enum_1.LevelChangeSource.MANUAL);
            const levelChangedCount = Number(promoter.levelChangedCount || 0) + 1;
            await dao_1.promoterDao.update({
                level: req.toLevel,
                levelChangedCount,
                lastLevelChangedAt: new Date(),
            }, { where: { id: req.promoterId } });
            await dao_1.promoterLevelChangeLogDao.create({
                promoterId: req.promoterId,
                changeSource: enum_1.LevelChangeSource.MANUAL,
                fromLevel: req.fromLevel,
                toLevel: req.toLevel,
                operatorId: approverId,
                operatorName: approverName,
                metricsAtChange: JSON.stringify(metrics),
                meetsThreshold: false,
                adjustRequestId: req.id,
                changeReason: approveRemark || req.adjustReason || '手动调整审核通过',
                complianceCheck: JSON.stringify(compliance),
                anomalyFlagged: compliance.anomalyFlagged,
                anomalyReason: compliance.anomalyReason,
                iterationCount: levelChangedCount,
            });
            await dao_1.promoterLevelAdjustRequestDao.update(req.id, {
                approveStatus: enum_1.ManualLevelAdjustStatus.APPROVED,
                approverId,
                approverName,
                approveRemark,
                approvedAt: new Date(),
                syncedToFrontend: true,
            });
            await cache_1.default.del(`${cache_1.CacheKey.PROMOTER_DETAIL}${req.promoterId}`);
        }
        else {
            await dao_1.promoterLevelAdjustRequestDao.update(req.id, {
                approveStatus: enum_1.ManualLevelAdjustStatus.REJECTED,
                approverId,
                approverName,
                approveRemark,
            });
        }
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
    }
    async batchResetLevels(ids, operatorId, resetTo = enum_1.PromoterLevel.L1) {
        const details = [];
        let regraded = 0;
        let skipped = 0;
        let failed = 0;
        const operator = await dao_1.userDao.findById(operatorId);
        const operatorName = operator?.nickname || operator?.username || '系统';
        for (const id of ids) {
            try {
                const promoter = await dao_1.promoterDao.findById(id);
                if (!promoter) {
                    skipped++;
                    details.push({ promoterId: id, name: '-', code: '-', originalLevel: '-', newLevel: '-', changed: false, metrics: {}, reason: '推客不存在' });
                    continue;
                }
                if (promoter.isCorePromoter || promoter.level === TOP_CORE_LEVEL) {
                    skipped++;
                    details.push({
                        promoterId: id,
                        name: promoter.name,
                        code: promoter.code,
                        originalLevel: promoter.level,
                        newLevel: promoter.level,
                        changed: false,
                        metrics: {},
                        reason: '顶级核心推客禁止批量重置',
                    });
                    continue;
                }
                if (CORE_LEVELS.includes(promoter.level)) {
                    skipped++;
                    details.push({
                        promoterId: id,
                        name: promoter.name,
                        code: promoter.code,
                        originalLevel: promoter.level,
                        newLevel: promoter.level,
                        changed: false,
                        metrics: {},
                        reason: 'L4及以上推客禁止批量重置，请单独操作',
                    });
                    continue;
                }
                if (promoter.level === resetTo) {
                    skipped++;
                    details.push({
                        promoterId: id,
                        name: promoter.name,
                        code: promoter.code,
                        originalLevel: promoter.level,
                        newLevel: promoter.level,
                        changed: false,
                        metrics: {},
                        reason: '等级未变化',
                    });
                    continue;
                }
                const metrics = parsePromoterMetrics(promoter);
                const compliance = await this.checkLevelChangeCompliance(promoter, promoter.level, resetTo, metrics, enum_1.LevelChangeSource.BATCH);
                const levelChangedCount = Number(promoter.levelChangedCount || 0) + 1;
                await dao_1.promoterDao.update({ level: resetTo, levelChangedCount, lastLevelChangedAt: new Date() }, { where: { id } });
                await dao_1.promoterLevelChangeLogDao.create({
                    promoterId: id,
                    changeSource: enum_1.LevelChangeSource.BATCH,
                    fromLevel: promoter.level,
                    toLevel: resetTo,
                    operatorId,
                    operatorName,
                    metricsAtChange: JSON.stringify(metrics),
                    meetsThreshold: resetTo === enum_1.PromoterLevel.L1,
                    changeReason: '批量重置等级',
                    complianceCheck: JSON.stringify(compliance),
                    anomalyFlagged: compliance.anomalyFlagged,
                    anomalyReason: compliance.anomalyReason,
                    iterationCount: levelChangedCount,
                });
                regraded++;
                details.push({
                    promoterId: id,
                    name: promoter.name,
                    code: promoter.code,
                    originalLevel: promoter.level,
                    newLevel: resetTo,
                    changed: true,
                    metrics,
                });
            }
            catch (err) {
                failed++;
                const promoter = await dao_1.promoterDao.findById(id);
                details.push({
                    promoterId: id,
                    name: promoter?.name || '-',
                    code: promoter?.code || '-',
                    originalLevel: promoter?.level || '-',
                    newLevel: promoter?.level || '-',
                    changed: false,
                    metrics: {},
                    reason: err.message,
                });
            }
        }
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
        return { total: ids.length, regraded, skipped, failed, details };
    }
    async checkLevelChangeCompliance(promoter, fromLevel, toLevel, metrics, changeSource) {
        const issues = [];
        let anomalyFlagged = false;
        let anomalyReason;
        const fromIdx = getLevelIndex(fromLevel);
        const toIdx = getLevelIndex(toLevel);
        const diff = Math.abs(toIdx - fromIdx);
        if (diff > MAX_DOWNGRADE_LEVELS && changeSource === enum_1.LevelChangeSource.AUTO) {
            anomalyFlagged = true;
            anomalyReason = `自动评级跨度过大(${fromLevel}→${toLevel})，疑似数据异常`;
            issues.push(anomalyReason);
        }
        if (changeSource === enum_1.LevelChangeSource.AUTO) {
            const validation = await this.validateThresholds(toLevel, metrics);
            if (!validation.valid) {
                anomalyFlagged = true;
                const msgs = validation.failingFields.map(f => `${f.label}差${f.gap}`).join('；');
                anomalyReason = `升级但未达标：${msgs}`;
                issues.push(anomalyReason);
            }
        }
        if (diff === 0) {
            issues.push('等级未变化');
        }
        if (promoter.riskFlagged && toIdx > fromIdx) {
            anomalyFlagged = true;
            anomalyReason = '存在风险标记的推客异常升级';
            issues.push(anomalyReason);
        }
        if (metrics.reputationScore < 60 && toIdx > fromIdx) {
            anomalyFlagged = true;
            anomalyReason = `信誉分${metrics.reputationScore}过低，禁止升级`;
            issues.push(anomalyReason);
        }
        return {
            compliant: !anomalyFlagged,
            issues,
            anomalyFlagged,
            anomalyReason,
        };
    }
    async getChangeLogs(promoterId, params) {
        const { page, pageSize } = params;
        const { rows, count } = await dao_1.promoterLevelChangeLogDao.findAllPaged({ promoterId, page, pageSize });
        return {
            list: rows.map((r) => ({
                ...r.get({ plain: true }),
                changeSourceLabel: enum_1.LEVEL_CHANGE_SOURCE_LABELS[r.changeSource] || r.changeSource,
            })),
            total: count,
            page,
            pageSize,
            totalPages: Math.ceil(count / pageSize),
        };
    }
    async getIterationStatistics(params) {
        const cacheKey = `level:iteration:stats:${params.startDate || ''}:${params.endDate || ''}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const allLogs = await dao_1.promoterLevelChangeLogDao.getIterationStats(params);
        const promoters = await dao_1.promoterDao.findAll({
            where: { deletedAt: null },
            attributes: ['id', 'level', 'levelChangedCount', 'lastLevelChangedAt'],
        });
        const distribution = {};
        LEVEL_ORDER.forEach(l => { distribution[l] = 0; });
        promoters.forEach((p) => { distribution[p.level] = (distribution[p.level] || 0) + 1; });
        const totalChanges = promoters.reduce((sum, p) => sum + Number(p.levelChangedCount || 0), 0);
        const maxIterationPromoter = promoters.reduce((max, p) => (!max || Number(p.levelChangedCount || 0) > Number(max.levelChangedCount || 0)) ? p : max, null);
        const result = {
            distribution,
            totalChangeEvents: allLogs?.total || 0,
            totalChanges,
            avgIterationsPerPromoter: promoters.length > 0 ? +(totalChanges / promoters.length).toFixed(2) : 0,
            maxIterationPromoter: maxIterationPromoter
                ? { id: maxIterationPromoter.id, count: Number(maxIterationPromoter.levelChangedCount || 0) }
                : null,
            anomaliesCount: allLogs?.anomalies || 0,
            totalPromoters: promoters.length,
        };
        await cache_1.default.set(cacheKey, result, cache_1.CacheTTL.SHORT);
        return result;
    }
    async getAdjustRequests(params) {
        const { page = 1, pageSize = 20, promoterId, approveStatus, applicantId } = params;
        const { rows, count } = await dao_1.promoterLevelAdjustRequestDao.findAllPaged({ page, pageSize, promoterId, approveStatus, applicantId });
        return {
            list: rows,
            total: count,
            page,
            pageSize,
            totalPages: Math.ceil(count / pageSize),
        };
    }
}
exports.default = new PromoterLevelService();
//# sourceMappingURL=PromoterLevel.service.js.map