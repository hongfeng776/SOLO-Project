"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Marketing_model_1 = __importDefault(require("../models/Marketing.model"));
class MarketingDao {
    async create(data, options) {
        return Marketing_model_1.default.create(data, options);
    }
    async findByPk(id, options) {
        return Marketing_model_1.default.findByPk(id, options);
    }
    async findOne(options) {
        return Marketing_model_1.default.findOne(options);
    }
    async findAll(options) {
        return Marketing_model_1.default.findAll(options);
    }
    async findAndCountAll(options) {
        return Marketing_model_1.default.findAndCountAll(options);
    }
    async update(data, options) {
        return Marketing_model_1.default.update(data, options);
    }
    async destroy(options) {
        return Marketing_model_1.default.destroy(options);
    }
    async count(options) {
        return Marketing_model_1.default.count(options);
    }
    async findById(id) {
        return this.findByPk(id);
    }
    async findAllPaged(params) {
        const { page, pageSize, keyword, type, status } = params;
        const offset = (page - 1) * pageSize;
        const where = {};
        if (keyword) {
            where[sequelize_1.Op.or] = [
                { name: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { code: { [sequelize_1.Op.like]: `%${keyword}%` } },
            ];
        }
        if (type) {
            where.type = type;
        }
        if (status !== undefined) {
            where.status = status;
        }
        return this.findAndCountAll({
            where,
            offset,
            limit: pageSize,
            order: [['sort', 'ASC'], ['createdAt', 'DESC']],
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
}
exports.default = new MarketingDao();
//# sourceMappingURL=Marketing.dao.js.map