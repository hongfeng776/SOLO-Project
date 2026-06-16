"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const OperationLog_model_1 = __importDefault(require("../models/OperationLog.model"));
class OperationLogDao {
    async create(data, options) {
        return OperationLog_model_1.default.create(data, options);
    }
    async findAllPaged(params) {
        const { page, pageSize, userId, module, action, targetType, targetId, status, startTime, endTime } = params;
        const offset = (page - 1) * pageSize;
        const where = {};
        if (userId)
            where.userId = userId;
        if (module)
            where.module = module;
        if (action)
            where.action = action;
        if (targetType)
            where.targetType = targetType;
        if (targetId)
            where.targetId = targetId;
        if (status !== undefined)
            where.status = status;
        if (startTime || endTime) {
            where.createdAt = {};
            if (startTime)
                where.createdAt[sequelize_1.Op.gte] = new Date(startTime);
            if (endTime) {
                const end = new Date(endTime);
                end.setHours(23, 59, 59, 999);
                where.createdAt[sequelize_1.Op.lte] = end;
            }
        }
        return OperationLog_model_1.default.findAndCountAll({ where, offset, limit: pageSize, order: [['createdAt', 'DESC']] });
    }
}
exports.default = new OperationLogDao();
//# sourceMappingURL=OperationLog.dao.js.map