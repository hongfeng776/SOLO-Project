"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionChangeLog = exports.ChangeAction = exports.ChangeTargetType = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
var ChangeTargetType;
(function (ChangeTargetType) {
    ChangeTargetType["ROLE"] = "role";
    ChangeTargetType["PERMISSION"] = "permission";
    ChangeTargetType["USER"] = "user";
})(ChangeTargetType || (exports.ChangeTargetType = ChangeTargetType = {}));
var ChangeAction;
(function (ChangeAction) {
    ChangeAction["CREATE"] = "create";
    ChangeAction["UPDATE"] = "update";
    ChangeAction["DELETE"] = "delete";
    ChangeAction["BATCH_ASSIGN"] = "batch_assign";
    ChangeAction["BATCH_REVOKE"] = "batch_revoke";
    ChangeAction["BATCH_COPY"] = "batch_copy";
})(ChangeAction || (exports.ChangeAction = ChangeAction = {}));
class PermissionChangeLog extends sequelize_1.Model {
}
exports.PermissionChangeLog = PermissionChangeLog;
PermissionChangeLog.init({
    id: { type: sequelize_1.DataTypes.STRING(36), primaryKey: true, defaultValue: () => (0, uuid_1.v4)() },
    operatorId: { type: sequelize_1.DataTypes.STRING(36), allowNull: false },
    operatorName: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
    targetId: { type: sequelize_1.DataTypes.STRING(36), allowNull: false },
    targetType: { type: sequelize_1.DataTypes.STRING(20), allowNull: false },
    targetName: { type: sequelize_1.DataTypes.STRING(100), allowNull: true },
    action: { type: sequelize_1.DataTypes.STRING(30), allowNull: false },
    module: { type: sequelize_1.DataTypes.STRING(50), allowNull: true },
    beforeData: { type: sequelize_1.DataTypes.JSON, allowNull: true },
    afterData: { type: sequelize_1.DataTypes.JSON, allowNull: true },
    changedFields: { type: sequelize_1.DataTypes.JSON, allowNull: true },
    affectedUserIds: { type: sequelize_1.DataTypes.JSON, allowNull: true },
    affectedUserCount: { type: sequelize_1.DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    reason: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    ip: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
    userAgent: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
}, {
    sequelize: database_1.sequelize,
    tableName: 'permission_change_logs',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
        { name: 'idx_operator_id', fields: ['operator_id'] },
        { name: 'idx_target', fields: ['target_type', 'target_id'] },
        { name: 'idx_action', fields: ['action'] },
        { name: 'idx_module', fields: ['module'] },
        { name: 'idx_created_at', fields: ['created_at'] },
    ],
});
exports.default = PermissionChangeLog;
//# sourceMappingURL=PermissionChangeLog.model.js.map