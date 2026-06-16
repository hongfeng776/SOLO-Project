"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dao_1 = require("../dao");
const statusCode_1 = require("../constants/statusCode");
const error_middleware_1 = require("../middleware/error.middleware");
class PromoterService {
    async create(data) {
        const code = await this.generateCode();
        return dao_1.promoterDao.create({
            ...data,
            code,
            registerAt: data.registerAt || new Date(),
        });
    }
    async generateCode() {
        const date = new Date();
        const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const todayCount = await dao_1.promoterDao.getTodayCount();
        const seq = String(todayCount + 1).padStart(6, '0');
        const code = `P${dateStr}${seq}`;
        const exists = await dao_1.promoterDao.existsByCode(code);
        if (exists) {
            return this.generateCode();
        }
        return code;
    }
    async findById(id) {
        const promoter = await dao_1.promoterDao.findById(id);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        return promoter;
    }
    async findAll(params) {
        const { page, pageSize } = params;
        const { rows, count } = await dao_1.promoterDao.findAllPaged(params);
        return {
            list: rows,
            total: count,
            page,
            pageSize,
            totalPages: Math.ceil(count / pageSize),
        };
    }
    async update(id, data) {
        const promoter = await dao_1.promoterDao.findById(id);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (data.code && data.code !== promoter.code) {
            const exists = await dao_1.promoterDao.existsByCodeAndId(data.code, id);
            if (exists) {
                throw new error_middleware_1.AppError('推客编号已存在', statusCode_1.BusinessCode.ERROR);
            }
        }
        await dao_1.promoterDao.update(data, { where: { id } });
        return dao_1.promoterDao.findById(id);
    }
    async delete(id) {
        const promoter = await dao_1.promoterDao.findById(id);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.promoterDao.softDelete(id);
    }
    async bulkDelete(ids) {
        if (!ids || ids.length === 0) {
            throw new error_middleware_1.AppError('请选择要删除的记录', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        await dao_1.promoterDao.bulkSoftDelete(ids);
    }
    async updateStatus(id, status) {
        const promoter = await dao_1.promoterDao.findById(id);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.promoterDao.update({ status: status }, { where: { id } });
    }
}
exports.default = new PromoterService();
//# sourceMappingURL=Promoter.service.js.map