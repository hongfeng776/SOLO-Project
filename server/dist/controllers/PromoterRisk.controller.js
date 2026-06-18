"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const services_1 = require("../services");
const dao_1 = require("../dao");
const response_1 = __importDefault(require("../utils/response"));
class PromoterRiskController {
    async getRiskList(req, res) {
        try {
            const page = parseInt(req.query.page || '1', 10);
            const pageSize = parseInt(req.query.pageSize || '20', 10);
            const params = {
                page,
                pageSize,
                riskLevel: req.query.riskLevel,
                riskType: req.query.riskType,
                controlStatus: req.query.controlStatus !== undefined ? Number(req.query.controlStatus) : undefined,
                isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
            };
            const result = await services_1.promoterRiskService.getRiskList(params);
            response_1.default.paginated(res, result.list, result.total, result.page, result.pageSize);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async getRiskDetail(req, res) {
        try {
            const { id } = req.params;
            const result = await dao_1.promoterRiskRecordDao.findByPk(id);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async getRiskProfile(req, res) {
        try {
            const { promoterId } = req.params;
            const result = await services_1.promoterRiskService.getRiskProfile(promoterId);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async getRiskAnalysis(req, res) {
        try {
            const { promoterId } = req.params;
            const result = await services_1.promoterRiskService.getPromoterRiskAnalysis(promoterId);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async markRisk(req, res) {
        try {
            const operatorId = req.user?.id || '';
            const { promoterId, ...data } = req.body;
            const result = await services_1.promoterRiskService.markRisk(promoterId, operatorId, data);
            response_1.default.success(res, result, '风控标记成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async cancelRisk(req, res) {
        try {
            const { id } = req.params;
            const operatorId = req.user?.id || '';
            await services_1.promoterRiskService.cancelRisk(id, operatorId);
            response_1.default.success(res, null, '风控解除成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async getReleaseList(req, res) {
        try {
            const page = parseInt(req.query.page || '1', 10);
            const pageSize = parseInt(req.query.pageSize || '20', 10);
            const params = {
                page,
                pageSize,
                verifyStatus: req.query.verifyStatus !== undefined ? Number(req.query.verifyStatus) : undefined,
                promoterId: req.query.promoterId,
            };
            const result = await dao_1.promoterRiskReleaseDao.findAllPaged(params);
            response_1.default.paginated(res, result.rows, result.count, page, pageSize);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async submitRelease(req, res) {
        try {
            const applicantId = req.user?.id || '';
            const { promoterId, ...data } = req.body;
            const result = await services_1.promoterRiskService.submitRelease(promoterId, applicantId, data);
            response_1.default.success(res, result, '解除申请提交成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async reviewRelease(req, res) {
        try {
            const { id } = req.params;
            const reviewerId = req.user?.id || '';
            const { passed, verifyRemark, restoreStage } = req.body;
            await services_1.promoterRiskService.reviewRelease(id, reviewerId, { passed, verifyRemark, restoreStage });
            response_1.default.success(res, null, passed ? '审核通过成功' : '审核驳回成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async batchMarkRisk(req, res) {
        try {
            const operatorId = req.user?.id || '';
            const { ids, ...data } = req.body;
            const result = await services_1.promoterRiskService.batchMarkRisk(ids, operatorId, data);
            response_1.default.success(res, result, '批量风控标记完成');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async batchCancelRisk(req, res) {
        try {
            const operatorId = req.user?.id || '';
            const { ids } = req.body;
            const result = await services_1.promoterRiskService.batchCancelRisk(ids, operatorId);
            response_1.default.success(res, result, '批量风控解除完成');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async getBehaviorTrace(req, res) {
        try {
            const { promoterId } = req.params;
            const page = parseInt(req.query.page || '1', 10);
            const pageSize = parseInt(req.query.pageSize || '20', 10);
            const params = {
                page,
                pageSize,
                behaviorType: req.query.behaviorType,
                riskFlagged: req.query.riskFlagged !== undefined ? req.query.riskFlagged === 'true' : undefined,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
            };
            const result = await services_1.promoterRiskService.getBehaviorTrace(promoterId, params);
            response_1.default.paginated(res, result.list, result.total, result.page, result.pageSize);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async getWarningList(req, res) {
        try {
            const page = parseInt(req.query.page || '1', 10);
            const pageSize = parseInt(req.query.pageSize || '20', 10);
            const params = {
                page,
                pageSize,
                warningLevel: req.query.warningLevel,
                isHandled: req.query.isHandled !== undefined ? req.query.isHandled === 'true' : undefined,
                promoterId: req.query.promoterId,
            };
            const result = await dao_1.promoterRiskWarningDao.findAllPaged(params);
            response_1.default.paginated(res, result.rows, result.count, page, pageSize);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async handleWarning(req, res) {
        try {
            const { id } = req.params;
            const { handleRemark } = req.body;
            await dao_1.promoterRiskWarningDao.update(id, {
                isHandled: true,
                handleRemark,
                handledAt: new Date(),
            });
            response_1.default.success(res, null, '预警处理成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
    async getStatistics(req, res) {
        try {
            const params = {
                startDate: req.query.startDate,
                endDate: req.query.endDate,
            };
            const result = await services_1.promoterRiskService.getStatistics(params);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code, err.details);
        }
    }
}
exports.default = new PromoterRiskController();
//# sourceMappingURL=PromoterRisk.controller.js.map