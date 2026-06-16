"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Promoter = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const enum_1 = require("../constants/enum");
const uuid_1 = require("uuid");
class Promoter extends sequelize_1.Model {
}
exports.Promoter = Promoter;
Promoter.init({
    id: {
        type: sequelize_1.DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: () => (0, uuid_1.v4)(),
    },
    channelId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
        references: {
            model: 'channels',
            key: 'id',
        },
    },
    code: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    nickname: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    avatar: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    phone: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: true,
        },
    },
    wechatId: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    idCard: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: true,
    },
    level: {
        type: sequelize_1.DataTypes.ENUM(enum_1.PromoterLevel.L1, enum_1.PromoterLevel.L2, enum_1.PromoterLevel.L3, enum_1.PromoterLevel.L4, enum_1.PromoterLevel.L5),
        allowNull: false,
        defaultValue: enum_1.PromoterLevel.L1,
    },
    status: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
        defaultValue: enum_1.PromoterStatus.NORMAL,
    },
    parentId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
        references: {
            model: 'promoters',
            key: 'id',
        },
    },
    totalOrders: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    totalAmount: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    totalCommission: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    availableCommission: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    frozenCommission: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    registerAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    lastActiveAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    remark: {
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
    tableName: 'promoters',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        {
            name: 'idx_code',
            fields: ['code'],
        },
        {
            name: 'idx_phone',
            fields: ['phone'],
        },
        {
            name: 'idx_channel_id',
            fields: ['channel_id'],
        },
        {
            name: 'idx_parent_id',
            fields: ['parent_id'],
        },
        {
            name: 'idx_level',
            fields: ['level'],
        },
        {
            name: 'idx_status',
            fields: ['status'],
        },
    ],
});
exports.default = Promoter;
//# sourceMappingURL=Promoter.model.js.map