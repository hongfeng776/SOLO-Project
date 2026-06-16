"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermission = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class RolePermission extends sequelize_1.Model {
}
exports.RolePermission = RolePermission;
RolePermission.init({
    roleId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: false,
        primaryKey: true,
        references: {
            model: 'roles',
            key: 'id',
        },
    },
    permissionId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: false,
        primaryKey: true,
        references: {
            model: 'permissions',
            key: 'id',
        },
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'role_permissions',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            name: 'idx_role_id',
            fields: ['role_id'],
        },
        {
            name: 'idx_permission_id',
            fields: ['permission_id'],
        },
    ],
});
exports.default = RolePermission;
//# sourceMappingURL=RolePermission.model.js.map