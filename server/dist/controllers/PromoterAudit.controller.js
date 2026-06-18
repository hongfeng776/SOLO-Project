"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const services_1 = require("../services");
const response_1 = __importDefault(require("../utils/response"));
class PromoterAuditController {
    async preCheck(req, res) {
        try {
            const result = await services_1.promoterAuditService.preCheckApplyData(req.body);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async submitApply(req, res) {
        try {
            const result = await services_1.promoterAuditService.submitApply(req.body);
            response_1.default.created(res, result, '申请提交成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async getAuditList(req, res) {
        try {
            const page = parseInt(req.query.page || '1', 10);
            const pageSize = parseInt(req.query.pageSize || '10', 10);
            const auditStageList = req.query.auditStageList
                ? req.query.auditStageList.split(',').map(Number)
                : undefined;
            const auditStatusList = (req.query.auditStatusList
                ? req.query.auditStatusList.split(',')
                : undefined);
            const params = {
                page,
                pageSize,
                keyword: req.query.keyword,
                auditStageList,
                auditStatusList,
                channelId: req.query.channelId,
                level: req.query.level,
                phone: req.query.phone,
                idCard: req.query.idCard,
                riskFlagged: req.query.riskFlagged === 'true' ? true : req.query.riskFlagged === 'false' ? false : undefined,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
            };
            const result = await services_1.promoterAuditService.getAuditList(params);
            response_1.default.paginated(res, result.list, result.total, result.page, result.pageSize);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async getAuditDetail(req, res) {
        try {
            const { id } = req.params;
            const result = await services_1.promoterAuditService.getAuditDetail(id);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async firstAuditPass(req, res) {
        try {
            const { id } = req.params;
            const auditUserId = req.user?.id || '';
            const { remark } = req.body || {};
            await services_1.promoterAuditService.firstAuditPass(id, auditUserId, remark);
            response_1.default.success(res, null, '初审通过成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async firstAuditReject(req, res) {
        try {
            const { id } = req.params;
            const auditUserId = req.user?.id || '';
            const { reasonCode, customRemark, lockDays } = req.body;
            await services_1.promoterAuditService.firstAuditReject(id, auditUserId, {
                reasonCode,
                customRemark,
                lockDays,
            });
            response_1.default.success(res, null, '初审驳回成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async secondAuditPass(req, res) {
        try {
            const { id } = req.params;
            const auditUserId = req.user?.id || '';
            const { remark } = req.body || {};
            await services_1.promoterAuditService.secondAuditPass(id, auditUserId, remark);
            response_1.default.success(res, null, '复审通过成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async secondAuditReject(req, res) {
        try {
            const { id } = req.params;
            const auditUserId = req.user?.id || '';
            const { reasonCode, customRemark, lockDays } = req.body;
            await services_1.promoterAuditService.secondAuditReject(id, auditUserId, {
                reasonCode,
                customRemark,
                lockDays,
            });
            response_1.default.success(res, null, '复审驳回成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async batchFirstPass(req, res) {
        try {
            const { ids } = req.body;
            const auditUserId = req.user?.id || '';
            const result = await services_1.promoterAuditService.batchFirstPass(ids, auditUserId);
            response_1.default.success(res, result, '批量初审通过完成');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async batchSecondPass(req, res) {
        try {
            const { ids } = req.body;
            const auditUserId = req.user?.id || '';
            const result = await services_1.promoterAuditService.batchSecondPass(ids, auditUserId);
            response_1.default.success(res, result, '批量复审通过完成');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async batchFirstReject(req, res) {
        try {
            const { ids, reasonCode, customRemark, lockDays } = req.body;
            const auditUserId = req.user?.id || '';
            const result = await services_1.promoterAuditService.batchFirstReject(ids, auditUserId, {
                reasonCode,
                customRemark,
                lockDays,
            });
            response_1.default.success(res, result, '批量初审驳回完成');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async batchSecondReject(req, res) {
        try {
            const { ids, reasonCode, customRemark, lockDays } = req.body;
            const auditUserId = req.user?.id || '';
            const result = await services_1.promoterAuditService.batchSecondReject(ids, auditUserId, {
                reasonCode,
                customRemark,
                lockDays,
            });
            response_1.default.success(res, result, '批量复审驳回完成');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async searchAuditLogs(req, res) {
        try {
            const page = parseInt(req.query.page || '1', 10);
            const pageSize = parseInt(req.query.pageSize || '10', 10);
            const params = {
                page,
                pageSize,
                phone: req.query.phone,
                idCard: req.query.idCard,
                promoterId: req.query.promoterId,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
            };
            const result = await services_1.promoterAuditService.searchAuditLogs(params);
            response_1.default.paginated(res, result.list, result.total, result.page, result.pageSize);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async getStatistics(req, res) {
        try {
            const result = await services_1.promoterAuditService.getStatistics();
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async getRejectReasons(req, res) {
        try {
            const { REJECT_REASONS } = require('../constants/enum');
            response_1.default.success(res, REJECT_REASONS);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
}
exports.default = new PromoterAuditController();
//# sourceMappingURL=PromoterAudit.controller.js.map