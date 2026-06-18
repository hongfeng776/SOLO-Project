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
const crypto_1 = require("crypto");
const dao_1 = require("../dao");
const statusCode_1 = require("../constants/statusCode");
const error_middleware_1 = require("../middleware/error.middleware");
const enum_1 = require("../constants/enum");
const cache_1 = __importStar(require("../utils/cache"));
const LOCK_WINDOW_DAYS = 7;
const PHONE_REGEX = /^1[3-9]\d{9}$/;
const ID_CARD_REGEX = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
function validatePhone(phone) {
    return PHONE_REGEX.test(phone);
}
function validateIdCard(idCard) {
    if (!ID_CARD_REGEX.test(idCard))
        return false;
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    let sum = 0;
    for (let i = 0; i < 17; i++) {
        sum += parseInt(idCard.charAt(i), 10) * weights[i];
    }
    const expectedCode = checkCodes[sum % 11];
    const actualCode = idCard.charAt(17).toUpperCase();
    return expectedCode === actualCode;
}
function calculateDataHash(data) {
    const keys = Object.keys(data).sort();
    const str = keys.map((k) => `${k}:${data[k] ?? ''}`).join('|');
    return (0, crypto_1.createHash)('sha256').update(str).digest('hex');
}
function getRemainingHours(lockUntil) {
    const now = Date.now();
    const diff = lockUntil.getTime() - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
}
class PromoterAuditService {
    async preCheckApplyData(data, promoterId) {
        const result = {
            valid: true,
            errors: [],
            riskFlags: [],
        };
        const requiredFields = ['name', 'phone'];
        const missingFields = requiredFields.filter((f) => !data[f] || String(data[f]).trim() === '');
        if (missingFields.length > 0) {
            result.valid = false;
            result.dataIntegrity = { missingFields };
            result.errors.push(`缺少必填字段：${missingFields.join('、')}`);
        }
        if (data.phone) {
            if (!validatePhone(data.phone)) {
                result.valid = false;
                result.errors.push('手机号格式不正确');
            }
            else {
                const phoneExists = await dao_1.promoterDao.existsByPhone(data.phone, promoterId);
                if (phoneExists) {
                    result.valid = false;
                    result.errors.push('手机号已被其他推客使用');
                    result.riskFlags.push('手机号重复');
                }
            }
        }
        if (data.idCard) {
            if (!validateIdCard(data.idCard)) {
                result.valid = false;
                result.errors.push('身份证号码格式不正确或校验位错误');
                result.riskFlags.push('身份证信息异常');
            }
            else {
                const idCardExists = await dao_1.promoterDao.existsByIdCard(data.idCard, promoterId);
                if (idCardExists) {
                    result.valid = false;
                    result.errors.push('身份证号已被其他推客使用');
                    result.riskFlags.push('身份证重复');
                }
            }
        }
        const blacklistResult = await dao_1.promoterBlacklistDao.checkMatch({
            phone: data.phone,
            idCard: data.idCard,
            name: data.name,
            wechatId: data.wechatId,
        });
        if (blacklistResult.matched) {
            result.valid = false;
            result.blacklistMatched = { items: blacklistResult.items };
            result.errors.push('申请信息匹配黑名单记录，已被拦截');
            result.riskFlags.push('黑名单匹配');
        }
        const lockStatus = await dao_1.promoterDao.checkLockStatus(data.phone, data.idCard);
        if (lockStatus.locked && lockStatus.lockUntil) {
            result.valid = false;
            result.lockInfo = {
                locked: true,
                lockUntil: lockStatus.lockUntil,
                remainingHours: getRemainingHours(lockStatus.lockUntil),
            };
            result.errors.push(`当前账号处于锁定状态，剩余锁定时间约 ${result.lockInfo.remainingHours} 小时`);
        }
        return result;
    }
    async submitApply(data) {
        const preCheck = await this.preCheckApplyData(data);
        if (!preCheck.valid) {
            throw new error_middleware_1.AppError(preCheck.errors.join('；'), statusCode_1.BusinessCode.PARAM_ERROR);
        }
        const existingByPhone = await dao_1.promoterDao.findByPhone(data.phone);
        if (existingByPhone) {
            const applyCount = (existingByPhone.applyCount || 0) + 1;
            const newHash = calculateDataHash({
                name: data.name,
                phone: data.phone,
                idCard: data.idCard,
                wechatId: data.wechatId,
                channelId: data.channelId,
            });
            const hashChanged = existingByPhone.dataHash && existingByPhone.dataHash !== newHash;
            const riskFlagged = hashChanged;
            const riskReason = hashChanged ? '申请信息与历史记录不一致，存在篡改痕迹' : undefined;
            await dao_1.promoterDao.update({
                ...data,
                auditStage: enum_1.AuditStage.FIRST_AUDIT,
                auditStatus: enum_1.AuditStatus.FIRST_AUDITING,
                status: enum_1.PromoterStatus.PENDING,
                applyCount,
                lastApplyAt: new Date(),
                dataHash: newHash,
                riskFlagged,
                riskReason,
                rejectReasonCode: undefined,
                rejectCustomRemark: undefined,
                rejectedAt: undefined,
                firstAuditorId: undefined,
                firstAuditAt: undefined,
                firstAuditRemark: undefined,
                secondAuditorId: undefined,
                secondAuditAt: undefined,
                secondAuditRemark: undefined,
            }, { where: { id: existingByPhone.id } });
            await dao_1.promoterAuditLogDao.create({
                promoterId: existingByPhone.id,
                action: enum_1.AuditAction.SUBMIT,
                fromStage: existingByPhone.auditStage,
                toStage: enum_1.AuditStage.FIRST_AUDIT,
                fromStatus: existingByPhone.auditStatus,
                toStatus: enum_1.AuditStatus.FIRST_AUDITING,
                metadata: JSON.stringify({
                    applyCount,
                    hashChanged,
                    riskFlagged,
                }),
            });
            await cache_1.default.del(`${cache_1.CacheKey.PROMOTER_DETAIL}${existingByPhone.id}`);
            await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
            return dao_1.promoterDao.findById(existingByPhone.id);
        }
        const code = await this.generateCode();
        const dataHash = calculateDataHash({
            name: data.name,
            phone: data.phone,
            idCard: data.idCard,
            wechatId: data.wechatId,
            channelId: data.channelId,
        });
        const promoter = await dao_1.promoterDao.create({
            ...data,
            code,
            level: data.level || 'L1',
            status: enum_1.PromoterStatus.PENDING,
            auditStage: enum_1.AuditStage.FIRST_AUDIT,
            auditStatus: enum_1.AuditStatus.FIRST_AUDITING,
            registerAt: new Date(),
            lastApplyAt: new Date(),
            applyCount: 1,
            dataHash,
        });
        await dao_1.promoterAuditLogDao.create({
            promoterId: promoter.id,
            action: enum_1.AuditAction.SUBMIT,
            fromStage: enum_1.AuditStage.PENDING_SUBMIT,
            toStage: enum_1.AuditStage.FIRST_AUDIT,
            fromStatus: enum_1.AuditStatus.PENDING,
            toStatus: enum_1.AuditStatus.FIRST_AUDITING,
            metadata: JSON.stringify({ firstApply: true }),
        });
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
        return promoter;
    }
    async generateCode() {
        const date = new Date();
        const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const todayCount = await dao_1.promoterDao.getTodayCount();
        const seq = String(todayCount + 1).padStart(6, '0');
        const code = `P${dateStr}${seq}`;
        const exists = await dao_1.promoterDao.existsByCode(code);
        if (exists) {
            return this.generateCode();
        }
        return code;
    }
    async firstAuditPass(id, auditUserId, remark) {
        const promoter = await dao_1.promoterDao.findById(id);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客申请不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (promoter.auditStage !== enum_1.AuditStage.FIRST_AUDIT) {
            throw new error_middleware_1.AppError(`当前审核阶段为「${this.getStageLabel(promoter.auditStage)}」，不可执行初审通过操作`, statusCode_1.BusinessCode.ERROR);
        }
        if (promoter.auditStatus !== enum_1.AuditStatus.FIRST_AUDITING) {
            throw new error_middleware_1.AppError(`当前审核状态为「${this.getStatusLabel(promoter.auditStatus)}」，不可执行初审通过操作`, statusCode_1.BusinessCode.ERROR);
        }
        const auditor = await dao_1.userDao.findById(auditUserId);
        await dao_1.promoterDao.update({
            auditStage: enum_1.AuditStage.SECOND_AUDIT,
            auditStatus: enum_1.AuditStatus.SECOND_AUDITING,
            firstAuditorId: auditUserId,
            firstAuditAt: new Date(),
            firstAuditRemark: remark,
        }, { where: { id } });
        await dao_1.promoterAuditLogDao.create({
            promoterId: id,
            action: enum_1.AuditAction.FIRST_PASS,
            fromStage: enum_1.AuditStage.FIRST_AUDIT,
            toStage: enum_1.AuditStage.SECOND_AUDIT,
            fromStatus: enum_1.AuditStatus.FIRST_AUDITING,
            toStatus: enum_1.AuditStatus.SECOND_AUDITING,
            operatorId: auditUserId,
            operatorName: auditor?.nickname || auditor?.username || '系统',
            remark,
        });
        await cache_1.default.del(`${cache_1.CacheKey.PROMOTER_DETAIL}${id}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
    }
    async firstAuditReject(id, auditUserId, rejectData) {
        const promoter = await dao_1.promoterDao.findById(id);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客申请不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (promoter.auditStage !== enum_1.AuditStage.FIRST_AUDIT) {
            throw new error_middleware_1.AppError(`当前审核阶段为「${this.getStageLabel(promoter.auditStage)}」，不可执行初审驳回操作`, statusCode_1.BusinessCode.ERROR);
        }
        const validReason = enum_1.REJECT_REASONS.find((r) => r.code === rejectData.reasonCode);
        if (!validReason) {
            throw new error_middleware_1.AppError('驳回原因代码无效', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        const auditor = await dao_1.userDao.findById(auditUserId);
        const lockDays = rejectData.lockDays ?? LOCK_WINDOW_DAYS;
        const lockUntil = new Date();
        lockUntil.setDate(lockUntil.getDate() + lockDays);
        await dao_1.promoterDao.update({
            auditStage: enum_1.AuditStage.REJECTED,
            auditStatus: enum_1.AuditStatus.REJECTED,
            status: enum_1.PromoterStatus.REJECTED,
            firstAuditorId: auditUserId,
            firstAuditAt: new Date(),
            firstAuditRemark: rejectData.customRemark,
            rejectReasonCode: rejectData.reasonCode,
            rejectCustomRemark: rejectData.customRemark,
            rejectedAt: new Date(),
            lockUntil,
        }, { where: { id } });
        await dao_1.promoterAuditLogDao.create({
            promoterId: id,
            action: enum_1.AuditAction.FIRST_REJECT,
            fromStage: enum_1.AuditStage.FIRST_AUDIT,
            toStage: enum_1.AuditStage.REJECTED,
            fromStatus: enum_1.AuditStatus.FIRST_AUDITING,
            toStatus: enum_1.AuditStatus.REJECTED,
            operatorId: auditUserId,
            operatorName: auditor?.nickname || auditor?.username || '系统',
            remark: `[${validReason.label}] ${rejectData.customRemark || ''}`.trim(),
            rejectReasonCode: rejectData.reasonCode,
            rejectCustomRemark: rejectData.customRemark,
            metadata: JSON.stringify({ lockDays, lockUntil }),
        });
        await this.sendRejectNotification(promoter, validReason.label, rejectData.customRemark, lockUntil);
        await cache_1.default.del(`${cache_1.CacheKey.PROMOTER_DETAIL}${id}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
    }
    async secondAuditPass(id, auditUserId, remark) {
        const promoter = await dao_1.promoterDao.findById(id);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客申请不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (promoter.auditStage !== enum_1.AuditStage.SECOND_AUDIT) {
            throw new error_middleware_1.AppError(`当前审核阶段为「${this.getStageLabel(promoter.auditStage)}」，不可执行复审通过操作`, statusCode_1.BusinessCode.ERROR);
        }
        if (promoter.auditStatus !== enum_1.AuditStatus.SECOND_AUDITING) {
            throw new error_middleware_1.AppError(`当前审核状态为「${this.getStatusLabel(promoter.auditStatus)}」，不可执行复审通过操作`, statusCode_1.BusinessCode.ERROR);
        }
        const auditor = await dao_1.userDao.findById(auditUserId);
        await dao_1.promoterDao.update({
            auditStage: enum_1.AuditStage.COMPLETED,
            auditStatus: enum_1.AuditStatus.PASSED,
            status: enum_1.PromoterStatus.NORMAL,
            secondAuditorId: auditUserId,
            secondAuditAt: new Date(),
            secondAuditRemark: remark,
        }, { where: { id } });
        await dao_1.promoterAuditLogDao.create({
            promoterId: id,
            action: enum_1.AuditAction.SECOND_PASS,
            fromStage: enum_1.AuditStage.SECOND_AUDIT,
            toStage: enum_1.AuditStage.COMPLETED,
            fromStatus: enum_1.AuditStatus.SECOND_AUDITING,
            toStatus: enum_1.AuditStatus.PASSED,
            operatorId: auditUserId,
            operatorName: auditor?.nickname || auditor?.username || '系统',
            remark,
        });
        await cache_1.default.del(`${cache_1.CacheKey.PROMOTER_DETAIL}${id}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
    }
    async secondAuditReject(id, auditUserId, rejectData) {
        const promoter = await dao_1.promoterDao.findById(id);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客申请不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (promoter.auditStage !== enum_1.AuditStage.SECOND_AUDIT) {
            throw new error_middleware_1.AppError(`当前审核阶段为「${this.getStageLabel(promoter.auditStage)}」，不可执行复审驳回操作`, statusCode_1.BusinessCode.ERROR);
        }
        const validReason = enum_1.REJECT_REASONS.find((r) => r.code === rejectData.reasonCode);
        if (!validReason) {
            throw new error_middleware_1.AppError('驳回原因代码无效', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        const auditor = await dao_1.userDao.findById(auditUserId);
        const lockDays = rejectData.lockDays ?? LOCK_WINDOW_DAYS;
        const lockUntil = new Date();
        lockUntil.setDate(lockUntil.getDate() + lockDays);
        await dao_1.promoterDao.update({
            auditStage: enum_1.AuditStage.REJECTED,
            auditStatus: enum_1.AuditStatus.REJECTED,
            status: enum_1.PromoterStatus.REJECTED,
            secondAuditorId: auditUserId,
            secondAuditAt: new Date(),
            secondAuditRemark: rejectData.customRemark,
            rejectReasonCode: rejectData.reasonCode,
            rejectCustomRemark: rejectData.customRemark,
            rejectedAt: new Date(),
            lockUntil,
        }, { where: { id } });
        await dao_1.promoterAuditLogDao.create({
            promoterId: id,
            action: enum_1.AuditAction.SECOND_REJECT,
            fromStage: enum_1.AuditStage.SECOND_AUDIT,
            toStage: enum_1.AuditStage.REJECTED,
            fromStatus: enum_1.AuditStatus.SECOND_AUDITING,
            toStatus: enum_1.AuditStatus.REJECTED,
            operatorId: auditUserId,
            operatorName: auditor?.nickname || auditor?.username || '系统',
            remark: `[${validReason.label}] ${rejectData.customRemark || ''}`.trim(),
            rejectReasonCode: rejectData.reasonCode,
            rejectCustomRemark: rejectData.customRemark,
            metadata: JSON.stringify({ lockDays, lockUntil }),
        });
        await this.sendRejectNotification(promoter, validReason.label, rejectData.customRemark, lockUntil);
        await cache_1.default.del(`${cache_1.CacheKey.PROMOTER_DETAIL}${id}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
    }
    async batchFirstPass(ids, auditUserId) {
        return this.batchAudit(ids, auditUserId, 'firstPass');
    }
    async batchSecondPass(ids, auditUserId) {
        return this.batchAudit(ids, auditUserId, 'secondPass');
    }
    async batchFirstReject(ids, auditUserId, rejectData) {
        return this.batchAudit(ids, auditUserId, 'firstReject', rejectData);
    }
    async batchSecondReject(ids, auditUserId, rejectData) {
        return this.batchAudit(ids, auditUserId, 'secondReject', rejectData);
    }
    async batchAudit(ids, auditUserId, operation, rejectData) {
        if (!ids || ids.length === 0) {
            throw new error_middleware_1.AppError('请选择要操作的记录', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        const result = {
            total: ids.length,
            success: 0,
            failed: 0,
            skipped: 0,
            details: [],
        };
        for (const id of ids) {
            try {
                const promoter = await dao_1.promoterDao.findById(id);
                if (!promoter) {
                    result.skipped++;
                    result.details.push({ id, name: '-', phone: '-', status: 'skipped', reason: '记录不存在' });
                    continue;
                }
                const blacklistCheck = await dao_1.promoterBlacklistDao.checkMatch({
                    phone: promoter.phone,
                    idCard: promoter.idCard,
                    name: promoter.name,
                });
                if (blacklistCheck.matched && (operation === 'firstPass' || operation === 'secondPass')) {
                    result.skipped++;
                    result.details.push({
                        id,
                        name: promoter.name,
                        phone: promoter.phone || '-',
                        status: 'skipped',
                        reason: '匹配黑名单记录，已跳过',
                    });
                    continue;
                }
                if (promoter.riskFlagged && (operation === 'firstPass' || operation === 'secondPass')) {
                    result.skipped++;
                    result.details.push({
                        id,
                        name: promoter.name,
                        phone: promoter.phone || '-',
                        status: 'skipped',
                        reason: promoter.riskReason || '存在风险标记，已跳过',
                    });
                    continue;
                }
                const expectedStage = operation.startsWith('first') ? enum_1.AuditStage.FIRST_AUDIT : enum_1.AuditStage.SECOND_AUDIT;
                if (promoter.auditStage !== expectedStage) {
                    result.skipped++;
                    result.details.push({
                        id,
                        name: promoter.name,
                        phone: promoter.phone || '-',
                        status: 'skipped',
                        reason: `审核阶段不匹配（当前：${this.getStageLabel(promoter.auditStage)}）`,
                    });
                    continue;
                }
                if (operation === 'firstPass') {
                    await this.firstAuditPass(id, auditUserId);
                }
                else if (operation === 'secondPass') {
                    await this.secondAuditPass(id, auditUserId);
                }
                else if (operation === 'firstReject' && rejectData) {
                    await this.firstAuditReject(id, auditUserId, rejectData);
                }
                else if (operation === 'secondReject' && rejectData) {
                    await this.secondAuditReject(id, auditUserId, rejectData);
                }
                result.success++;
                result.details.push({
                    id,
                    name: promoter.name,
                    phone: promoter.phone || '-',
                    status: 'success',
                });
            }
            catch (err) {
                result.failed++;
                const promoter = await dao_1.promoterDao.findById(id);
                result.details.push({
                    id,
                    name: promoter?.name || '-',
                    phone: promoter?.phone || '-',
                    status: 'failed',
                    reason: err.message || '操作失败',
                });
            }
        }
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
        return result;
    }
    async getAuditList(params) {
        const { page, pageSize } = params;
        const cacheKey = `${cache_1.CacheKey.PROMOTER_LIST}audit_${JSON.stringify(params)}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const { rows, count } = await dao_1.promoterDao.findAuditListPaged(params);
        const list = rows.map((row) => {
            const plain = row.get ? row.get({ plain: true }) : row;
            return {
                ...plain,
                lockRemainingHours: plain.lockUntil ? getRemainingHours(new Date(plain.lockUntil)) : 0,
            };
        });
        const result = {
            list,
            total: count,
            page,
            pageSize,
            totalPages: Math.ceil(count / pageSize),
        };
        await cache_1.default.set(cacheKey, result, cache_1.CacheTTL.SHORT);
        return result;
    }
    async getAuditDetail(id) {
        const cacheKey = `${cache_1.CacheKey.PROMOTER_DETAIL}audit_${id}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const promoter = await dao_1.promoterDao.findByIdWithAuditLogs(id);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客申请不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        const plain = promoter.get({ plain: true });
        const rejectRecords = (plain.auditLogs || []).filter((log) => [enum_1.AuditAction.FIRST_REJECT, enum_1.AuditAction.SECOND_REJECT].includes(log.action));
        const result = {
            ...plain,
            rejectRecords: rejectRecords.map((log) => {
                const lockUntil = log.metadata?.lockUntil ? new Date(log.metadata.lockUntil) : null;
                return {
                    id: log.id,
                    action: log.action,
                    stage: this.getStageLabel(log.fromStage),
                    operator: log.operatorName,
                    reasonCode: log.rejectReasonCode,
                    reasonLabel: enum_1.REJECT_REASONS.find((r) => r.code === log.rejectReasonCode)?.label,
                    customRemark: log.rejectCustomRemark,
                    fullRemark: log.remark,
                    lockUntil,
                    remainingHours: lockUntil ? getRemainingHours(lockUntil) : 0,
                    locked: lockUntil ? lockUntil.getTime() > Date.now() : false,
                    createdAt: log.createdAt,
                };
            }),
            lockRemainingHours: plain.lockUntil ? getRemainingHours(new Date(plain.lockUntil)) : 0,
            isLocked: plain.lockUntil && new Date(plain.lockUntil).getTime() > Date.now(),
        };
        await cache_1.default.set(cacheKey, result, cache_1.CacheTTL.MEDIUM);
        return result;
    }
    async searchAuditLogs(params) {
        const { page, pageSize, phone, idCard } = params;
        let promoterId = params.promoterId;
        if (!promoterId && (phone || idCard)) {
            const where = {};
            if (phone)
                where.phone = phone;
            if (idCard)
                where.idCard = idCard;
            const promoter = await dao_1.promoterDao.findOne({ where });
            if (promoter) {
                promoterId = promoter.id;
            }
            else {
                return { list: [], total: 0, page, pageSize, totalPages: 0 };
            }
        }
        const { rows, count } = await dao_1.promoterAuditLogDao.findAllPaged({
            ...params,
            promoterId,
        });
        return {
            list: rows.map((r) => ({
                ...(r.get ? r.get({ plain: true }) : r),
                actionLabel: this.getActionLabel(r.action),
                fromStageLabel: this.getStageLabel(r.fromStage),
                toStageLabel: this.getStageLabel(r.toStage),
                fromStatusLabel: this.getStatusLabel(r.fromStatus),
                toStatusLabel: this.getStatusLabel(r.toStatus),
            })),
            total: count,
            page,
            pageSize,
            totalPages: Math.ceil(count / pageSize),
        };
    }
    async getStatistics() {
        const [pendingFirst, pendingSecond, rejected, passed] = await Promise.all([
            dao_1.promoterDao.count({ where: { auditStage: enum_1.AuditStage.FIRST_AUDIT } }),
            dao_1.promoterDao.count({ where: { auditStage: enum_1.AuditStage.SECOND_AUDIT } }),
            dao_1.promoterDao.count({ where: { auditStatus: enum_1.AuditStatus.REJECTED } }),
            dao_1.promoterDao.count({ where: { auditStatus: enum_1.AuditStatus.PASSED } }),
        ]);
        return {
            pendingFirst,
            pendingSecond,
            pendingTotal: pendingFirst + pendingSecond,
            rejected,
            passed,
        };
    }
    async sendRejectNotification(promoter, reasonLabel, customRemark, lockUntil) {
        try {
            const lockInfo = lockUntil
                ? `，锁定期间无法重复提交申请，解锁时间：${lockUntil.toLocaleString('zh-CN')}`
                : '';
            const message = `您的推客入驻申请已被驳回，原因：${reasonLabel}${customRemark ? `（${customRemark}）` : ''}${lockInfo}`;
            console.log(`[Notification] 发送给 ${promoter.phone}: ${message}`);
        }
        catch (err) {
            console.error('发送通知失败:', err);
        }
    }
    getStageLabel(stage) {
        const map = {
            [enum_1.AuditStage.PENDING_SUBMIT]: '待提交',
            [enum_1.AuditStage.FIRST_AUDIT]: '初审中',
            [enum_1.AuditStage.SECOND_AUDIT]: '复审中',
            [enum_1.AuditStage.COMPLETED]: '审核完成',
            [enum_1.AuditStage.REJECTED]: '已驳回',
        };
        return map[stage] || String(stage);
    }
    getStatusLabel(status) {
        const map = {
            [enum_1.AuditStatus.PENDING]: '待处理',
            [enum_1.AuditStatus.FIRST_AUDITING]: '初审中',
            [enum_1.AuditStatus.FIRST_PASSED]: '初审通过',
            [enum_1.AuditStatus.SECOND_AUDITING]: '复审中',
            [enum_1.AuditStatus.PASSED]: '审核通过',
            [enum_1.AuditStatus.REJECTED]: '已驳回',
            [enum_1.AuditStatus.BLACKLISTED]: '黑名单拦截',
            [enum_1.AuditStatus.LOCKED]: '锁定中',
        };
        return map[status] || String(status);
    }
    getActionLabel(action) {
        const map = {
            [enum_1.AuditAction.SUBMIT]: '提交申请',
            [enum_1.AuditAction.FIRST_PASS]: '初审通过',
            [enum_1.AuditAction.FIRST_REJECT]: '初审驳回',
            [enum_1.AuditAction.SECOND_PASS]: '复审通过',
            [enum_1.AuditAction.SECOND_REJECT]: '复审驳回',
            [enum_1.AuditAction.ROLLBACK]: '回退状态',
            [enum_1.AuditAction.BLACKLIST_BLOCK]: '黑名单拦截',
        };
        return map[action] || String(action);
    }
}
exports.default = new PromoterAuditService();
//# sourceMappingURL=PromoterAudit.service.js.map