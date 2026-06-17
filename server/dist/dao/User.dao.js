"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const User_model_1 = __importDefault(require("../models/User.model"));
class UserDao {
    async create(data, options) {
        return User_model_1.default.create(data, options);
    }
    async findByPk(id, options) {
        return User_model_1.default.findByPk(id, options);
    }
    async findOne(options) {
        return User_model_1.default.findOne(options);
    }
    async findAll(options) {
        return User_model_1.default.findAll(options);
    }
    async findAndCountAll(options) {
        return User_model_1.default.findAndCountAll(options);
    }
    async update(data, options) {
        return User_model_1.default.update(data, options);
    }
    async destroy(options) {
        return User_model_1.default.destroy(options);
    }
    async count(options) {
        return User_model_1.default.count(options);
    }
    async findByUsername(username) {
        return this.findOne({ where: { username } });
    }
    async findByEmail(email) {
        return this.findOne({ where: { email } });
    }
    async findByPhone(phone) {
        return this.findOne({ where: { phone } });
    }
    async findById(id) {
        return this.findByPk(id);
    }
    async existsByUsername(username) {
        const count = await this.count({ where: { username } });
        return count > 0;
    }
    async existsByEmail(email, excludeId) {
        const where = { email };
        if (excludeId) {
            where.id = { [sequelize_1.Op.ne]: excludeId };
        }
        const count = await this.count({ where });
        return count > 0;
    }
    async existsByPhone(phone, excludeId) {
        const where = { phone };
        if (excludeId) {
            where.id = { [sequelize_1.Op.ne]: excludeId };
        }
        const count = await this.count({ where });
        return count > 0;
    }
    async countByRole(role) {
        return this.count({ where: { role } });
    }
    async findAllPaged(params) {
        const { page, pageSize, role, status, positionLevel, keyword, startTime, endTime } = params;
        const offset = (page - 1) * pageSize;
        const where = {};
        if (role) {
            where.role = role;
        }
        if (status !== undefined) {
            where.status = status;
        }
        if (positionLevel !== undefined) {
            where.positionLevel = positionLevel;
        }
        if (keyword) {
            where[sequelize_1.Op.or] = [
                { username: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { nickname: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { email: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { phone: { [sequelize_1.Op.like]: `%${keyword}%` } },
            ];
        }
        if (startTime || endTime) {
            where.createdAt = {};
            if (startTime) {
                where.createdAt[sequelize_1.Op.gte] = new Date(startTime);
            }
            if (endTime) {
                const end = new Date(endTime);
                end.setHours(23, 59, 59, 999);
                where.createdAt[sequelize_1.Op.lte] = end;
            }
        }
        return this.findAndCountAll({
            where,
            offset,
            limit: pageSize,
            order: [['createdAt', 'DESC']],
        });
    }
    async findByPositionLevelRange(minLevel, maxLevel) {
        return this.findAll({
            where: {
                positionLevel: {
                    [sequelize_1.Op.between]: [minLevel, maxLevel],
                },
            },
            order: [['positionLevel', 'ASC']],
        });
    }
}
exports.default = new UserDao();
//# sourceMappingURL=User.dao.js.map