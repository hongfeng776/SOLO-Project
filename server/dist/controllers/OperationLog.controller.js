"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const OperationLog_service_1 = __importDefault(require("../services/OperationLog.service"));
const response_1 = __importDefault(require("../utils/response"));
class OperationLogController {
    async findAll(req, res) {
        try {
            const page = parseInt(req.query.page || '1', 10);
            const pageSize = parseInt(req.query.pageSize || '10', 10);
            const params = {
                page, pageSize,
                userId: req.query.userId,
                module: req.query.module,
                action: req.query.action,
                targetType: req.query.targetType,
                targetId: req.query.targetId,
                status: req.query.status ? parseInt(req.query.status, 10) : undefined,
                startTime: req.query.startTime,
                endTime: req.query.endTime,
            };
            const result = await OperationLog_service_1.default.findAll(params);
            response_1.default.paginated(res, result.list, result.total, result.page, result.pageSize);
        }
        catch (err) {
            response_1.default.error(res, err.message, err.code);
        }
    }
}
exports.default = new OperationLogController();
//# sourceMappingURL=OperationLog.controller.js.map