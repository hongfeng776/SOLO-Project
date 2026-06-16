"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dao_1 = require("../dao");
const statusCode_1 = require("../constants/statusCode");
const error_middleware_1 = require("../middleware/error.middleware");
class MarketingService {
    async create(data) {
        const exists = await dao_1.marketingDao.existsByCode(data.code);
        if (exists) {
            throw new error_middleware_1.AppError('活动编码已存在', statusCode_1.BusinessCode.ERROR);
        }
        return dao_1.marketingDao.create(data);
    }
    async findById(id) {
        const marketing = await dao_1.marketingDao.findById(id);
        if (!marketing) {
            throw new error_middleware_1.AppError('营销活动不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        return marketing;
    }
    async findAll(params) {
        const { page, pageSize } = params;
        const { rows, count } = await dao_1.marketingDao.findAllPaged(params);
        return {
            list: rows,
            total: count,
            page,
            pageSize,
            totalPages: Math.ceil(count / pageSize),
        };
    }
    async update(id, data) {
        const marketing = await dao_1.marketingDao.findById(id);
        if (!marketing) {
            throw new error_middleware_1.AppError('营销活动不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (data.code && data.code !== marketing.code) {
            const exists = await dao_1.marketingDao.existsByCodeAndId(data.code, id);
            if (exists) {
                throw new error_middleware_1.AppError('活动编码已存在', statusCode_1.BusinessCode.ERROR);
            }
        }
        await dao_1.marketingDao.update(data, { where: { id } });
        return dao_1.marketingDao.findById(id);
    }
    async delete(id) {
        const marketing = await dao_1.marketingDao.findById(id);
        if (!marketing) {
            throw new error_middleware_1.AppError('营销活动不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.marketingDao.softDelete(id);
    }
    async bulkDelete(ids) {
        if (!ids || ids.length === 0) {
            throw new error_middleware_1.AppError('请选择要删除的记录', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        await dao_1.marketingDao.bulkSoftDelete(ids);
    }
    async updateStatus(id, status) {
        const marketing = await dao_1.marketingDao.findById(id);
        if (!marketing) {
            throw new error_middleware_1.AppError('营销活动不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.marketingDao.update({ status: status }, { where: { id } });
    }
}
exports.default = new MarketingService();
//# sourceMappingURL=Marketing.service.js.map