"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelExtension = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
class ChannelExtension extends sequelize_1.Model {
}
exports.ChannelExtension = ChannelExtension;
ChannelExtension.init({
    id: { type: sequelize_1.DataTypes.STRING(36), primaryKey: true, defaultValue: () => (0, uuid_1.v4)() },
    channelId: { type: sequelize_1.DataTypes.STRING(36), allowNull: false, references: { model: 'channels', key: 'id' } },
    extensionType: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
    config: { type: sequelize_1.DataTypes.JSON, allowNull: false },
    commissionRules: { type: sequelize_1.DataTypes.JSON, allowNull: true },
    settlementRules: { type: sequelize_1.DataTypes.JSON, allowNull: true },
    status: { type: sequelize_1.DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
    createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
}, {
    sequelize: database_1.sequelize,
    tableName: 'channel_extensions',
    timestamps: true,
    underscored: true,
    indexes: [
        { name: 'idx_channel_id', fields: ['channel_id'] },
        { name: 'idx_extension_type', fields: ['extension_type'] },
        { name: 'idx_status', fields: ['status'] },
    ],
});
exports.default = ChannelExtension;
//# sourceMappingURL=ChannelExtension.model.js.map