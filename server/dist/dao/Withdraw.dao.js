"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Withdraw_model_1 = __importDefault(require("../models/Withdraw.model"));
class WithdrawDao {
    async create(data, options) {
        return Withdraw_model_1.default.create(data, options);
    }
    async findByPk(id, options) {
        return Withdraw_model_1.default.findByPk(id, options);
    }
    async findOne(options) {
        return Withdraw_model_1.default.findOne(options);
    }
    async findAll(options) {
        return Withdraw_model_1.default.findAll(options);
    }
    async findAndCountAll(options) {
        return Withdraw_model_1.default.findAndCountAll(options);
    }
    async update(data, options) {
        return Withdraw_model_1.default.update(data, options);
    }
    async destroy(options) {
        return Withdraw_model_1.default.destroy(options);
    }
    async count(options) {
        return Withdraw_model_1.default.count(options);
    }
    async findById(id) {
        return this.findByPk(id);
    }
    async findAllPaged(params) {
        const { page, pageSize, promoterId, status } = params;
        const offset = (page - 1) * pageSize;
        const where = {};
        if (promoterId) {
            where.promoterId = promoterId;
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
    async findByWithdrawNo(withdrawNo) {
        return this.findOne({ where: { withdrawNo } });
    }
    async existsByWithdrawNo(withdrawNo) {
        const count = await this.count({ where: { withdrawNo } });
        return count > 0;
    }
}
exports.default = new WithdrawDao();
//# sourceMappingURL=Withdraw.dao.js.map