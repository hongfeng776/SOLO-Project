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
const dao_1 = require("../dao");
const statusCode_1 = require("../constants/statusCode");
const error_middleware_1 = require("../middleware/error.middleware");
const enum_1 = require("../constants/enum");
const cache_1 = __importStar(require("../utils/cache"));
const sequelize_1 = require("sequelize");
const dayjs_1 = __importDefault(require("dayjs"));
class PromoterRiskService {
    async getRiskProfile(promoterId) {
        const cacheKey = `risk:profile:${promoterId}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const promoter = await dao_1.promoterDao.findById(promoterId);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        const now = new Date();
        const thirtyDaysAgo = (0, dayjs_1.default)().subtract(30, 'day').toDate();
        const sevenDaysAgo = (0, dayjs_1.default)().subtract(7, 'day').toDate();
        const activeRisk = await dao_1.promoterRiskRecordDao.findOne({
            where: { promoterId, isActive: true },
            order: [['createdAt', 'DESC']],
        });
        const recentWarnings = await dao_1.promoterRiskWarningDao.findAll({
            where: { promoterId, createdAt: { [sequelize_1.Op.gte]: thirtyDaysAgo } },
            order: [['createdAt', 'DESC']],
            limit: 10,
        });
        const behaviorCount = await dao_1.promoterRiskBehaviorDao.count({
            where: { promoterId, createdAt: { [sequelize_1.Op.gte]: thirtyDaysAgo } },
        });
        const allRisks = await dao_1.promoterRiskRecordDao.findAll({
            where: { promoterId, createdAt: { [sequelize_1.Op.gte]: thirtyDaysAgo } },
        });
        const abnormalOrders = await dao_1.orderDao.findAll({
            where: {
                promoterId,
                createdAt: { [sequelize_1.Op.gte]: sevenDaysAgo },
                status: { [sequelize_1.Op.in]: ['abnormal', 'cancelled', 'refunded'] },
            },
        });
        const complaints = await dao_1.promoterRiskBehaviorDao.count({
            where: { promoterId, behaviorType: 'complaint', createdAt: { [sequelize_1.Op.gte]: thirtyDaysAgo } },
        });
        const riskScore = this.calculateRiskScore(allRisks.length, abnormalOrders.length, complaints, activeRisk ? enum_1.RISK_LEVEL_LABELS[activeRisk.riskLevel] : null);
        const plainPromoter = promoter.get({ plain: true });
        const permissions = plainPromoter.riskControlPermissions
            ? JSON.parse(plainPromoter.riskControlPermissions)
            : null;
        const result = {
            riskControlStatus: plainPromoter.riskControlStatus ?? enum_1.RiskControlStatus.NORMAL,
            riskLevel: plainPromoter.riskLevel,
            riskType: plainPromoter.riskType,
            riskMarkedAt: plainPromoter.riskMarkedAt,
            riskExpireAt: plainPromoter.riskExpireAt,
            permissions: permissions || enum_1.RISK_CONTROL_PERMISSIONS[plainPromoter.riskLevel] || {
                canPromote: true, canJoinActivity: true, canWithdraw: true, canLogin: true,
            },
            activeRiskRecord: activeRisk ? activeRisk.get({ plain: true }) : null,
            recentWarnings: recentWarnings.map((w) => w.get({ plain: true })),
            behaviorCount30Days: behaviorCount,
            riskScore,
        };
        await cache_1.default.set(cacheKey, result, cache_1.CacheTTL.SHORT);
        return result;
    }
    async checkCanMarkRisk(promoterId, targetLevel) {
        const profile = await this.getRiskProfile(promoterId);
        const issues = [];
        if (profile.riskControlStatus !== enum_1.RiskControlStatus.NORMAL) {
            issues.push(`推客当前为「${enum_1.RISK_LEVEL_LABELS[profile.riskLevel]?.label || '风控中'}」状态，不可叠加风控`);
        }
        return {
            canMark: issues.length === 0,
            currentRisk: profile.activeRiskRecord,
            issues,
        };
    }
    async getPromoterRiskAnalysis(promoterId) {
        const promoter = await dao_1.promoterDao.findById(promoterId);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        const thirtyDaysAgo = (0, dayjs_1.default)().subtract(30, 'day').toDate();
        const sevenDaysAgo = (0, dayjs_1.default)().subtract(7, 'day').toDate();
        const promotionData = {
            totalOrders: Number(promoter.totalOrders || 0),
            totalAmount: Number(promoter.totalAmount || 0),
            monthlyOrders: Number(promoter.monthlyOrders || 0),
            monthlyAmount: Number(promoter.monthlyAmount || 0),
            lastActiveAt: promoter.lastActiveAt,
            activeDays: Number(promoter.activeDays || 0),
        };
        const recentOrders = await dao_1.orderDao.findAll({
            where: { promoterId, createdAt: { [sequelize_1.Op.gte]: thirtyDaysAgo } },
            attributes: ['id', 'status', 'amount', 'createdAt'],
        });
        const orderData = {
            last30Days: recentOrders.length,
            abnormal: recentOrders.filter((o) => ['abnormal', 'cancelled', 'refunded'].includes(o.status)).length,
            cancelled: recentOrders.filter((o) => o.status === 'cancelled').length,
            refunded: recentOrders.filter((o) => o.status === 'refunded').length,
            totalAmount: recentOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0),
        };
        const abnormalOrderCount = recentOrders.filter((o) => ['abnormal', 'cancelled', 'refunded'].includes(o.status)).length;
        const complaintCount = await dao_1.promoterRiskBehaviorDao.count({
            where: { promoterId, behaviorType: 'complaint', createdAt: { [sequelize_1.Op.gte]: thirtyDaysAgo } },
        });
        const riskHistory = await dao_1.promoterRiskRecordDao.findAll({
            where: { promoterId },
            order: [['createdAt', 'DESC']],
            limit: 10,
        });
        return {
            promotionData,
            orderData,
            complaintCount,
            abnormalOrderCount,
            riskHistory: riskHistory.map((r) => r.get({ plain: true })),
        };
    }
    async markRisk(promoterId, operatorId, data) {
        const checkResult = await this.checkCanMarkRisk(promoterId, data.riskLevel);
        if (!checkResult.canMark) {
            throw new error_middleware_1.AppError(checkResult.issues.join('；'), statusCode_1.BusinessCode.ERROR);
        }
        const analysis = await this.getPromoterRiskAnalysis(promoterId);
        const operator = await dao_1.userDao.findById(operatorId);
        const operatorName = operator?.nickname || operator?.username || '系统';
        const permissions = { ...enum_1.RISK_CONTROL_PERMISSIONS[data.riskLevel] };
        const controlStatusMap = {
            [enum_1.RiskLevel.MILD]: enum_1.RiskControlStatus.MILD_CONTROL,
            [enum_1.RiskLevel.MODERATE]: enum_1.RiskControlStatus.MODERATE_CONTROL,
            [enum_1.RiskLevel.SEVERE]: enum_1.RiskControlStatus.SEVERE_CONTROL,
        };
        const expireDate = data.expireAt ? new Date(data.expireAt) : undefined;
        const riskRecord = await dao_1.promoterRiskRecordDao.create({
            promoterId,
            riskLevel: data.riskLevel,
            riskType: data.riskType,
            riskTitle: data.riskTitle,
            riskDescription: data.riskDescription,
            riskEvidence: data.riskEvidence ? JSON.stringify(data.riskEvidence) : undefined,
            operatorId,
            operatorName,
            controlStatus: controlStatusMap[data.riskLevel],
            permissionsSnapshot: JSON.stringify(permissions),
            expireAt: expireDate,
            isActive: true,
        });
        await dao_1.promoterDao.update({
            riskControlStatus: controlStatusMap[data.riskLevel],
            riskLevel: data.riskLevel,
            riskType: data.riskType,
            riskMarkedAt: new Date(),
            riskMarkedBy: operatorId,
            riskMarkedReason: data.riskTitle,
            riskExpireAt: expireDate,
            riskControlPermissions: JSON.stringify(permissions),
            riskFlagged: true,
            riskReason: data.riskTitle,
        }, { where: { id: promoterId } });
        const hfCheck = await this.checkHighFrequency(promoterId);
        if (hfCheck.isHighFrequency) {
            await this.createWarning(promoterId, enum_1.RiskWarningLevel.HIGH, 'high_frequency_risk', '高频风险用户预警', hfCheck.warnings.join('；'), 'HF_RISK_AUTO', 95);
        }
        await cache_1.default.del(`risk:profile:${promoterId}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
        return riskRecord;
    }
    async cancelRisk(riskRecordId, operatorId) {
        const riskRecord = await dao_1.promoterRiskRecordDao.findByPk(riskRecordId);
        if (!riskRecord) {
            throw new error_middleware_1.AppError('风控记录不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        const record = riskRecord;
        if (!record.isActive) {
            throw new error_middleware_1.AppError('该风控已解除', statusCode_1.BusinessCode.ERROR);
        }
        const promoter = await dao_1.promoterDao.findById(record.promoterId);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        const operator = await dao_1.userDao.findById(operatorId);
        const operatorName = operator?.nickname || operator?.username || '系统';
        await dao_1.promoterRiskRecordDao.update(record.id, {
            isActive: false,
        });
        await dao_1.promoterDao.update({
            riskControlStatus: enum_1.RiskControlStatus.NORMAL,
            riskLevel: null,
            riskType: null,
            riskMarkedAt: null,
            riskMarkedBy: null,
            riskMarkedReason: null,
            riskExpireAt: null,
            riskControlPermissions: null,
            riskFlagged: false,
            riskReason: null,
        }, { where: { id: record.promoterId } });
        await cache_1.default.del(`risk:profile:${record.promoterId}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
    }
    async checkHighFrequency(promoterId) {
        const now = new Date();
        const thirtyDaysAgo = (0, dayjs_1.default)().subtract(30, 'day').toDate();
        const sevenDaysAgo = (0, dayjs_1.default)().subtract(7, 'day').toDate();
        const riskCount = await dao_1.promoterRiskRecordDao.count({
            where: { promoterId, createdAt: { [sequelize_1.Op.gte]: thirtyDaysAgo } },
        });
        const abnormalOrderCount = await dao_1.orderDao.count({
            where: {
                promoterId,
                createdAt: { [sequelize_1.Op.gte]: sevenDaysAgo },
                status: { [sequelize_1.Op.in]: ['abnormal', 'cancelled', 'refunded'] },
            },
        });
        const complaintCount = await dao_1.promoterRiskBehaviorDao.count({
            where: { promoterId, behaviorType: 'complaint', createdAt: { [sequelize_1.Op.gte]: thirtyDaysAgo } },
        });
        const warnings = [];
        if (riskCount >= enum_1.HIGH_FREQUENCY_THRESHOLD.riskCountIn30Days) {
            warnings.push(`30天内被风控${riskCount}次，超过阈值${enum_1.HIGH_FREQUENCY_THRESHOLD.riskCountIn30Days}次`);
        }
        if (abnormalOrderCount >= enum_1.HIGH_FREQUENCY_THRESHOLD.abnormalOrdersIn7Days) {
            warnings.push(`7天内异常订单${abnormalOrderCount}笔，超过阈值${enum_1.HIGH_FREQUENCY_THRESHOLD.abnormalOrdersIn7Days}笔`);
        }
        if (complaintCount >= enum_1.HIGH_FREQUENCY_THRESHOLD.complaintCountIn30Days) {
            warnings.push(`30天内被投诉${complaintCount}次，超过阈值${enum_1.HIGH_FREQUENCY_THRESHOLD.complaintCountIn30Days}次`);
        }
        return {
            isHighFrequency: warnings.length > 0,
            riskCount,
            abnormalOrderCount,
            complaintCount,
            warnings,
        };
    }
    async checkReleaseCompliance(promoterId, riskRecordId) {
        const profile = await this.getRiskProfile(promoterId);
        const issues = [];
        const abnormalDataRemaining = [];
        if (!profile.activeRiskRecord || profile.activeRiskRecord.id !== riskRecordId) {
            issues.push('当前风控记录不匹配');
        }
        const sevenDaysAgo = (0, dayjs_1.default)().subtract(7, 'day').toDate();
        const recentAbnormalOrders = await dao_1.orderDao.findAll({
            where: {
                promoterId,
                createdAt: { [sequelize_1.Op.gte]: sevenDaysAgo },
                status: { [sequelize_1.Op.in]: ['abnormal', 'cancelled', 'refunded'] },
            },
        });
        if (recentAbnormalOrders.length > 0) {
            abnormalDataRemaining.push(`近7天仍有${recentAbnormalOrders.length}笔异常订单未处理`);
        }
        const thirtyDaysAgo = (0, dayjs_1.default)().subtract(30, 'day').toDate();
        const recentComplaints = await dao_1.promoterRiskBehaviorDao.count({
            where: { promoterId, behaviorType: 'complaint', createdAt: { [sequelize_1.Op.gte]: thirtyDaysAgo } },
        });
        if (recentComplaints > 0) {
            abnormalDataRemaining.push(`近30天仍有${recentComplaints}起投诉未结案`);
        }
        return {
            passed: abnormalDataRemaining.length === 0,
            abnormalDataRemaining,
            issues,
        };
    }
    async submitRelease(promoterId, applicantId, data) {
        const promoter = await dao_1.promoterDao.findById(promoterId);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        const riskRecord = await dao_1.promoterRiskRecordDao.findByPk(data.riskRecordId);
        if (!riskRecord) {
            throw new error_middleware_1.AppError('风控记录不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (!data.releaseReason || data.releaseReason.trim().length < 10) {
            throw new error_middleware_1.AppError('解除风控理由至少10个字', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        const compliance = await this.checkReleaseCompliance(promoterId, data.riskRecordId);
        const applicant = await dao_1.userDao.findById(applicantId);
        const release = await dao_1.promoterRiskReleaseDao.create({
            promoterId,
            applicantId,
            applicantName: applicant?.nickname || applicant?.username || '-',
            riskRecordId: data.riskRecordId,
            releaseReason: data.releaseReason.trim(),
            proofMaterials: data.proofMaterials ? JSON.stringify(data.proofMaterials) : undefined,
            rectificationDesc: data.rectificationDesc,
            abnormalDataCleared: compliance.passed,
            verifyStatus: enum_1.RiskReleaseStatus.PENDING,
            restoreStage: 0,
        });
        await cache_1.default.del(`risk:profile:${promoterId}`);
        return release;
    }
    async reviewRelease(releaseId, reviewerId, data) {
        const release = await dao_1.promoterRiskReleaseDao.findByPk(releaseId);
        if (!release) {
            throw new error_middleware_1.AppError('解除申请不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        const rel = release;
        if (rel.verifyStatus !== enum_1.RiskReleaseStatus.PENDING) {
            throw new error_middleware_1.AppError('该申请已处理，不可重复审核', statusCode_1.BusinessCode.ERROR);
        }
        const reviewer = await dao_1.userDao.findById(reviewerId);
        const reviewerName = reviewer?.nickname || reviewer?.username || '系统';
        if (data.passed) {
            const compliance = await this.checkReleaseCompliance(rel.promoterId, rel.riskRecordId);
            if (!compliance.passed && !(data.restoreStage && data.restoreStage > 0)) {
                throw new error_middleware_1.AppError('异常数据未清零：' + compliance.abnormalDataRemaining.join('；'), statusCode_1.BusinessCode.ERROR);
            }
            const targetStage = data.restoreStage ?? 5;
            if (targetStage >= 5) {
                await this.cancelRisk(rel.riskRecordId, reviewerId);
            }
            else {
                const permissions = this.calculateStagePermissions(targetStage);
                await dao_1.promoterDao.update({ riskControlPermissions: JSON.stringify(permissions) }, { where: { id: rel.promoterId } });
            }
            await dao_1.promoterRiskReleaseDao.update(rel.id, {
                verifyStatus: enum_1.RiskReleaseStatus.APPROVED,
                verifierId: reviewerId,
                verifierName: reviewerName,
                verifyRemark: data.verifyRemark,
                verifiedAt: new Date(),
                restoreStage: targetStage,
            });
            await dao_1.promoterRiskRecordDao.update(rel.riskRecordId, {
                permissionsSnapshot: JSON.stringify(this.calculateStagePermissions(targetStage)),
            });
        }
        else {
            await dao_1.promoterRiskReleaseDao.update(rel.id, {
                verifyStatus: enum_1.RiskReleaseStatus.REJECTED,
                verifierId: reviewerId,
                verifierName: reviewerName,
                verifyRemark: data.verifyRemark,
                verifiedAt: new Date(),
            });
        }
        await cache_1.default.del(`risk:profile:${rel.promoterId}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
    }
    calculateStagePermissions(stage) {
        const base = { canPromote: true, canJoinActivity: true, canWithdraw: true, canLogin: true };
        if (stage <= 1)
            return { ...base, canWithdraw: false, canJoinActivity: false };
        if (stage === 2)
            return { ...base, canJoinActivity: false };
        if (stage === 3)
            return { ...base, canJoinActivity: false, canWithdraw: true };
        if (stage === 4)
            return { ...base };
        return base;
    }
    async batchMarkRisk(ids, operatorId, data) {
        const details = [];
        let success = 0;
        let skipped = 0;
        let failed = 0;
        for (const id of ids) {
            try {
                const promoter = await dao_1.promoterDao.findById(id);
                if (!promoter) {
                    skipped++;
                    details.push({ id, name: '-', status: 'skipped', reason: '推客不存在' });
                    continue;
                }
                const profile = await this.getRiskProfile(id);
                if (profile.riskControlStatus !== enum_1.RiskControlStatus.NORMAL) {
                    skipped++;
                    details.push({
                        id,
                        name: promoter.name,
                        status: 'skipped',
                        reason: `当前已是「${enum_1.RISK_LEVEL_LABELS[profile.riskLevel]?.label}」状态`,
                    });
                    continue;
                }
                if (promoter.isCorePromoter) {
                    skipped++;
                    details.push({
                        id,
                        name: promoter.name,
                        status: 'skipped',
                        reason: '核心推客禁止批量风控，请单独操作',
                    });
                    continue;
                }
                const analysis = await this.getPromoterRiskAnalysis(id);
                let autoType = data.riskType;
                if (data.riskType === enum_1.RiskType.OTHER) {
                    if (analysis.abnormalOrderCount > analysis.complaintCount) {
                        autoType = analysis.complaintCount > 0 ? enum_1.RiskType.COMPLAINT : enum_1.RiskType.BRUSH_ORDER;
                    }
                }
                await this.markRisk(id, operatorId, { ...data, riskType: autoType });
                success++;
                details.push({ id, name: promoter.name, status: 'success' });
            }
            catch (err) {
                failed++;
                const promoter = await dao_1.promoterDao.findById(id);
                details.push({
                    id,
                    name: promoter?.name || '-',
                    status: 'failed',
                    reason: err.message,
                });
            }
        }
        return { total: ids.length, success, skipped, failed, details };
    }
    async batchCancelRisk(ids, operatorId) {
        const details = [];
        let success = 0;
        let skipped = 0;
        let failed = 0;
        for (const id of ids) {
            try {
                const activeRisk = await dao_1.promoterRiskRecordDao.findOne({
                    where: { promoterId: id, isActive: true },
                    order: [['createdAt', 'DESC']],
                });
                if (!activeRisk) {
                    skipped++;
                    const promoter = await dao_1.promoterDao.findById(id);
                    details.push({
                        id,
                        name: promoter?.name || '-',
                        status: 'skipped',
                        reason: '推客当前无有效风控',
                    });
                    continue;
                }
                await this.cancelRisk(activeRisk.id, operatorId);
                const promoter = await dao_1.promoterDao.findById(id);
                success++;
                details.push({ id, name: promoter?.name || '-', status: 'success' });
            }
            catch (err) {
                failed++;
                const promoter = await dao_1.promoterDao.findById(id);
                details.push({
                    id,
                    name: promoter?.name || '-',
                    status: 'failed',
                    reason: err.message,
                });
            }
        }
        return { total: ids.length, success, skipped, failed, details };
    }
    async createWarning(promoterId, warningLevel, warningType, warningTitle, warningDesc, ruleCode, riskScore) {
        const existing = await dao_1.promoterRiskWarningDao.findOne({
            where: { promoterId, ruleCode, isHandled: false },
        });
        if (existing)
            return existing;
        return dao_1.promoterRiskWarningDao.create({
            promoterId,
            warningLevel,
            warningType,
            warningTitle,
            warningDesc,
            ruleCode,
            riskScore,
            isHandled: false,
        });
    }
    async getBehaviorTrace(promoterId, params) {
        const { page, pageSize } = params;
        const where = { promoterId };
        if (params.behaviorType)
            where.behaviorType = params.behaviorType;
        if (params.riskFlagged !== undefined)
            where.riskFlagged = params.riskFlagged;
        if (params.startDate)
            where.createdAt = { ...where.createdAt, [sequelize_1.Op.gte]: new Date(params.startDate) };
        if (params.endDate)
            where.createdAt = { ...where.createdAt, [sequelize_1.Op.lte]: new Date(params.endDate) };
        const { rows, count } = await dao_1.promoterRiskBehaviorDao.findAllPaged({ where, page, pageSize, order: [['createdAt', 'DESC']] });
        return {
            list: rows.map((r) => r.get({ plain: true })),
            total: count,
            page,
            pageSize,
            totalPages: Math.ceil(count / pageSize),
        };
    }
    async getRiskList(params) {
        const { page, pageSize } = params;
        const where = {};
        if (params.riskLevel)
            where.riskLevel = params.riskLevel;
        if (params.riskType)
            where.riskType = params.riskType;
        if (params.controlStatus !== undefined)
            where.controlStatus = params.controlStatus;
        if (params.isActive !== undefined)
            where.isActive = params.isActive;
        const { rows, count } = await dao_1.promoterRiskRecordDao.findAllPaged({ where, page, pageSize, order: [['createdAt', 'DESC']], include: [{ association: 'promoter', attributes: ['id', 'name', 'code', 'phone'] }] });
        return {
            list: rows.map((r) => r.get({ plain: true })),
            total: count,
            page,
            pageSize,
            totalPages: Math.ceil(count / pageSize),
        };
    }
    async getStatistics(params) {
        const cacheKey = `risk:stats:${params?.startDate || ''}:${params?.endDate || ''}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const dateWhere = {};
        if (params?.startDate)
            dateWhere.createdAt = { [sequelize_1.Op.gte]: new Date(params.startDate) };
        if (params?.endDate)
            dateWhere.createdAt = { ...dateWhere.createdAt, [sequelize_1.Op.lte]: new Date(params.endDate) };
        const distribution = { mild: 0, moderate: 0, severe: 0 };
        const records = await dao_1.promoterRiskRecordDao.findAll({ where: { ...dateWhere, isActive: true } });
        records.forEach((r) => {
            const lvl = r.riskLevel;
            distribution[lvl] = (distribution[lvl] || 0) + 1;
        });
        const totalControlled = records.length;
        const pendingReleases = await dao_1.promoterRiskReleaseDao.count({ where: { verifyStatus: enum_1.RiskReleaseStatus.PENDING } });
        const activeWarnings = await dao_1.promoterRiskWarningDao.count({ where: { isHandled: false } });
        const thirtyDaysAgo = (0, dayjs_1.default)().subtract(30, 'day').toDate();
        const allPromoters = await dao_1.promoterDao.findAll({ where: { deletedAt: null } });
        const highFrequencyList = [];
        for (const p of allPromoters) {
            const hf = await this.checkHighFrequency(p.id);
            if (hf.isHighFrequency) {
                highFrequencyList.push({
                    promoterId: p.id,
                    name: p.name,
                    code: p.code,
                    riskCount: hf.riskCount,
                    abnormalOrderCount: hf.abnormalOrderCount,
                    complaintCount: hf.complaintCount,
                });
            }
        }
        const result = {
            distribution,
            totalControlled,
            pendingReleases,
            activeWarnings,
            highFrequencyList: highFrequencyList.sort((a, b) => b.riskCount + b.abnormalOrderCount * 2 - (a.riskCount + a.abnormalOrderCount * 2)).slice(0, 10),
        };
        await cache_1.default.set(cacheKey, result, cache_1.CacheTTL.SHORT);
        return result;
    }
    calculateRiskScore(riskCount, abnormalOrders, complaints, currentLevel) {
        let score = 0;
        score += riskCount * 15;
        score += abnormalOrders * 3;
        score += complaints * 20;
        if (currentLevel) {
            score += currentLevel.label === '轻度风控' ? 30 : currentLevel.label === '中度风控' ? 60 : 90;
        }
        return Math.min(100, score);
    }
}
exports.default = new PromoterRiskService();
//# sourceMappingURL=PromoterRisk.service.js.map