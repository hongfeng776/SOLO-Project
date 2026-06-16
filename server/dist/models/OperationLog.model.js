"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationLog = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
class OperationLog extends sequelize_1.Model {
}
exports.OperationLog = OperationLog;
OperationLog.init({
    id: { type: sequelize_1.DataTypes.STRING(36), primaryKey: true, defaultValue: () => (0, uuid_1.v4)() },
    userId: { type: sequelize_1.DataTypes.STRING(36), allowNull: false },
    userName: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
    module: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
    action: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
    targetId: { type: sequelize_1.DataTypes.STRING(36), allowNull: true },
    targetType: { type: sequelize_1.DataTypes.STRING(50), allowNull: true },
    detail: { type: sequelize_1.DataTypes.JSON, allowNull: true },
    ip: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
    userAgent: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    status: { type: sequelize_1.DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
    errorMessage: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    duration: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
}, {
    sequelize: database_1.sequelize,
    tableName: 'operation_logs',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
        { name: 'idx_user_id', fields: ['user_id'] },
        { name: 'idx_module', fields: ['module'] },
        { name: 'idx_action', fields: ['action'] },
        { name: 'idx_target', fields: ['target_type', 'target_id'] },
        { name: 'idx_created_at', fields: ['created_at'] },
        { name: 'idx_status', fields: ['status'] },
    ],
});
exports.default = OperationLog;
//# sourceMappingURL=OperationLog.model.js.map