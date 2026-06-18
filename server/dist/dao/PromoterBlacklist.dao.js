"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const PromoterBlacklist_model_1 = __importDefault(require("../models/PromoterBlacklist.model"));
const enum_1 = require("../constants/enum");
class PromoterBlacklistDao {
    async create(data, options) {
        return PromoterBlacklist_model_1.default.create(data, options);
    }
    async findByPk(id, options) {
        return PromoterBlacklist_model_1.default.findByPk(id, options);
    }
    async findOne(options) {
        return PromoterBlacklist_model_1.default.findOne(options);
    }
    async findAll(options) {
        return PromoterBlacklist_model_1.default.findAll(options);
    }
    async findAndCountAll(options) {
        return PromoterBlacklist_model_1.default.findAndCountAll(options);
    }
    async update(data, options) {
        return PromoterBlacklist_model_1.default.update(data, options);
    }
    async destroy(options) {
        return PromoterBlacklist_model_1.default.destroy(options);
    }
    async findById(id) {
        return this.findByPk(id);
    }
    async findAllPaged(params) {
        const { page, pageSize, type, keyword, isActive } = params;
        const offset = (page - 1) * pageSize;
        const where = {};
        if (type) {
            where.type = type;
        }
        if (keyword) {
            where.value = { [sequelize_1.Op.like]: `%${keyword}%` };
        }
        if (isActive !== undefined) {
            where.isActive = isActive;
        }
        where[sequelize_1.Op.or] = [
            { expiredAt: { [sequelize_1.Op.is]: null } },
            { expiredAt: { [sequelize_1.Op.gt]: new Date() } },
        ];
        return this.findAndCountAll({
            where,
            offset,
            limit: pageSize,
            order: [['createdAt', 'DESC']],
        });
    }
    async checkMatch(params) {
        const conditions = [];
        const now = new Date();
        if (params.phone) {
            conditions.push({
                type: enum_1.BlacklistType.PHONE,
                value: params.phone,
            });
        }
        if (params.idCard) {
            conditions.push({
                type: enum_1.BlacklistType.ID_CARD,
                value: params.idCard,
            });
        }
        if (params.name) {
            conditions.push({
                type: enum_1.BlacklistType.NAME,
                value: params.name,
            });
        }
        if (params.wechatId) {
            conditions.push({
                type: enum_1.BlacklistType.WECHAT,
                value: params.wechatId,
            });
        }
        if (conditions.length === 0) {
            return { matched: false, items: [] };
        }
        const items = await this.findAll({
            where: {
                [sequelize_1.Op.and]: [
                    { [sequelize_1.Op.or]: conditions },
                    { isActive: true },
                    {
                        [sequelize_1.Op.or]: [
                            { expiredAt: { [sequelize_1.Op.is]: null } },
                            { expiredAt: { [sequelize_1.Op.gt]: now } },
                        ],
                    },
                ],
            },
        });
        return {
            matched: items.length > 0,
            items,
        };
    }
    async existsByTypeAndValue(type, value, excludeId) {
        const where = { type, value };
        if (excludeId) {
            where.id = { [sequelize_1.Op.ne]: excludeId };
        }
        const count = await PromoterBlacklist_model_1.default.count({ where });
        return count > 0;
    }
    async softDelete(id) {
        return this.destroy({ where: { id } });
    }
    async setInactive(id) {
        return this.update({ isActive: false }, { where: { id } });
    }
}
exports.default = new PromoterBlacklistDao();
//# sourceMappingURL=PromoterBlacklist.dao.js.map