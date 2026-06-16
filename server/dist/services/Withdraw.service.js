"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dao_1 = require("../dao");
const statusCode_1 = require("../constants/statusCode");
const error_middleware_1 = require("../middleware/error.middleware");
const enum_1 = require("../constants/enum");
class WithdrawService {
    async create(data) {
        const withdrawNo = await this.generateWithdrawNo();
        return dao_1.withdrawDao.create({
            ...data,
            withdrawNo,
            status: enum_1.WithdrawStatus.PENDING,
        });
    }
    async generateWithdrawNo() {
        const date = new Date();
        const timestamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
        const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        const withdrawNo = `W${timestamp}${random}`;
        const exists = await dao_1.withdrawDao.existsByWithdrawNo(withdrawNo);
        if (exists) {
            return this.generateWithdrawNo();
        }
        return withdrawNo;
    }
    async findById(id) {
        const withdraw = await dao_1.withdrawDao.findById(id);
        if (!withdraw) {
            throw new error_middleware_1.AppError('提现记录不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        return withdraw;
    }
    async findAll(params) {
        const { page, pageSize } = params;
        const { rows, count } = await dao_1.withdrawDao.findAllPaged(params);
        return {
            list: rows,
            total: count,
            page,
            pageSize,
            totalPages: Math.ceil(count / pageSize),
        };
    }
    async update(id, data) {
        const withdraw = await dao_1.withdrawDao.findById(id);
        if (!withdraw) {
            throw new error_middleware_1.AppError('提现记录不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.withdrawDao.update(data, { where: { id } });
        return dao_1.withdrawDao.findById(id);
    }
    async delete(id) {
        const withdraw = await dao_1.withdrawDao.findById(id);
        if (!withdraw) {
            throw new error_middleware_1.AppError('提现记录不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        await dao_1.withdrawDao.softDelete(id);
    }
    async apply(data) {
        if (!data.promoterId) {
            throw new error_middleware_1.AppError('推客ID不能为空', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        const promoter = await dao_1.promoterDao.findById(data.promoterId);
        if (!promoter) {
            throw new error_middleware_1.AppError('推客不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        const available = Number(promoter.availableCommission || 0);
        const amount = Number(data.amount || 0);
        if (amount <= 0) {
            throw new error_middleware_1.AppError('提现金额必须大于0', statusCode_1.BusinessCode.PARAM_ERROR);
        }
        if (amount > available) {
            throw new error_middleware_1.AppError('可用佣金不足', statusCode_1.BusinessCode.ERROR);
        }
        const fee = Number(data.fee || 0);
        const actualAmount = amount - fee;
        return this.create({
            ...data,
            actualAmount,
        });
    }
    async audit(id, approved, auditRemark, auditUserId) {
        const withdraw = await dao_1.withdrawDao.findById(id);
        if (!withdraw) {
            throw new error_middleware_1.AppError('提现记录不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (withdraw.status !== enum_1.WithdrawStatus.PENDING) {
            throw new error_middleware_1.AppError('提现单状态不允许审核', statusCode_1.BusinessCode.ERROR);
        }
        const status = approved ? enum_1.WithdrawStatus.APPROVED : enum_1.WithdrawStatus.REJECTED;
        await dao_1.withdrawDao.update({
            status: status,
            auditRemark,
            auditAt: new Date(),
            auditUserId,
        }, { where: { id } });
        if (!approved) {
            const promoter = await dao_1.promoterDao.findById(withdraw.promoterId);
            if (promoter) {
                const frozen = Number(promoter.frozenCommission || 0);
                const available = Number(promoter.availableCommission || 0);
                const amount = Number(withdraw.amount || 0);
                await dao_1.promoterDao.update({
                    frozenCommission: Math.max(0, frozen - amount),
                    availableCommission: available + amount,
                }, { where: { id: withdraw.promoterId } });
            }
        }
    }
    async pay(id, payRemark) {
        const withdraw = await dao_1.withdrawDao.findById(id);
        if (!withdraw) {
            throw new error_middleware_1.AppError('提现记录不存在', statusCode_1.BusinessCode.NOT_FOUND);
        }
        if (withdraw.status !== enum_1.WithdrawStatus.APPROVED) {
            throw new error_middleware_1.AppError('提现单状态不允许打款', statusCode_1.BusinessCode.ERROR);
        }
        await dao_1.withdrawDao.update({
            status: enum_1.WithdrawStatus.PAID,
            payTime: new Date(),
            payRemark,
        }, { where: { id } });
        const promoter = await dao_1.promoterDao.findById(withdraw.promoterId);
        if (promoter) {
            const frozen = Number(promoter.frozenCommission || 0);
            const amount = Number(withdraw.amount || 0);
            await dao_1.promoterDao.update({
                frozenCommission: Math.max(0, frozen - amount),
            }, { where: { id: withdraw.promoterId } });
        }
    }
}
exports.default = new WithdrawService();
//# sourceMappingURL=Withdraw.service.js.map