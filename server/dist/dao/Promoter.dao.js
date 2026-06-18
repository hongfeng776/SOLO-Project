"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Promoter_model_1 = __importDefault(require("../models/Promoter.model"));
const models_1 = require("../models");
class PromoterDao {
    async create(data, options) {
        return Promoter_model_1.default.create(data, options);
    }
    async findByPk(id, options) {
        return Promoter_model_1.default.findByPk(id, options);
    }
    async findOne(options) {
        return Promoter_model_1.default.findOne(options);
    }
    async findAll(options) {
        return Promoter_model_1.default.findAll(options);
    }
    async findAndCountAll(options) {
        return Promoter_model_1.default.findAndCountAll(options);
    }
    async update(data, options) {
        return Promoter_model_1.default.update(data, options);
    }
    async destroy(options) {
        return Promoter_model_1.default.destroy(options);
    }
    async count(options) {
        return Promoter_model_1.default.count(options);
    }
    async findById(id) {
        return this.findByPk(id);
    }
    async findAllPaged(params) {
        const { page, pageSize, keyword, channelId, level, status, auditStage, auditStatus, phone, idCard, riskFlagged, startDate, endDate } = params;
        const offset = (page - 1) * pageSize;
        const where = {};
        if (keyword) {
            where[sequelize_1.Op.or] = [
                { name: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { code: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { phone: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { nickname: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { idCard: { [sequelize_1.Op.like]: `%${keyword}%` } },
            ];
        }
        if (phone) {
            where.phone = { [sequelize_1.Op.like]: `%${phone}%` };
        }
        if (idCard) {
            where.idCard = { [sequelize_1.Op.like]: `%${idCard}%` };
        }
        if (channelId) {
            where.channelId = channelId;
        }
        if (level) {
            where.level = level;
        }
        if (status !== undefined) {
            where.status = status;
        }
        if (auditStage !== undefined) {
            where.auditStage = auditStage;
        }
        if (auditStatus) {
            where.auditStatus = auditStatus;
        }
        if (riskFlagged !== undefined) {
            where.riskFlagged = riskFlagged;
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt[sequelize_1.Op.gte] = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt[sequelize_1.Op.lte] = end;
            }
        }
        return this.findAndCountAll({
            where,
            offset,
            limit: pageSize,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: models_1.Channel,
                    as: 'channel',
                    attributes: ['id', 'name'],
                    required: false,
                },
                {
                    model: models_1.User,
                    as: 'firstAuditor',
                    attributes: ['id', 'name', 'username'],
                    required: false,
                },
                {
                    model: models_1.User,
                    as: 'secondAuditor',
                    attributes: ['id', 'name', 'username'],
                    required: false,
                },
            ],
        });
    }
    async findAuditListPaged(params) {
        const { page, pageSize, keyword, channelId, level, auditStage, auditStageList, auditStatus, auditStatusList, phone, idCard, riskFlagged, startDate, endDate } = params;
        const offset = (page - 1) * pageSize;
        const where = {};
        if (keyword) {
            where[sequelize_1.Op.or] = [
                { name: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { code: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { phone: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { idCard: { [sequelize_1.Op.like]: `%${keyword}%` } },
            ];
        }
        if (phone) {
            where.phone = phone;
        }
        if (idCard) {
            where.idCard = idCard;
        }
        if (channelId) {
            where.channelId = channelId;
        }
        if (level) {
            where.level = level;
        }
        if (auditStage !== undefined) {
            where.auditStage = auditStage;
        }
        if (auditStageList && auditStageList.length > 0) {
            where.auditStage = { [sequelize_1.Op.in]: auditStageList };
        }
        if (auditStatus) {
            where.auditStatus = auditStatus;
        }
        if (auditStatusList && auditStatusList.length > 0) {
            where.auditStatus = { [sequelize_1.Op.in]: auditStatusList };
        }
        if (riskFlagged !== undefined) {
            where.riskFlagged = riskFlagged;
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt[sequelize_1.Op.gte] = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt[sequelize_1.Op.lte] = end;
            }
        }
        return this.findAndCountAll({
            where,
            offset,
            limit: pageSize,
            order: [
                ['riskFlagged', 'DESC'],
                ['createdAt', 'ASC'],
            ],
            include: [
                {
                    model: models_1.Channel,
                    as: 'channel',
                    attributes: ['id', 'name'],
                    required: false,
                },
                {
                    model: models_1.User,
                    as: 'firstAuditor',
                    attributes: ['id', 'name', 'username'],
                    required: false,
                },
                {
                    model: models_1.User,
                    as: 'secondAuditor',
                    attributes: ['id', 'name', 'username'],
                    required: false,
                },
            ],
        });
    }
    async softDelete(id) {
        return this.destroy({ where: { id } });
    }
    async bulkSoftDelete(ids) {
        return this.destroy({ where: { id: { [sequelize_1.Op.in]: ids } } });
    }
    async existsByCode(code) {
        const count = await this.count({ where: { code } });
        return count > 0;
    }
    async existsByCodeAndId(code, excludeId) {
        const count = await this.count({ where: { code, id: { [sequelize_1.Op.ne]: excludeId } } });
        return count > 0;
    }
    async findByChannelId(channelId) {
        return this.findAll({ where: { channelId } });
    }
    async updateCommission(promoterId, totalDelta, availableDelta) {
        const promoter = await this.findById(promoterId);
        if (!promoter)
            return [0, []];
        const totalCommission = Number(promoter.totalCommission || 0) + totalDelta;
        const availableCommission = Number(promoter.availableCommission || 0) + availableDelta;
        return this.update({ totalCommission, availableCommission }, { where: { id: promoterId } });
    }
    async getTodayCount() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return this.count({
            where: {
                createdAt: {
                    [sequelize_1.Op.gte]: today,
                    [sequelize_1.Op.lt]: tomorrow,
                },
            },
        });
    }
    async existsByPhone(phone, excludeId) {
        const where = { phone };
        if (excludeId) {
            where.id = { [sequelize_1.Op.ne]: excludeId };
        }
        const count = await this.count({ where });
        return count > 0;
    }
    async existsByIdCard(idCard, excludeId) {
        const where = { idCard };
        if (excludeId) {
            where.id = { [sequelize_1.Op.ne]: excludeId };
        }
        const count = await this.count({ where });
        return count > 0;
    }
    async findByPhone(phone) {
        return this.findOne({ where: { phone } });
    }
    async findByIdCard(idCard) {
        return this.findOne({ where: { idCard } });
    }
    async findByIdWithAuditLogs(id) {
        return this.findByPk(id, {
            include: [
                {
                    model: models_1.Channel,
                    as: 'channel',
                    attributes: ['id', 'name'],
                    required: false,
                },
                {
                    model: models_1.User,
                    as: 'firstAuditor',
                    attributes: ['id', 'name', 'username'],
                    required: false,
                },
                {
                    model: models_1.User,
                    as: 'secondAuditor',
                    attributes: ['id', 'name', 'username'],
                    required: false,
                },
                {
                    model: models_1.PromoterAuditLog,
                    as: 'auditLogs',
                    required: false,
                    order: [['createdAt', 'ASC']],
                },
            ],
        });
    }
    async checkLockStatus(phone, idCard) {
        const where = {};
        const orConditions = [];
        if (phone)
            orConditions.push({ phone });
        if (idCard)
            orConditions.push({ idCard });
        if (orConditions.length > 0) {
            where[sequelize_1.Op.or] = orConditions;
        }
        const promoter = await this.findOne({
            where: {
                ...where,
                lockUntil: { [sequelize_1.Op.gt]: new Date() },
            },
            attributes: ['id', 'lockUntil'],
        });
        if (promoter && promoter.lockUntil) {
            return {
                locked: true,
                lockUntil: promoter.lockUntil,
                promoterId: promoter.id,
            };
        }
        return { locked: false };
    }
}
exports.default = new PromoterDao();
//# sourceMappingURL=Promoter.dao.js.map