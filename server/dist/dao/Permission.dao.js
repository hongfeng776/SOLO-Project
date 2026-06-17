"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Permission_model_1 = __importDefault(require("../models/Permission.model"));
const RolePermission_model_1 = __importDefault(require("../models/RolePermission.model"));
const OperationLog_model_1 = require("../models/OperationLog.model");
const enum_1 = require("../constants/enum");
class PermissionDao {
    async create(data, options) {
        return Permission_model_1.default.create(data, options);
    }
    async findByPk(id, options) {
        return Permission_model_1.default.findByPk(id, options);
    }
    async findOne(options) {
        return Permission_model_1.default.findOne(options);
    }
    async findAll(options) {
        return Permission_model_1.default.findAll(options);
    }
    async findAndCountAll(options) {
        return Permission_model_1.default.findAndCountAll(options);
    }
    async update(data, options) {
        return Permission_model_1.default.update(data, options);
    }
    async destroy(options) {
        return Permission_model_1.default.destroy(options);
    }
    async count(options) {
        return Permission_model_1.default.count(options);
    }
    async findById(id) {
        return this.findByPk(id);
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
    async existsByPath(path, excludeId) {
        const where = {
            path,
            type: { [sequelize_1.Op.in]: [enum_1.PermissionType.MENU, 'directory'] },
        };
        if (excludeId) {
            where.id = { [sequelize_1.Op.ne]: excludeId };
        }
        const count = await this.count({ where });
        return count > 0;
    }
    async findByIds(ids) {
        if (!ids || ids.length === 0)
            return [];
        return this.findAll({ where: { id: { [sequelize_1.Op.in]: ids } } });
    }
    async getChildren(parentId) {
        return this.findAll({ where: { parentId }, order: [['sort', 'ASC'], ['createdAt', 'ASC']] });
    }
    async hasChildren(parentId) {
        const count = await this.count({ where: { parentId } });
        return count > 0;
    }
    async findByModule(module) {
        return this.findAll({ where: { module }, order: [['sort', 'ASC'], ['createdAt', 'ASC']] });
    }
    async getMaxLevel() {
        const result = await Permission_model_1.default.findOne({
            attributes: [[(0, sequelize_1.fn)('MAX', (0, sequelize_1.col)('level')), 'maxLevel']],
            raw: true,
        });
        return result?.maxLevel || 0;
    }
    async countByStatus() {
        const enabled = await this.count({ where: { status: 1 } });
        const disabled = await this.count({ where: { status: 0 } });
        return { enabled, disabled };
    }
    async getBoundRoleCount(permissionId) {
        return RolePermission_model_1.default.count({ where: { permissionId } });
    }
    async getAccessLogCount(permissionId, days = 30) {
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - days);
        return OperationLog_model_1.OperationLog.count({
            where: {
                targetId: permissionId,
                createdAt: { [sequelize_1.Op.gte]: startTime },
            },
        });
    }
    async findAllPaged(params) {
        const { page, pageSize, keyword, type, module, status, level } = params;
        const offset = (page - 1) * pageSize;
        const where = {};
        if (keyword) {
            where[sequelize_1.Op.or] = [
                { name: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { code: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { path: { [sequelize_1.Op.like]: `%${keyword}%` } },
            ];
        }
        if (type)
            where.type = type;
        if (module)
            where.module = module;
        if (status !== undefined)
            where.status = status;
        if (level !== undefined)
            where.level = level;
        return Permission_model_1.default.findAndCountAll({
            where,
            offset,
            limit: pageSize,
            order: [['sort', 'ASC'], ['createdAt', 'ASC']],
        });
    }
    async findTree() {
        const allPermissions = await this.findAll({
            order: [['sort', 'ASC'], ['createdAt', 'ASC']],
        });
        return this.buildTree(allPermissions.map((p) => p.toJSON()));
    }
    buildTree(permissions) {
        const map = new Map();
        const roots = [];
        permissions.forEach((perm) => {
            map.set(perm.id, { ...perm, children: [] });
        });
        permissions.forEach((perm) => {
            const node = map.get(perm.id);
            if (perm.parentId && map.has(perm.parentId)) {
                const parent = map.get(perm.parentId);
                parent.children.push(node);
            }
            else {
                roots.push(node);
            }
        });
        return roots;
    }
}
exports.default = new PermissionDao();
//# sourceMappingURL=Permission.dao.js.map