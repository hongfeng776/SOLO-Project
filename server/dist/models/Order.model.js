"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const enum_1 = require("../constants/enum");
const uuid_1 = require("uuid");
class Order extends sequelize_1.Model {
}
exports.Order = Order;
Order.init({
    id: {
        type: sequelize_1.DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: () => (0, uuid_1.v4)(),
    },
    orderNo: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    channelId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
        references: {
            model: 'channels',
            key: 'id',
        },
    },
    promoterId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
        references: {
            model: 'promoters',
            key: 'id',
        },
    },
    userId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    productName: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
    },
    productSku: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    productImage: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    unitPrice: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
    quantity: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    totalAmount: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    discountAmount: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    payAmount: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    commissionRate: {
        type: sequelize_1.DataTypes.DECIMAL(10, 4),
        allowNull: true,
    },
    commissionAmount: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    status: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
        defaultValue: enum_1.OrderStatus.PENDING_PAY,
    },
    payTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    shipTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    completeTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    cancelTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    cancelReason: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    refundAmount: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    remark: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    receiverName: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    receiverPhone: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
    },
    receiverAddress: {
        type: sequelize_1.DataTypes.STRING(500),
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
    tableName: 'orders',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        {
            name: 'idx_order_no',
            fields: ['order_no'],
        },
        {
            name: 'idx_channel_id',
            fields: ['channel_id'],
        },
        {
            name: 'idx_promoter_id',
            fields: ['promoter_id'],
        },
        {
            name: 'idx_user_id',
            fields: ['user_id'],
        },
        {
            name: 'idx_status',
            fields: ['status'],
        },
        {
            name: 'idx_pay_time',
            fields: ['pay_time'],
        },
    ],
});
exports.default = Order;
//# sourceMappingURL=Order.model.js.map