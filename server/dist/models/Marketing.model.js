"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Marketing = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const enum_1 = require("../constants/enum");
const uuid_1 = require("uuid");
class Marketing extends sequelize_1.Model {
}
exports.Marketing = Marketing;
Marketing.init({
    id: {
        type: sequelize_1.DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: () => (0, uuid_1.v4)(),
    },
    name: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
    },
    code: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM(enum_1.MarketingType.COUPON, enum_1.MarketingType.DISCOUNT, enum_1.MarketingType.CASHBACK, enum_1.MarketingType.REBATE, enum_1.MarketingType.BONUS),
        allowNull: false,
        defaultValue: enum_1.MarketingType.COUPON,
    },
    status: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
        defaultValue: enum_1.MarketingStatus.DRAFT,
    },
    startTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    endTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    rules: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    budget: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    usedAmount: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    maxCommissionRate: {
        type: sequelize_1.DataTypes.DECIMAL(10, 4),
        allowNull: true,
    },
    channels: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    coverImage: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    sort: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
    tableName: 'marketings',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        {
            name: 'idx_code',
            fields: ['code'],
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
            name: 'idx_start_time',
            fields: ['start_time'],
        },
        {
            name: 'idx_end_time',
            fields: ['end_time'],
        },
    ],
});
exports.default = Marketing;
//# sourceMappingURL=Marketing.model.js.map