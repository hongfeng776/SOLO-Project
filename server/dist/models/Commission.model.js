"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Commission = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const enum_1 = require("../constants/enum");
const uuid_1 = require("uuid");
class Commission extends sequelize_1.Model {
}
exports.Commission = Commission;
Commission.init({
    id: {
        type: sequelize_1.DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: () => (0, uuid_1.v4)(),
    },
    orderId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
        references: {
            model: 'orders',
            key: 'id',
        },
    },
    orderNo: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    promoterId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: false,
        references: {
            model: 'promoters',
            key: 'id',
        },
    },
    channelId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
        references: {
            model: 'channels',
            key: 'id',
        },
    },
    type: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    rate: {
        type: sequelize_1.DataTypes.DECIMAL(10, 4),
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
        defaultValue: enum_1.CommissionStatus.PENDING,
    },
    settleTime: {
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
    tableName: 'commissions',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        {
            name: 'idx_order_id',
            fields: ['order_id'],
        },
        {
            name: 'idx_order_no',
            fields: ['order_no'],
        },
        {
            name: 'idx_promoter_id',
            fields: ['promoter_id'],
        },
        {
            name: 'idx_channel_id',
            fields: ['channel_id'],
        },
        {
            name: 'idx_type',
            fields: ['type'],
        },
        {
            name: 'idx_status',
            fields: ['status'],
        },
    ],
});
exports.default = Commission;
//# sourceMappingURL=Commission.model.js.map