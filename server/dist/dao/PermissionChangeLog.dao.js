"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const PermissionChangeLog_model_1 = __importDefault(require("../models/PermissionChangeLog.model"));
class PermissionChangeLogDao {
    async create(data, options) {
        return PermissionChangeLog_model_1.default.create(data, options);
    }
    async findById(id) {
        return PermissionChangeLog_model_1.default.findByPk(id);
    }
    async findAllPaged(params) {
        const { page, pageSize, operatorId, operatorName, targetType, targetId, action, module, startTime, endTime, keyword } = params;
        const offset = (page - 1) * pageSize;
        const where = {};
        if (operatorId)
            where.operatorId = operatorId;
        if (targetType)
            where.targetType = targetType;
        if (targetId)
            where.targetId = targetId;
        if (action)
            where.action = action;
        if (module)
            where.module = module;
        if (operatorName) {
            where.operatorName = { [sequelize_1.Op.like]: `%${operatorName}%` };
        }
        if (keyword) {
            where[sequelize_1.Op.or] = [
                { operatorName: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { targetName: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { reason: { [sequelize_1.Op.like]: `%${keyword}%` } },
            ];
        }
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
        return PermissionChangeLog_model_1.default.findAndCountAll({ where, offset, limit: pageSize, order: [['createdAt', 'DESC']] });
    }
    async findAllForExport(params) {
        const { operatorId, operatorName, targetType, targetId, action, module, startTime, endTime, keyword } = params;
        const where = {};
        if (operatorId)
            where.operatorId = operatorId;
        if (targetType)
            where.targetType = targetType;
        if (targetId)
            where.targetId = targetId;
        if (action)
            where.action = action;
        if (module)
            where.module = module;
        if (operatorName)
            where.operatorName = { [sequelize_1.Op.like]: `%${operatorName}%` };
        if (keyword) {
            where[sequelize_1.Op.or] = [
                { operatorName: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { targetName: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { reason: { [sequelize_1.Op.like]: `%${keyword}%` } },
            ];
        }
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
        return PermissionChangeLog_model_1.default.findAll({ where, order: [['createdAt', 'DESC']] });
    }
    async detectHighFrequencyOperations(params) {
        const { userId, timeWindowMinutes = 10, frequencyThreshold = 20, startTime, endTime } = params;
        const windowMs = timeWindowMinutes * 60 * 1000;
        const where = {};
        if (userId)
            where.operatorId = userId;
        if (startTime || endTime) {
            where.createdAt = {};
            if (startTime)
                where.createdAt[sequelize_1.Op.gte] = new Date(startTime);
            if (endTime)
                where.createdAt[sequelize_1.Op.lte] = new Date(endTime);
        }
        const logs = await PermissionChangeLog_model_1.default.findAll({ where, order: [['createdAt', 'ASC']] });
        const clusters = [];
        let currentCluster = [];
        for (const log of logs) {
            if (currentCluster.length === 0) {
                currentCluster.push(log);
            }
            else {
                const firstLog = currentCluster[0];
                const diff = new Date(log.createdAt).getTime() - new Date(firstLog.createdAt).getTime();
                if (diff <= windowMs) {
                    currentCluster.push(log);
                }
                else {
                    if (currentCluster.length >= frequencyThreshold) {
                        clusters.push({
                            startTime: currentCluster[0].createdAt,
                            endTime: currentCluster[currentCluster.length - 1].createdAt,
                            count: currentCluster.length,
                            operatorId: currentCluster[0].operatorId,
                            operatorName: currentCluster[0].operatorName,
                            actions: [...new Set(currentCluster.map(l => l.action))],
                            ips: [...new Set(currentCluster.map(l => l.ip))],
                            sampleLogs: currentCluster.slice(0, 5),
                        });
                    }
                    currentCluster = [log];
                }
            }
        }
        if (currentCluster.length >= frequencyThreshold) {
            clusters.push({
                startTime: currentCluster[0].createdAt,
                endTime: currentCluster[currentCluster.length - 1].createdAt,
                count: currentCluster.length,
                operatorId: currentCluster[0].operatorId,
                operatorName: currentCluster[0].operatorName,
                actions: [...new Set(currentCluster.map(l => l.action))],
                ips: [...new Set(currentCluster.map(l => l.ip))],
                sampleLogs: currentCluster.slice(0, 5),
            });
        }
        return clusters;
    }
    async findAnomalyOperations(params) {
        const { userId, startTime, endTime } = params;
        const where = { action: { [sequelize_1.Op.in]: ['batch_assign', 'batch_revoke', 'delete'] } };
        if (userId)
            where.operatorId = userId;
        if (startTime || endTime) {
            where.createdAt = {};
            if (startTime)
                where.createdAt[sequelize_1.Op.gte] = new Date(startTime);
            if (endTime)
                where.createdAt[sequelize_1.Op.lte] = new Date(endTime);
        }
        return PermissionChangeLog_model_1.default.findAll({ where, order: [['createdAt', 'DESC']], limit: 100 });
    }
}
exports.default = new PermissionChangeLogDao();
//# sourceMappingURL=PermissionChangeLog.dao.js.map