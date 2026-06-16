"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommissionRule = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
class CommissionRule extends sequelize_1.Model {
}
exports.CommissionRule = CommissionRule;
CommissionRule.init({
    id: { type: sequelize_1.DataTypes.STRING(36), primaryKey: true, defaultValue: () => (0, uuid_1.v4)() },
    name: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
    code: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true },
    ruleType: { type: sequelize_1.DataTypes.STRING(30), allowNull: false },
    condition: { type: sequelize_1.DataTypes.JSON, allowNull: false },
    calculation: { type: sequelize_1.DataTypes.JSON, allowNull: false },
    priority: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    enabled: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    effectiveStartTime: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    effectiveEndTime: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
}, {
    sequelize: database_1.sequelize,
    tableName: 'commission_rules',
    timestamps: true,
    underscored: true,
    indexes: [
        { name: 'idx_code', fields: ['code'] },
        { name: 'idx_rule_type', fields: ['rule_type'] },
        { name: 'idx_enabled', fields: ['enabled'] },
        { name: 'idx_priority', fields: ['priority'] },
    ],
});
exports.default = CommissionRule;
//# sourceMappingURL=CommissionRule.model.js.map