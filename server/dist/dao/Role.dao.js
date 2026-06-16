"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Role_model_1 = __importDefault(require("../models/Role.model"));
const RolePermission_model_1 = __importDefault(require("../models/RolePermission.model"));
const Permission_model_1 = __importDefault(require("../models/Permission.model"));
class RoleDao {
    async create(data, options) {
        return Role_model_1.default.create(data, options);
    }
    async findByPk(id, options) {
        return Role_model_1.default.findByPk(id, options);
    }
    async findOne(options) {
        return Role_model_1.default.findOne(options);
    }
    async findAll(options) {
        return Role_model_1.default.findAll(options);
    }
    async findAndCountAll(options) {
        return Role_model_1.default.findAndCountAll(options);
    }
    async update(data, options) {
        return Role_model_1.default.update(data, options);
    }
    async destroy(options) {
        return Role_model_1.default.destroy(options);
    }
    async count(options) {
        return Role_model_1.default.count(options);
    }
    async findById(id) {
        return this.findByPk(id);
    }
    async findAllPaged(params) {
        const { page, pageSize, keyword, status } = params;
        const offset = (page - 1) * pageSize;
        const where = {};
        if (keyword) {
            where[sequelize_1.Op.or] = [
                { name: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { code: { [sequelize_1.Op.like]: `%${keyword}%` } },
            ];
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
    async assignPermissions(roleId, permissionIds) {
        await RolePermission_model_1.default.destroy({ where: { roleId } });
        if (permissionIds.length > 0) {
            const records = permissionIds.map((permissionId) => ({
                roleId,
                permissionId,
            }));
            await RolePermission_model_1.default.bulkCreate(records);
        }
    }
    async getPermissions(roleId) {
        const rolePermissions = await RolePermission_model_1.default.findAll({
            where: { roleId },
            attributes: ['permissionId'],
        });
        const permissionIds = rolePermissions.map((rp) => rp.permissionId);
        if (permissionIds.length === 0) {
            return [];
        }
        return Permission_model_1.default.findAll({
            where: { id: { [sequelize_1.Op.in]: permissionIds } },
            order: [['sort', 'ASC']],
        });
    }
}
exports.default = new RoleDao();
//# sourceMappingURL=Role.dao.js.map