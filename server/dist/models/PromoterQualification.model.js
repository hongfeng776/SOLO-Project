"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoterQualification = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const enum_1 = require("../constants/enum");
const uuid_1 = require("uuid");
class PromoterQualification extends sequelize_1.Model {
}
exports.PromoterQualification = PromoterQualification;
PromoterQualification.init({
    id: {
        type: sequelize_1.DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: () => (0, uuid_1.v4)(),
    },
    promoterId: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: false,
        references: {
            model: 'promoters',
            key: 'id',
        },
    },
    type: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: false,
    },
    title: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: true,
    },
    fileUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: false,
    },
    expireAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    verifyStatus: {
        type: sequelize_1.DataTypes.TINYINT,
        allowNull: false,
        defaultValue: enum_1.VerifyStatus.UNVERIFIED,
    },
    verifyRemark: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    verifiedBy: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
    },
    verifiedAt: {
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
    tableName: 'promoter_qualifications',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            name: 'idx_promoter_id',
            fields: ['promoter_id'],
        },
        {
            name: 'idx_type',
            fields: ['type'],
        },
        {
            name: 'idx_verify_status',
            fields: ['verify_status'],
        },
    ],
});
exports.default = PromoterQualification;
//# sourceMappingURL=PromoterQualification.model.js.map