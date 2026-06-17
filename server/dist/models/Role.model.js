"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const enum_1 = require("../constants/enum");
const uuid_1 = require("uuid");
class Role extends sequelize_1.Model {
}
exports.Role = Role;
Role.init({
    id: {
        type: sequelize_1.DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: () => (0, uuid_1.v4)(),
    },
    name: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    code: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    description: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
        defaultValue: enum_1.CommonStatus.ENABLED,
    },
    sort: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    level: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 5,
    },
    scenario: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: true,
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
    tableName: 'roles',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        {
            name: 'idx_code',
            fields: ['code'],
        },
        {
            name: 'idx_status',
            fields: ['status'],
        },
        {
            name: 'idx_level',
            fields: ['level'],
        },
        {
            name: 'idx_is_system',
            fields: ['is_system'],
        },
    ],
});
exports.default = Role;
//# sourceMappingURL=Role.model.js.map