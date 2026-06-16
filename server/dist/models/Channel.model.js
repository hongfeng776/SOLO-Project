"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Channel = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const enum_1 = require("../constants/enum");
const uuid_1 = require("uuid");
class Channel extends sequelize_1.Model {
}
exports.Channel = Channel;
Channel.init({
    id: {
        type: sequelize_1.DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: () => (0, uuid_1.v4)(),
    },
    name: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    code: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM(enum_1.ChannelType.WECHAT, enum_1.ChannelType.DOUYIN, enum_1.ChannelType.KUAISHOU, enum_1.ChannelType.XIAOHONGSHU, enum_1.ChannelType.WEIBO, enum_1.ChannelType.OTHER),
        allowNull: false,
        defaultValue: enum_1.ChannelType.OTHER,
    },
    contactName: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    contactPhone: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
    },
    contactEmail: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: true,
        },
    },
    commissionRate: {
        type: sequelize_1.DataTypes.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 0,
    },
    status: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
        defaultValue: enum_1.ChannelStatus.ENABLED,
    },
    remark: {
        type: sequelize_1.DataTypes.TEXT,
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
    tableName: 'channels',
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
    ],
});
exports.default = Channel;
//# sourceMappingURL=Channel.model.js.map