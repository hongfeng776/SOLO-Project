"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const services_1 = require("../services");
const response_1 = __importDefault(require("../utils/response"));
class PromoterLevelController {
    async getAllRules(req, res) {
        try {
            const result = await services_1.promoterLevelService.getAllEffectiveRules();
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async saveLevelRule(req, res) {
        try {
            const operatorId = req.user?.id || '';
            const result = await services_1.promoterLevelService.saveLevelRule(req.body, operatorId);
            response_1.default.success(res, result, '规则保存成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async validateThresholds(req, res) {
        try {
            const { level } = req.params;
            const result = await services_1.promoterLevelService.validateThresholds(level, req.body);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async batchReEvaluate(req, res) {
        try {
            const operatorId = req.user?.id || '';
            const result = await services_1.promoterLevelService.batchReEvaluateAllLevels(operatorId);
            response_1.default.success(res, result, '批量重评完成');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async requestManualAdjust(req, res) {
        try {
            const applicantId = req.user?.id || '';
            const { promoterId, targetLevel, adjustReason } = req.body;
            const result = await services_1.promoterLevelService.requestManualAdjust(promoterId, applicantId, targetLevel, adjustReason);
            response_1.default.success(res, result, result.autoApproved ? '业绩达标，已自动升级' : '调整申请已提交');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async reviewAdjust(req, res) {
        try {
            const { id } = req.params;
            const approverId = req.user?.id || '';
            const { approved, approveRemark } = req.body;
            await services_1.promoterLevelService.reviewManualAdjust(id, approverId, approved, approveRemark);
            response_1.default.success(res, null, approved ? '审核通过成功' : '审核驳回成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async getAdjustRequests(req, res) {
        try {
            const page = parseInt(req.query.page || '1', 10);
            const pageSize = parseInt(req.query.pageSize || '20', 10);
            const params = {
                page,
                pageSize,
                promoterId: req.query.promoterId,
                approveStatus: req.query.approveStatus,
                applicantId: req.query.applicantId,
            };
            const result = await services_1.promoterLevelService.getAdjustRequests(params);
            response_1.default.paginated(res, result.list, result.total, result.page, result.pageSize);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async batchResetLevels(req, res) {
        try {
            const operatorId = req.user?.id || '';
            const { ids, resetTo } = req.body;
            const result = await services_1.promoterLevelService.batchResetLevels(ids, operatorId, resetTo);
            response_1.default.success(res, result, '批量重置完成');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async getChangeLogs(req, res) {
        try {
            const { promoterId } = req.params;
            const page = parseInt(req.query.page || '1', 10);
            const pageSize = parseInt(req.query.pageSize || '20', 10);
            const result = await services_1.promoterLevelService.getChangeLogs(promoterId, { page, pageSize });
            response_1.default.paginated(res, result.list, result.total, result.page, result.pageSize);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async getIterationStats(req, res) {
        try {
            const params = {
                startDate: req.query.startDate,
                endDate: req.query.endDate,
            };
            const result = await services_1.promoterLevelService.getIterationStatistics(params);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
}
exports.default = new PromoterLevelController();
//# sourceMappingURL=PromoterLevel.controller.js.map