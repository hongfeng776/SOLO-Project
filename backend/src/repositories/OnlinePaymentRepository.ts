import { BaseRepository } from './BaseRepository';
import { OnlinePayment } from '../models';
import { Op, WhereOptions } from 'sequelize';
import dayjs from 'dayjs';
import { OnlinePaymentQueryParams } from '../types/onlinePayment';

export class OnlinePaymentRepository extends BaseRepository<OnlinePayment> {
  constructor() {
    super(OnlinePayment);
  }

  async findByPaymentNo(paymentNo: string): Promise<OnlinePayment | null> {
    return await this.model.findOne({ where: { payment_no: paymentNo } });
  }

  async generatePaymentNo(): Promise<string> {
    const prefix = 'OP';
    const timestamp = dayjs().format('YYYYMMDDHHmmss');
    const random = Math.floor(100000 + Math.random() * 900000).toString();
    const paymentNo = `${prefix}${timestamp}${random}`;
    const exists = await this.model.count({ where: { payment_no: paymentNo } });
    if (exists === 0) {
      return paymentNo;
    }
    return this.generatePaymentNo();
  }

  async findByOrderNo(orderNo: string): Promise<OnlinePayment | null> {
    return await this.model.findOne({ where: { order_no: orderNo } });
  }

  async findByPayerAccount(accountNo: string): Promise<OnlinePayment[]> {
    return await this.model.findAll({
      where: { payer_account_no: accountNo },
      order: [['created_at', 'DESC']]
    });
  }

  async findByMerchant(merchantNo: string): Promise<OnlinePayment[]> {
    return await this.model.findAll({
      where: { merchant_no: merchantNo },
      order: [['created_at', 'DESC']]
    });
  }

  async findByDeviceId(deviceId: string): Promise<OnlinePayment[]> {
    return await this.model.findAll({
      where: { device_id: deviceId },
      order: [['created_at', 'DESC']]
    });
  }

  async getDailyPaymentAmount(accountNo: string, date: string, status?: number): Promise<number> {
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    const where: any = {
      payer_account: accountNo,
      created_at: {
        [Op.gte]: startOfDay,
        [Op.lte]: endOfDay
      }
    };

    if (status !== undefined) {
      where.status = status;
    }

    const result = await this.model.sum('amount', { where });
    return Number(result) || 0;
  }

  async getMonthlyPaymentAmount(accountNo: string, month: string, status?: number): Promise<number> {
    const startOfMonth = dayjs(month).startOf('month').toDate();
    const endOfMonth = dayjs(month).endOf('month').toDate();

    const where: any = {
      payer_account: accountNo,
      created_at: {
        [Op.gte]: startOfMonth,
        [Op.lte]: endOfMonth
      }
    };

    if (status !== undefined) {
      where.status = status;
    }

    const result = await this.model.sum('amount', { where });
    return Number(result) || 0;
  }

  async getSceneDailyAmount(accountNo: string, scene: number, date: string): Promise<number> {
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    const result = await this.model.sum('amount', {
      where: {
        payer_account_no: accountNo,
        scene: scene,
        created_at: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay
        }
      }
    });

    return Number(result) || 0;
  }

  async countDuplicateOrders(orderNo: string, excludeId?: string): Promise<number> {
    const where: any = { order_no: orderNo };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    return await this.model.count({ where });
  }

  async countHighFrequencyTransactions(
    accountNo: string,
    startTime: Date,
    endTime: Date,
    minAmount?: number
  ): Promise<number> {
    const where: any = {
      payer_account: accountNo,
      created_at: {
        [Op.gte]: startTime,
        [Op.lte]: endTime
      }
    };

    if (minAmount !== undefined) {
      where.amount = { [Op.gte]: minAmount };
    }

    return await this.model.count({ where });
  }

  async countStrangerDeviceTransactions(accountNo: string, deviceId: string): Promise<number> {
    return await this.model.count({
      where: {
        payer_account_no: accountNo,
        device_id: { [Op.ne]: deviceId }
      }
    });
  }

  async findAbnormalByLocation(accountNo: string, location: string): Promise<OnlinePayment[]> {
    return await this.model.findAll({
      where: {
        payer_account_no: accountNo,
        location: { [Op.ne]: location }
      },
      order: [['created_at', 'DESC']]
    });
  }

  buildQuery(params: OnlinePaymentQueryParams): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { payment_no: { [Op.like]: `%${params.keyword}%` } },
        { order_no: { [Op.like]: `%${params.keyword}%` } },
        { payer_account_no: { [Op.like]: `%${params.keyword}%` } },
        { merchant_no: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.payment_no) {
      where.payment_no = { [Op.like]: `%${params.payment_no}%` };
    }

    if (params.order_no) {
      where.order_no = { [Op.like]: `%${params.order_no}%` };
    }

    if (params.channel_type !== undefined) {
      where.channel_type = params.channel_type;
    }

    if (params.merchant_no) {
      where.merchant_no = params.merchant_no;
    }

    if (params.payer_account_no) {
      where.payer_account_no = params.payer_account_no;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.risk_level !== undefined) {
      where.risk_level = params.risk_level;
    }

    if (params.pay_scene !== undefined) {
      where.pay_scene = params.pay_scene;
    }

    if (params.device_id) {
      where.device_id = params.device_id;
    }

    if (params.start_time) {
      where.created_at = {
        ...(where.created_at || {}),
        [Op.gte]: dayjs(params.start_time).startOf('day').toDate()
      };
    }

    if (params.end_time) {
      where.created_at = {
        ...(where.created_at || {}),
        [Op.lte]: dayjs(params.end_time).endOf('day').toDate()
      };
    }

    if (params.min_amount !== undefined) {
      where.amount = {
        ...(where.amount || {}),
        [Op.gte]: params.min_amount
      };
    }

    if (params.max_amount !== undefined) {
      where.amount = {
        ...(where.amount || {}),
        [Op.lte]: params.max_amount
      };
    }

    return where;
  }
}
