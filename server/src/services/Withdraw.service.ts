import { withdrawDao, promoterDao } from '../dao';
import { WithdrawAttributes, WithdrawCreationAttributes } from '../models/Withdraw.model';
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import { WithdrawStatus } from '../constants/enum';
import MoneyUtils from '../utils/money';
import riskControlService from './RiskControl.service';

interface WithdrawQueryParams extends PaginationParams {
  promoterId?: string;
  status?: number;
}

class WithdrawService {
  public async create(data: WithdrawCreationAttributes) {
    const withdrawNo = await this.generateWithdrawNo();
    return withdrawDao.create({
      ...data,
      withdrawNo,
      status: WithdrawStatus.PENDING,
    });
  }

  private async generateWithdrawNo(): Promise<string> {
    const date = new Date();
    const timestamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    const withdrawNo = `W${timestamp}${random}`;
    const exists = await withdrawDao.existsByWithdrawNo(withdrawNo);
    if (exists) {
      return this.generateWithdrawNo();
    }
    return withdrawNo;
  }

  public async findById(id: string) {
    const withdraw = await withdrawDao.findById(id);
    if (!withdraw) {
      throw new AppError('提现记录不存在', BusinessCode.NOT_FOUND);
    }
    return withdraw;
  }

  public async findAll(params: WithdrawQueryParams): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const { rows, count } = await withdrawDao.findAllPaged(params);
    return {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async update(id: string, data: Partial<WithdrawAttributes>) {
    const withdraw = await withdrawDao.findById(id);
    if (!withdraw) {
      throw new AppError('提现记录不存在', BusinessCode.NOT_FOUND);
    }
    await withdrawDao.update(data, { where: { id } });
    return withdrawDao.findById(id);
  }

  public async delete(id: string): Promise<void> {
    const withdraw = await withdrawDao.findById(id);
    if (!withdraw) {
      throw new AppError('提现记录不存在', BusinessCode.NOT_FOUND);
    }
    await withdrawDao.softDelete(id);
  }

  public async apply(data: WithdrawCreationAttributes) {
    if (!data.promoterId) {
      throw new AppError('推客ID不能为空', BusinessCode.PARAM_ERROR);
    }
    const promoter = await promoterDao.findById(data.promoterId);
    if (!promoter) {
      throw new AppError('推客不存在', BusinessCode.NOT_FOUND);
    }
    const available = Number(promoter.availableCommission || 0);
    const amount = Number(data.amount || 0);
    if (!MoneyUtils.isGreater(amount, 0)) {
      throw new AppError('提现金额必须大于0', BusinessCode.PARAM_ERROR);
    }
    if (MoneyUtils.isGreater(amount, available)) {
      throw new AppError('可用佣金不足', BusinessCode.ERROR);
    }
    await riskControlService.checkWithdraw(data.promoterId, amount);
    const fee = Number(data.fee || 0);
    const actualAmount = MoneyUtils.subtract(amount, fee);
    return this.create({
      ...data,
      actualAmount,
    });
  }

  public async audit(id: string, approved: boolean, auditRemark?: string, auditUserId?: string): Promise<void> {
    const withdraw = await withdrawDao.findById(id);
    if (!withdraw) {
      throw new AppError('提现记录不存在', BusinessCode.NOT_FOUND);
    }
    if (withdraw.status !== WithdrawStatus.PENDING) {
      throw new AppError('提现单状态不允许审核', BusinessCode.ERROR);
    }
    const status = approved ? WithdrawStatus.APPROVED : WithdrawStatus.REJECTED;
    await withdrawDao.update(
      {
        status: status as any,
        auditRemark,
        auditAt: new Date(),
        auditUserId,
      } as Partial<WithdrawAttributes>,
      { where: { id } }
    );
    if (!approved) {
      const promoter = await promoterDao.findById(withdraw.promoterId);
      if (promoter) {
        const frozen = Number(promoter.frozenCommission || 0);
        const available = Number(promoter.availableCommission || 0);
        const amount = Number(withdraw.amount || 0);
        await promoterDao.update(
          {
            frozenCommission: MoneyUtils.subtract(frozen, amount),
            availableCommission: MoneyUtils.add(available, amount),
          } as any,
          { where: { id: withdraw.promoterId } }
        );
      }
    }
  }

  public async pay(id: string, payRemark?: string): Promise<void> {
    const withdraw = await withdrawDao.findById(id);
    if (!withdraw) {
      throw new AppError('提现记录不存在', BusinessCode.NOT_FOUND);
    }
    if (withdraw.status !== WithdrawStatus.APPROVED) {
      throw new AppError('提现单状态不允许打款', BusinessCode.ERROR);
    }
    await withdrawDao.update(
      {
        status: WithdrawStatus.PAID as any,
        payTime: new Date(),
        payRemark,
      } as Partial<WithdrawAttributes>,
      { where: { id } }
    );
    const promoter = await promoterDao.findById(withdraw.promoterId);
    if (promoter) {
      const frozen = Number(promoter.frozenCommission || 0);
      const amount = Number(withdraw.amount || 0);
      await promoterDao.update(
        {
          frozenCommission: MoneyUtils.subtract(frozen, amount),
        } as any,
        { where: { id: withdraw.promoterId } }
      );
    }
  }
}

export default new WithdrawService();
