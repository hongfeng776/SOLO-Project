"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleDeletionLog = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
class RoleDeletionLog extends sequelize_1.Model {
}
exports.RoleDeletionLog = RoleDeletionLog;
RoleDeletionLog.init({
    id: { type: sequelize_1.DataTypes.STRING(36), primaryKey: true, defaultValue: () => (0, uuid_1.v4)() },
    roleId: { type: sequelize_1.DataTypes.STRING(36), allowNull: false },
    roleName: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
    roleCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
    deletedBy: { type: sequelize_1.DataTypes.STRING(36), allowNull: false },
    deletedByName: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
    reason: { type: sequelize_1.DataTypes.STRING(255), allowNull: true },
    permissionSnapshot: { type: sequelize_1.DataTypes.JSON, allowNull: true },
    boundUsers: { type: sequelize_1.DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
}, {
    sequelize: database_1.sequelize,
    tableName: 'role_deletion_logs',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
        { name: 'idx_role_name', fields: ['role_name'] },
        { name: 'idx_deleted_at', fields: ['deleted_at'] },
        { name: 'idx_deleted_by', fields: ['deleted_by'] },
    ],
});
exports.default = RoleDeletionLog;
//# sourceMappingURL=RoleDeletionLog.model.js.map