"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const enum_1 = require("../constants/enum");
const uuid_1 = require("uuid");
class User extends sequelize_1.Model {
}
exports.User = User;
User.init({
    id: {
        type: sequelize_1.DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: () => (0, uuid_1.v4)(),
    },
    username: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    password: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    nickname: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        defaultValue: '',
    },
    avatar: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: true,
        },
    },
    phone: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
    },
    role: {
        type: sequelize_1.DataTypes.ENUM(enum_1.UserRole.ADMIN, enum_1.UserRole.USER, enum_1.UserRole.GUEST),
        allowNull: false,
        defaultValue: enum_1.UserRole.USER,
    },
    status: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
        defaultValue: enum_1.UserStatus.ACTIVE,
    },
    position: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    positionLevel: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 10,
        },
    },
    createdBy: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
    },
    createdByName: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    activatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    lastActiveAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    lastLoginAt: {
        type: sequelize_1.DataTypes.DATE,
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
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        {
            name: 'idx_username',
            fields: ['username'],
        },
        {
            name: 'idx_status',
            fields: ['status'],
        },
    ],
});
exports.default = User;
//# sourceMappingURL=User.model.js.map