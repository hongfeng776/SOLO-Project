"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PermissionChangeLog_service_1 = __importDefault(require("../services/PermissionChangeLog.service"));
const response_1 = __importDefault(require("../utils/response"));
const enum_1 = require("../constants/enum");
class PermissionChangeLogController {
    async findAll(req, res) {
        try {
            const page = parseInt(req.query.page || '1', 10);
            const pageSize = parseInt(req.query.pageSize || '10', 10);
            const params = {
                page, pageSize,
                operatorId: req.query.operatorId,
                operatorName: req.query.operatorName,
                targetType: req.query.targetType,
                targetId: req.query.targetId,
                action: req.query.action,
                module: req.query.module,
                startTime: req.query.startTime,
                endTime: req.query.endTime,
                keyword: req.query.keyword,
            };
            const result = await PermissionChangeLog_service_1.default.findAll(params);
            response_1.default.paginated(res, result.list, result.total, result.page, result.pageSize);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async getDetail(req, res) {
        try {
            const { id } = req.params;
            const detail = await PermissionChangeLog_service_1.default.getDetail(id);
            response_1.default.success(res, detail);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async exportLogs(req, res) {
        try {
            const user = req.user;
            if (user.positionLevel > enum_1.AccountLevel.MANAGER) {
                response_1.default.error(res, '无导出权限', 403);
                return;
            }
            const { fields, sortBy, sortOrder, ...queryParams } = req.body;
            const exportFields = Array.isArray(fields) && fields.length > 0
                ? fields
                : ['operatorName', 'targetType', 'targetName', 'action', 'module', 'reason', 'affectedUserCount', 'ip', 'createdAt'];
            const buffer = await PermissionChangeLog_service_1.default.exportLogs(queryParams, exportFields, sortBy || 'createdAt', sortOrder || 'desc');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `permission_change_logs_${timestamp}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.end(buffer);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
    async detectAnomalies(req, res) {
        try {
            const params = {
                userId: req.query.userId,
                timeWindowMinutes: req.query.timeWindowMinutes ? parseInt(req.query.timeWindowMinutes, 10) : undefined,
                frequencyThreshold: req.query.frequencyThreshold ? parseInt(req.query.frequencyThreshold, 10) : undefined,
                startTime: req.query.startTime,
                endTime: req.query.endTime,
            };
            const result = await PermissionChangeLog_service_1.default.detectAnomalies(params);
            response_1.default.success(res, result);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
}
exports.default = new PermissionChangeLogController();
//# sourceMappingURL=PermissionChangeLog.controller.js.map