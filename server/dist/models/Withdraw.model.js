"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Withdraw = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const enum_1 = require("../constants/enum");
const uuid_1 = require("uuid");
class Withdraw extends sequelize_1.Model {
}
exports.Withdraw = Withdraw;
Withdraw.init({
    id: {
        type: sequelize_1.DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: () => (0, uuid_1.v4)(),
    },
    withdrawNo: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    promoterId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: false,
        references: {
            model: 'promoters',
            key: 'id',
        },
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    fee: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    actualAmount: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    status: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
        defaultValue: enum_1.WithdrawStatus.PENDING,
    },
    payMethod: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
    },
    accountInfo: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    auditRemark: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    auditAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    auditUserId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    payTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    payRemark: {
        type: sequelize_1.DataTypes.STRING(500),
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
    tableName: 'withdraws',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        {
            name: 'idx_withdraw_no',
            fields: ['withdraw_no'],
        },
        {
            name: 'idx_promoter_id',
            fields: ['promoter_id'],
        },
        {
            name: 'idx_status',
            fields: ['status'],
        },
        {
            name: 'idx_pay_method',
            fields: ['pay_method'],
        },
        {
            name: 'idx_audit_user_id',
            fields: ['audit_user_id'],
        },
    ],
});
exports.default = Withdraw;
//# sourceMappingURL=Withdraw.model.js.map