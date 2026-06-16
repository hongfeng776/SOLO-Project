"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dao_1 = require("../dao");
const statusCode_1 = require("../constants/statusCode");
const error_middleware_1 = require("../middleware/error.middleware");
const enum_1 = require("../constants/enum");
class CommissionService {
    async create(data) {
        return dao_1.commissionDao.create(data);
    }
    async findById(id) {
        const commission = await dao_1.commissionDao.findById(id);
        if (!commission) {
            throw new error_middleware_1.AppError('佣金记录不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        return commission;
    }
    async findAll(params) {
        const { page, pageSize } = params;
        const { rows, count } = await dao_1.commissionDao.findAllPaged(params);
        return {
            list: rows,
            total: count,
            page,
            pageSize,
            totalPages: Math.ceil(count / pageSize),
        };
    }
    async update(id, data) {
        const commission = await dao_1.commissionDao.findById(id);
        if (!commission) {
            throw new error_middleware_1.AppError('佣金记录不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.commissionDao.update(data, { where: { id } });
        return dao_1.commissionDao.findById(id);
    }
    async delete(id) {
        const commission = await dao_1.commissionDao.findById(id);
        if (!commission) {
            throw new error_middleware_1.AppError('佣金记录不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.commissionDao.softDelete(id);
    }
    async summary(params) {
        return dao_1.commissionDao.summary(params);
    }
    async settle(ids) {
        if (!ids || ids.length === 0) {
            throw new error_middleware_1.AppError('请选择要结算的记录', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        await dao_1.commissionDao.bulkUpdate(ids, {
            status: enum_1.CommissionStatus.SETTLED,
            settleTime: new Date(),
        });
    }
}
exports.default = new CommissionService();
//# sourceMappingURL=Commission.service.js.map