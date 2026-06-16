"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Promoter_model_1 = __importDefault(require("../models/Promoter.model"));
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
        const { page, pageSize, keyword, channelId, level, status } = params;
        const offset = (page - 1) * pageSize;
        const where = {};
        if (keyword) {
            where[sequelize_1.Op.or] = [
                { name: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { code: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { phone: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { nickname: { [sequelize_1.Op.like]: `%${keyword}%` } },
            ];
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
        return this.findAndCountAll({
            where,
            offset,
            limit: pageSize,
            order: [['createdAt', 'DESC']],
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
}
exports.default = new PromoterDao();
//# sourceMappingURL=Promoter.dao.js.map