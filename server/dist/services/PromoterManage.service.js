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
const dayjs_1 = __importDefault(require("dayjs"));
const FIELD_LABEL_MAP = {
    name: '姓名',
    nickname: '昵称',
    avatar: '头像',
    email: '邮箱',
    phone: '手机号',
    wechatId: '微信号',
    idCard: '身份证号',
    idCardFrontImg: '身份证人像面',
    idCardBackImg: '身份证国徽面',
    level: '推客等级',
    channelId: '所属渠道',
    parentId: '上级推客',
    status: '账号状态',
    promoteStatus: '推广状态',
    settleStatus: '结算状态',
    commissionRate: '佣金比例',
    realName: '真实姓名',
    verifyStatus: '实名认证状态',
    qualificationImgs: '资质图片',
    qualificationExpireAt: '资质有效期',
    remark: '备注',
};
const LOW_PERFORMANCE_THRESHOLD = {
    minOrders: 10,
    minAmount: 5000,
};
function getFieldLabel(field) {
    return FIELD_LABEL_MAP[field] || field;
}
function validatePhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
}
function validateIdCard(idCard) {
    if (!/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(idCard)) {
        return false;
    }
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    let sum = 0;
    for (let i = 0; i < 17; i++) {
        sum += parseInt(idCard.charAt(i), 10) * weights[i];
    }
    return checkCodes[sum % 11] === idCard.charAt(17).toUpperCase();
}
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function getLevelConfig(level) {
    return enum_1.PROMOTER_LEVEL_CONFIGS.find(c => c.level === level);
}
class PromoterManageService {
    async checkEditPermission(userId, editFields) {
        const user = await dao_1.userDao.findById(userId);
        if (!user) {
            throw new error_middleware_1.AppError('操作人员不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        const userRole = user.role || enum_1.UserRole.USER;
        const isAdmin = userRole === enum_1.UserRole.ADMIN;
        const allowedFields = isAdmin
            ? [...enum_1.ADMIN_EDIT_FIELDS]
            : [...enum_1.BASIC_EDIT_FIELDS];
        const deniedFields = editFields.filter(f => !allowedFields.includes(f));
        return {
            allowed: deniedFields.length === 0,
            deniedFields,
            userRole,
        };
    }
    async validateField(field, value) {
        if (value === undefined || value === null || value === '') {
            if (['name', 'phone'].includes(field)) {
                return { valid: false, message: `${getFieldLabel(field)}不能为空` };
            }
            return { valid: true };
        }
        switch (field) {
            case 'phone':
                if (!validatePhone(String(value))) {
                    return { valid: false, message: '手机号格式不正确' };
                }
                break;
            case 'idCard':
                if (!validateIdCard(String(value))) {
                    return { valid: false, message: '身份证号格式不正确或校验位错误' };
                }
                break;
            case 'email':
                if (!validateEmail(String(value))) {
                    return { valid: false, message: '邮箱格式不正确' };
                }
                break;
            case 'commissionRate':
                const rate = Number(value);
                if (isNaN(rate) || rate < 0 || rate > 1) {
                    return { valid: false, message: '佣金比例必须在0到1之间' };
                }
                break;
        }
        return { valid: true };
    }
    async checkUniqueness(data, excludePromoterId) {
        const duplicateFields = [];
        if (data.phone) {
            const exists = await dao_1.promoterDao.findByPhone(data.phone);
            if (exists && exists.id !== excludePromoterId) {
                duplicateFields.push({
                    field: 'phone',
                    value: data.phone,
                    duplicatePromoters: [{ id: exists.id, name: exists.name, code: exists.code }],
                });
            }
        }
        if (data.wechatId) {
            const list = await dao_1.promoterDao.findAll({
                where: { wechatId: data.wechatId },
            });
            const duplicates = list.filter(p => p.id !== excludePromoterId);
            if (duplicates.length > 0) {
                duplicateFields.push({
                    field: 'wechatId',
                    value: data.wechatId,
                    duplicatePromoters: duplicates.map(p => ({ id: p.id, name: p.name, code: p.code })),
                });
            }
        }
        if (data.idCard) {
            const list = await dao_1.promoterDao.findAll({
                where: { idCard: data.idCard },
            });
            const duplicates = list.filter(p => p.id !== excludePromoterId);
            if (duplicates.length > 0) {
                duplicateFields.push({
                    field: 'idCard',
                    value: data.idCard,
                    duplicatePromoters: duplicates.map(p => ({ id: p.id, name: p.name, code: p.code })),
                });
            }
        }
        return {
            valid: duplicateFields.length === 0,
            duplicateFields,
        };
    }
    async updatePromoterInfo(promoterId, operatorId, data) {
        const promoter = await dao_1.promoterDao.findById(promoterId);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        const editFields = Object.keys(data);
        const permCheck = await this.checkEditPermission(operatorId, editFields);
        if (!permCheck.allowed) {
            const deniedLabels = permCheck.deniedFields.map(getFieldLabel).join('、');
            throw new error_middleware_1.AppError(`无权限修改以下字段：${deniedLabels}`, statusCode_1.BusinessCode.FORBIDDEN);
        }
        for (const field of editFields) {
            const validation = await this.validateField(field, data[field]);
            if (!validation.valid) {
                throw new error_middleware_1.AppError(validation.message, statusCode_1.BusinessCode.PARAM_ERROR);
            }
        }
        const uniqueness = await this.checkUniqueness({
            phone: data.phone,
            wechatId: data.wechatId,
            idCard: data.idCard,
        }, promoterId);
        if (!uniqueness.valid) {
            const dupMsgs = uniqueness.duplicateFields.map(d => `${getFieldLabel(d.field)}「${d.value}」已被其他推客绑定`);
            throw new error_middleware_1.AppError(dupMsgs.join('；'), statusCode_1.BusinessCode.ERROR);
        }
        const updateData = {};
        const changeLogs = [];
        const operator = await dao_1.userDao.findById(operatorId);
        const operatorName = operator?.nickname || operator?.username || '系统';
        let levelChanged = false;
        let newLevelConfig = null;
        for (const field of editFields) {
            const oldValue = promoter[field];
            const newValue = data[field];
            if (String(oldValue) !== String(newValue)) {
                updateData[field] = newValue;
                if (field === 'level') {
                    levelChanged = true;
                    newLevelConfig = getLevelConfig(newValue);
                }
                changeLogs.push({
                    promoterId,
                    operatorId,
                    operatorName,
                    fieldName: field,
                    fieldLabel: getFieldLabel(field),
                    oldValue: oldValue !== undefined && oldValue !== null ? String(oldValue) : null,
                    newValue: newValue !== undefined && newValue !== null ? String(newValue) : null,
                    changeType: field === 'level'
                        ? (Number(String(newValue).replace('L', '')) > Number(String(oldValue).replace('L', '')) ? 'level_up' : 'level_down')
                        : ['status', 'promoteStatus', 'settleStatus', 'verifyStatus'].includes(field)
                            ? 'status_change'
                            : 'update',
                    remark: '',
                });
            }
        }
        if (levelChanged && newLevelConfig) {
            updateData.commissionRate = newLevelConfig.commissionRate;
            updateData.promoteStatus = enum_1.PromoteStatus.ACTIVE;
        }
        if (Object.keys(updateData).length === 0) {
            return promoter;
        }
        await dao_1.promoterDao.update(updateData, { where: { id: promoterId } });
        for (const log of changeLogs) {
            await dao_1.promoterChangeLogDao.create(log);
        }
        await cache_1.default.del(`${cache_1.CacheKey.PROMOTER_DETAIL}${promoterId}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
        return this.getPromoterDetail(promoterId);
    }
    async validateQualification(data) {
        const errors = [];
        const warnings = [];
        if (data.type && !Object.values(enum_1.QualificationType).includes(data.type)) {
            errors.push('资质类型无效');
        }
        if (data.fileUrl) {
            if (!/\.(jpg|jpeg|png|pdf)$/i.test(data.fileUrl)) {
                errors.push('资质文件格式不支持，仅支持JPG/PNG/PDF');
            }
        }
        else {
            errors.push('请上传资质文件');
        }
        if (data.expireAt) {
            const expireDate = (0, dayjs_1.default)(data.expireAt);
            if (!expireDate.isValid()) {
                errors.push('资质有效期格式不正确');
            }
            else if (expireDate.isBefore((0, dayjs_1.default)())) {
                errors.push('资质已过期，无法提交认证');
            }
            else if (expireDate.diff((0, dayjs_1.default)(), 'day') < 30) {
                warnings.push(`资质将在 ${expireDate.diff((0, dayjs_1.default)(), 'day')} 天后过期`);
            }
        }
        if (data.idCard && data.realName) {
            if (!validateIdCard(data.idCard)) {
                errors.push('身份证信息不合规');
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    async submitQualification(promoterId, operatorId, qualificationData) {
        const promoter = await dao_1.promoterDao.findById(promoterId);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        const validation = await this.validateQualification(qualificationData);
        if (!validation.valid) {
            throw new error_middleware_1.AppError(validation.errors.join('；'), statusCode_1.BusinessCode.PARAM_ERROR);
        }
        const expireAt = qualificationData.expireAt
            ? new Date(qualificationData.expireAt)
            : undefined;
        const qualRecord = await dao_1.promoterQualificationDao.create({
            promoterId,
            type: qualificationData.type,
            title: qualificationData.title,
            fileUrl: qualificationData.fileUrl,
            expireAt,
            verifyStatus: enum_1.VerifyStatus.PENDING,
        });
        const updateData = {
            verifyStatus: enum_1.VerifyStatus.PENDING,
        };
        if (qualificationData.realName) {
            updateData.realName = qualificationData.realName;
        }
        if (expireAt) {
            updateData.qualificationExpireAt = expireAt;
        }
        await dao_1.promoterDao.update(updateData, { where: { id: promoterId } });
        const operator = await dao_1.userDao.findById(operatorId);
        const operatorName = operator?.nickname || operator?.username || '系统';
        await dao_1.promoterChangeLogDao.create({
            promoterId,
            operatorId,
            operatorName,
            fieldName: 'qualification',
            fieldLabel: '资质认证',
            oldValue: String(promoter.verifyStatus || enum_1.VerifyStatus.UNVERIFIED),
            newValue: String(enum_1.VerifyStatus.PENDING),
            changeType: 'status_change',
            remark: `提交资质：${qualificationData.title || qualificationData.type}`,
            metadata: JSON.stringify({ qualificationId: qualRecord.id }),
        });
        await cache_1.default.del(`${cache_1.CacheKey.PROMOTER_DETAIL}${promoterId}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
        return { qualificationId: qualRecord.id, warnings: validation.warnings };
    }
    async reviewQualification(qualificationId, reviewerId, passed, remark) {
        const qual = await dao_1.promoterQualificationDao.findByPk(qualificationId);
        if (!qual) {
            throw new error_middleware_1.AppError('资质记录不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (qual.verifyStatus !== enum_1.VerifyStatus.PENDING) {
            throw new error_middleware_1.AppError('该资质已审核，不可重复操作', statusCode_1.BusinessCode.ERROR);
        }
        const reviewer = await dao_1.userDao.findById(reviewerId);
        const reviewerName = reviewer?.nickname || reviewer?.username || '系统';
        if (passed) {
            await dao_1.promoterQualificationDao.update(qualificationId, {
                verifyStatus: enum_1.VerifyStatus.VERIFIED,
                verifyRemark: remark,
                verifiedBy: reviewerId,
                verifiedAt: new Date(),
            });
            await dao_1.promoterDao.update({
                verifyStatus: enum_1.VerifyStatus.VERIFIED,
                verifiedAt: new Date(),
                promoteStatus: enum_1.PromoteStatus.ACTIVE,
                settleStatus: enum_1.SettleStatus.NORMAL,
            }, { where: { id: qual.promoterId } });
        }
        else {
            await dao_1.promoterQualificationDao.update(qualificationId, {
                verifyStatus: enum_1.VerifyStatus.REJECTED,
                verifyRemark: remark,
                verifiedBy: reviewerId,
                verifiedAt: new Date(),
            });
            await dao_1.promoterDao.update({ verifyStatus: enum_1.VerifyStatus.REJECTED }, { where: { id: qual.promoterId } });
        }
        await dao_1.promoterChangeLogDao.create({
            promoterId: qual.promoterId,
            operatorId: reviewerId,
            operatorName: reviewerName,
            fieldName: 'verifyStatus',
            fieldLabel: '实名认证状态',
            oldValue: String(enum_1.VerifyStatus.PENDING),
            newValue: String(passed ? enum_1.VerifyStatus.VERIFIED : enum_1.VerifyStatus.REJECTED),
            changeType: 'status_change',
            remark: remark || (passed ? '资质审核通过' : '资质审核驳回'),
            metadata: JSON.stringify({ qualificationId, passed }),
        });
        await cache_1.default.del(`${cache_1.CacheKey.PROMOTER_DETAIL}${qual.promoterId}`);
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
    }
    async batchUpdateLevel(ids, targetLevel, operatorId) {
        if (!ids || ids.length === 0) {
            throw new error_middleware_1.AppError('请选择要操作的推客', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        const targetLevelConfig = getLevelConfig(targetLevel);
        if (!targetLevelConfig) {
            throw new error_middleware_1.AppError('目标等级无效', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        const operator = await dao_1.userDao.findById(operatorId);
        const operatorName = operator?.nickname || operator?.username || '系统';
        const permCheck = await this.checkEditPermission(operatorId, ['level']);
        if (!permCheck.allowed) {
            throw new error_middleware_1.AppError('无权限修改推客等级', statusCode_1.BusinessCode.FORBIDDEN);
        }
        const details = [];
        let success = 0;
        let failed = 0;
        let skipped = 0;
        for (const id of ids) {
            try {
                const promoter = await dao_1.promoterDao.findById(id);
                if (!promoter) {
                    skipped++;
                    details.push({ id, name: '-', status: 'skipped', reason: '推客不存在' });
                    continue;
                }
                const currentLevelNum = Number(String(promoter.level).replace('L', ''));
                const targetLevelNum = Number(String(targetLevel).replace('L', ''));
                if (promoter.level === targetLevel) {
                    skipped++;
                    details.push({
                        id,
                        name: promoter.name,
                        status: 'skipped',
                        reason: '等级未变化',
                    });
                    continue;
                }
                if (targetLevelNum > currentLevelNum) {
                    const orders = promoter.totalOrders || 0;
                    const amount = Number(promoter.totalAmount || 0);
                    if (orders < LOW_PERFORMANCE_THRESHOLD.minOrders ||
                        amount < LOW_PERFORMANCE_THRESHOLD.minAmount) {
                        skipped++;
                        details.push({
                            id,
                            name: promoter.name,
                            status: 'skipped',
                            reason: `绩效不达标（需≥${LOW_PERFORMANCE_THRESHOLD.minOrders}单/¥${LOW_PERFORMANCE_THRESHOLD.minAmount}），禁止批量升级`,
                        });
                        continue;
                    }
                }
                if (promoter.riskFlagged) {
                    skipped++;
                    details.push({
                        id,
                        name: promoter.name,
                        status: 'skipped',
                        reason: '存在风险标记，禁止批量修改等级',
                    });
                    continue;
                }
                await dao_1.promoterDao.update({
                    level: targetLevel,
                    commissionRate: targetLevelConfig.commissionRate,
                    promoteStatus: enum_1.PromoteStatus.ACTIVE,
                }, { where: { id } });
                await dao_1.promoterChangeLogDao.create({
                    promoterId: id,
                    operatorId,
                    operatorName,
                    fieldName: 'level',
                    fieldLabel: '推客等级',
                    oldValue: String(promoter.level),
                    newValue: String(targetLevel),
                    changeType: targetLevelNum > currentLevelNum ? 'level_up' : 'level_down',
                    remark: '批量修改等级',
                    metadata: JSON.stringify({ batch: true }),
                });
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
                    reason: err.message || '操作失败',
                });
            }
        }
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
        return {
            total: ids.length,
            success,
            failed,
            skipped,
            details,
        };
    }
    async batchUpdatePromoteStatus(ids, status, operatorId, remark) {
        if (!ids || ids.length === 0) {
            throw new error_middleware_1.AppError('请选择要操作的推客', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        const operator = await dao_1.userDao.findById(operatorId);
        const operatorName = operator?.nickname || operator?.username || '系统';
        const permCheck = await this.checkEditPermission(operatorId, ['promoteStatus']);
        if (!permCheck.allowed) {
            throw new error_middleware_1.AppError('无权限修改推广状态', statusCode_1.BusinessCode.FORBIDDEN);
        }
        const details = [];
        let success = 0;
        let failed = 0;
        let skipped = 0;
        for (const id of ids) {
            try {
                const promoter = await dao_1.promoterDao.findById(id);
                if (!promoter) {
                    skipped++;
                    details.push({ id, name: '-', status: 'skipped', reason: '推客不存在' });
                    continue;
                }
                if (promoter.promoteStatus === status) {
                    skipped++;
                    details.push({
                        id,
                        name: promoter.name,
                        status: 'skipped',
                        reason: '状态未变化',
                    });
                    continue;
                }
                const oldStatus = promoter.promoteStatus;
                await dao_1.promoterDao.update({ promoteStatus: status }, { where: { id } });
                await dao_1.promoterChangeLogDao.create({
                    promoterId: id,
                    operatorId,
                    operatorName,
                    fieldName: 'promoteStatus',
                    fieldLabel: '推广状态',
                    oldValue: String(oldStatus),
                    newValue: String(status),
                    changeType: 'status_change',
                    remark: remark || '批量修改推广状态',
                    metadata: JSON.stringify({ batch: true }),
                });
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
                    reason: err.message || '操作失败',
                });
            }
        }
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
        return { total: ids.length, success, failed, skipped, details };
    }
    async batchUpdateSettleStatus(ids, status, operatorId, remark) {
        if (!ids || ids.length === 0) {
            throw new error_middleware_1.AppError('请选择要操作的推客', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        const operator = await dao_1.userDao.findById(operatorId);
        const operatorName = operator?.nickname || operator?.username || '系统';
        const permCheck = await this.checkEditPermission(operatorId, ['settleStatus']);
        if (!permCheck.allowed) {
            throw new error_middleware_1.AppError('无权限修改结算状态', statusCode_1.BusinessCode.FORBIDDEN);
        }
        const details = [];
        let success = 0;
        let failed = 0;
        let skipped = 0;
        for (const id of ids) {
            try {
                const promoter = await dao_1.promoterDao.findById(id);
                if (!promoter) {
                    skipped++;
                    details.push({ id, name: '-', status: 'skipped', reason: '推客不存在' });
                    continue;
                }
                if (promoter.settleStatus === status) {
                    skipped++;
                    details.push({
                        id,
                        name: promoter.name,
                        status: 'skipped',
                        reason: '状态未变化',
                    });
                    continue;
                }
                const oldStatus = promoter.settleStatus;
                await dao_1.promoterDao.update({ settleStatus: status }, { where: { id } });
                await dao_1.promoterChangeLogDao.create({
                    promoterId: id,
                    operatorId,
                    operatorName,
                    fieldName: 'settleStatus',
                    fieldLabel: '结算状态',
                    oldValue: String(oldStatus),
                    newValue: String(status),
                    changeType: 'status_change',
                    remark: remark || '批量修改结算状态',
                    metadata: JSON.stringify({ batch: true }),
                });
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
                    reason: err.message || '操作失败',
                });
            }
        }
        await cache_1.default.delPattern(`${cache_1.CacheKey.PROMOTER_LIST}*`);
        return { total: ids.length, success, failed, skipped, details };
    }
    async getChangeLogs(promoterId, params) {
        const { page, pageSize } = params;
        const { rows, count } = await dao_1.promoterChangeLogDao.findAllPaged({ promoterId, page, pageSize });
        const logs = rows.map((log) => ({
            ...log.get({ plain: true }),
            changedAt: log.createdAt,
        }));
        return {
            list: logs,
            total: count,
            page,
            pageSize,
            totalPages: Math.ceil(count / pageSize),
        };
    }
    async getChangeDiff(promoterId, logId) {
        const log = await dao_1.promoterChangeLogDao.findByPk(logId);
        if (!log) {
            throw new error_middleware_1.AppError('变更记录不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        return {
            fieldName: log.fieldName,
            fieldLabel: log.fieldLabel,
            before: log.oldValue,
            after: log.newValue,
        };
    }
    async getPromoterDetail(promoterId) {
        const cacheKey = `${cache_1.CacheKey.PROMOTER_DETAIL}${promoterId}`;
        const cached = await cache_1.default.get(cacheKey);
        if (cached)
            return cached;
        const promoter = await dao_1.promoterDao.findById(promoterId);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        const plain = promoter.get({ plain: true });
        const levelConfig = getLevelConfig(plain.level);
        const qualifications = await dao_1.promoterQualificationDao.findByPromoterId(promoterId);
        const result = {
            ...plain,
            levelConfig,
            qualifications,
        };
        await cache_1.default.set(cacheKey, result, cache_1.CacheTTL.MEDIUM);
        return result;
    }
    async getLevelConfigs() {
        return enum_1.PROMOTER_LEVEL_CONFIGS;
    }
}
exports.default = new PromoterManageService();
//# sourceMappingURL=PromoterManage.service.js.map