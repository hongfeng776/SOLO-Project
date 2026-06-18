"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const services_1 = require("../services");
const response_1 = __importDefault(require("../utils/response"));
class PromoterManageController {
    async getLevelConfigs(req, res) {
        try {
            const result = await services_1.promoterManageService.getLevelConfigs();
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async checkEditPermission(req, res) {
        try {
            const { id } = req.params;
            const { editFields } = req.body;
            const operatorId = req.user?.id || '';
            const result = await services_1.promoterManageService.checkEditPermission(operatorId, editFields);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async validateField(req, res) {
        try {
            const { field, value } = req.body;
            const result = await services_1.promoterManageService.validateField(field, value);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async checkUniqueness(req, res) {
        try {
            const { phone, wechatId, idCard, excludePromoterId } = req.body;
            const result = await services_1.promoterManageService.checkUniqueness({ phone, wechatId, idCard }, excludePromoterId);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async updatePromoterInfo(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            const operatorId = req.user?.id || '';
            const result = await services_1.promoterManageService.updatePromoterInfo(id, operatorId, data);
            response_1.default.success(res, result, '推客信息更新成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async validateQualification(req, res) {
        try {
            const result = await services_1.promoterManageService.validateQualification(req.body);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async submitQualification(req, res) {
        try {
            const { id } = req.params;
            const qualificationData = req.body;
            const operatorId = req.user?.id || '';
            const result = await services_1.promoterManageService.submitQualification(id, operatorId, qualificationData);
            response_1.default.created(res, result, '资质提交成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async reviewQualification(req, res) {
        try {
            const { qualificationId } = req.params;
            const { passed, remark } = req.body;
            const reviewerId = req.user?.id || '';
            await services_1.promoterManageService.reviewQualification(qualificationId, reviewerId, passed, remark);
            response_1.default.success(res, null, passed ? '资质审核通过成功' : '资质审核驳回成功');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async batchUpdateLevel(req, res) {
        try {
            const { ids, targetLevel } = req.body;
            const operatorId = req.user?.id || '';
            const result = await services_1.promoterManageService.batchUpdateLevel(ids, targetLevel, operatorId);
            response_1.default.success(res, result, '批量修改等级完成');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async batchUpdatePromoteStatus(req, res) {
        try {
            const { ids, status, remark } = req.body;
            const operatorId = req.user?.id || '';
            const result = await services_1.promoterManageService.batchUpdatePromoteStatus(ids, status, operatorId, remark);
            response_1.default.success(res, result, '批量修改推广状态完成');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async batchUpdateSettleStatus(req, res) {
        try {
            const { ids, status, remark } = req.body;
            const operatorId = req.user?.id || '';
            const result = await services_1.promoterManageService.batchUpdateSettleStatus(ids, status, operatorId, remark);
            response_1.default.success(res, result, '批量修改结算状态完成');
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async getChangeLogs(req, res) {
        try {
            const { id } = req.params;
            const page = parseInt(req.query.page || '1', 10);
            const pageSize = parseInt(req.query.pageSize || '10', 10);
            const result = await services_1.promoterManageService.getChangeLogs(id, { page, pageSize });
            response_1.default.paginated(res, result.list, result.total, result.page, result.pageSize);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async getChangeDiff(req, res) {
        try {
            const { id, logId } = req.params;
            const result = await services_1.promoterManageService.getChangeDiff(id, logId);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async getPromoterDetail(req, res) {
        try {
            const { id } = req.params;
            const result = await services_1.promoterManageService.getPromoterDetail(id);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
}
exports.default = new PromoterManageController();
//# sourceMappingURL=PromoterManage.controller.js.map