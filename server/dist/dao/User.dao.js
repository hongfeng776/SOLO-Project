"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
    async findById(id) {
        return this.findByPk(id);
    }
    async existsByUsername(username) {
        const count = await this.count({ where: { username } });
        return count > 0;
    }
}
exports.default = new UserDao();
//# sourceMappingURL=User.dao.js.map