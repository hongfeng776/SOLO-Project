"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const enum_1 = require("../constants/enum");
const uuid_1 = require("uuid");
class Permission extends sequelize_1.Model {
}
exports.Permission = Permission;
Permission.init({
    id: {
        type: sequelize_1.DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: () => (0, uuid_1.v4)(),
    },
    parentId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
        references: {
            model: 'permissions',
            key: 'id',
        },
    },
    name: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    code: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM(enum_1.PermissionType.MENU, enum_1.PermissionType.BUTTON, enum_1.PermissionType.API),
        allowNull: false,
        defaultValue: enum_1.PermissionType.MENU,
    },
    path: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    icon: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    component: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    method: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
    },
    sort: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    status: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
        defaultValue: enum_1.CommonStatus.ENABLED,
    },
    remark: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    module: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    level: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 1,
    },
    createdBy: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
    },
    createdByName: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    isSystem: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    visibleRange: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
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
    tableName: 'permissions',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        {
            name: 'idx_code',
            fields: ['code'],
        },
        {
            name: 'idx_parent_id',
            fields: ['parent_id'],
        },
        {
            name: 'idx_type',
            fields: ['type'],
        },
        {
            name: 'idx_status',
            fields: ['status'],
        },
        {
            name: 'idx_module',
            fields: ['module'],
        },
        {
            name: 'idx_is_system',
            fields: ['is_system'],
        },
        {
            name: 'idx_level',
            fields: ['level'],
        },
    ],
});
exports.default = Permission;
//# sourceMappingURL=Permission.model.js.map