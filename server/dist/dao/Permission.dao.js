"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Permission_model_1 = __importDefault(require("../models/Permission.model"));
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