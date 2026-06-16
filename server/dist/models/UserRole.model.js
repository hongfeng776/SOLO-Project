"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class UserRole extends sequelize_1.Model {
}
exports.UserRole = UserRole;
UserRole.init({
    userId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: false,
        primaryKey: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    roleId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: false,
        primaryKey: true,
        references: {
            model: 'roles',
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
    tableName: 'user_roles',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            name: 'idx_user_id',
            fields: ['user_id'],
        },
        {
            name: 'idx_role_id',
            fields: ['role_id'],
        },
    ],
});
exports.default = UserRole;
//# sourceMappingURL=UserRole.model.js.map