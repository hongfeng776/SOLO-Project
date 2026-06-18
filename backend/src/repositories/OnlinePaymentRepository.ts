import { BaseRepository } from './BaseRepository';
import { OnlinePayment, Account, Customer, Merchant, Organization, User } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import dayjs from 'dayjs';
import { PaymentQueryParams } from '../types/payment';

export class OnlinePaymentRepository extends BaseRepository<OnlinePayment> {
  constructor() {
    super(OnlinePayment);
  }

  async findByPaymentNo(paymentNo: string): Promise<OnlinePayment | null> {
    return await this.model.findOne({ where: { payment_no: paymentNo } });
  }

  async findByOrderNo(orderNo: string): Promise<OnlinePayment | null> {
    return await this.model.findOne({ where: { order_no: orderNo } });
  }

  async findByRequestId(requestId: string): Promise<OnlinePayment | null> {
    return await this.model.findOne({ where: { request_id: requestId } });
  }

  async findByIp(ipAddress: string, startTime: Date, endTime: Date): Promise<OnlinePayment[]> {
    return await this.model.findAll({
      where: {
        client_ip: ipAddress,
        created_at: {
          [Op.gte]: startTime,
          [Op.lte]: endTime
        }
      },
      order: [['created_at', 'DESC']]
    });
  }

  async findByDeviceId(deviceId: string, startTime: Date, endTime: Date): Promise<OnlinePayment[]> {
    return await this.model.findAll({
      where: {
        device_id: deviceId,
        created_at: {
          [Op.gte]: startTime,
          [Op.lte]: endTime
        }
      },
      order: [['created_at', 'DESC']]
    });
  }

  async findByMerchantId(merchantId: string, params: PaymentQueryParams): Promise<any> {
    const { page, pageSize, ...queryParams } = params;
    const where: any = this.buildQuery({ ...queryParams, merchant_id: merchantId });

    const include = this.buildInclude();

    return await this.findPaginated(
      { page: page || 1, pageSize: pageSize || 10 },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include }
    );
  }

  async getDailyPaymentAmount(
    payerAccountNo: string,
    date: Date,
    statusIn: number[] = [1, 2]
  ): Promise<number> {
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    const result = await this.model.sum('actual_pay_amount', {
      where: {
        payer_account_no: payerAccountNo,
        status: { [Op.in]: statusIn },
        created_at: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay
        }
      }
    });

    return Number(result) || 0;
  }

  async getMonthlyPaymentAmount(
    payerAccountNo: string,
    date: Date,
    statusIn: number[] = [1, 2]
  ): Promise<number> {
    const startOfMonth = dayjs(date).startOf('month').toDate();
    const endOfMonth = dayjs(date).endOf('month').toDate();

    const result = await this.model.sum('actual_pay_amount', {
      where: {
        payer_account_no: payerAccountNo,
        status: { [Op.in]: statusIn },
        created_at: {
          [Op.gte]: startOfMonth,
          [Op.lte]: endOfMonth
        }
      }
    });

    return Number(result) || 0;
  }

  async getYearlyPaymentAmount(
    payerAccountNo: string,
    date: Date,
    statusIn: number[] = [1, 2]
  ): Promise<number> {
    const startOfYear = dayjs(date).startOf('year').toDate();
    const endOfYear = dayjs(date).endOf('year').toDate();

    const result = await this.model.sum('actual_pay_amount', {
      where: {
        payer_account_no: payerAccountNo,
        status: { [Op.in]: statusIn },
        created_at: {
          [Op.gte]: startOfYear,
          [Op.lte]: endOfYear
        }
      }
    });

    return Number(result) || 0;
  }

  async countDuplicateOrders(
    payerAccountNo: string,
    merchantId: string,
    amount: number,
    seconds: number = 60
  ): Promise<number> {
    const startTime = dayjs().subtract(seconds, 'second').toDate();

    return await this.model.count({
      where: {
        payer_account_no: payerAccountNo,
        merchant_id: merchantId,
        amount: amount,
        created_at: {
          [Op.gte]: startTime
        }
      }
    });
  }

  async countStrangeDeviceTransactions(
    deviceId: string,
    startTime: Date,
    endTime: Date,
    ipLocationDiff: boolean = true
  ): Promise<number> {
    const where: any = {
      device_id: deviceId,
      created_at: {
        [Op.gte]: startTime,
        [Op.lte]: endTime
      }
    };

    if (ipLocationDiff) {
      where.ip_location = { [Op.ne]: null };
    }

    return await this.model.count({ where });
  }

  async findByCustomerIdAndStatus(
    customerId: string,
    status: number | number[]
  ): Promise<OnlinePayment[]> {
    const where: any = { payer_customer_id: customerId };
    if (Array.isArray(status)) {
      where.status = { [Op.in]: status };
    } else {
      where.status = status;
    }

    return await this.model.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
  }

  async generatePaymentNo(): Promise<string> {
    const prefix = 'ONP';
    const datePart = dayjs().format('YYYYMMDDHHmmss');
    let seq = Math.floor(Math.random() * 9000 + 1000).toString();
    let finalNo = '';
    let attempts = 0;
    while (attempts < 100) {
      finalNo = `${prefix}${datePart}${seq}`;
      const exists = await this.model.count({ where: { payment_no: finalNo } });
      if (exists === 0) break;
      seq = Math.floor(Math.random() * 9000 + 1000).toString();
      attempts++;
    }
    return finalNo;
  }

  buildQuery(params: PaymentQueryParams): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { payment_no: { [Op.like]: `%${params.keyword}%` } },
        { order_no: { [Op.like]: `%${params.keyword}%` } },
        { request_id: { [Op.like]: `%${params.keyword}%` } },
        { payer_account_no: { [Op.like]: `%${params.keyword}%` } },
        { merchant_name: { [Op.like]: `%${params.keyword}%` } },
        { product_desc: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.payment_no) {
      where.payment_no = { [Op.like]: `%${params.payment_no}%` };
    }

    if (params.order_no) {
      where.order_no = { [Op.like]: `%${params.order_no}%` };
    }

    if (params.request_id) {
      where.request_id = { [Op.like]: `%${params.request_id}%` };
    }

    if (params.payer_account_no) {
      where.payer_account_no = params.payer_account_no;
    }

    if (params.payer_customer_id) {
      where.payer_customer_id = params.payer_customer_id;
    }

    if (params.merchant_id) {
      where.merchant_id = params.merchant_id;
    }

    if (params.merchant_name) {
      where.merchant_name = { [Op.like]: `%${params.merchant_name}%` };
    }

    if (params.pay_channel !== undefined) {
      if (Array.isArray(params.pay_channel)) {
        where.pay_channel = { [Op.in]: params.pay_channel };
      } else {
        where.pay_channel = params.pay_channel;
      }
    }

    if (params.pay_scene !== undefined) {
      if (Array.isArray(params.pay_scene)) {
        where.pay_scene = { [Op.in]: params.pay_scene };
      } else {
        where.pay_scene = params.pay_scene;
      }
    }

    if (params.status !== undefined) {
      if (Array.isArray(params.status)) {
        where.status = { [Op.in]: params.status };
      } else {
        where.status = params.status;
      }
    }

    if (params.risk_level !== undefined) {
      if (Array.isArray(params.risk_level)) {
        where.risk_level = { [Op.in]: params.risk_level };
      } else {
        where.risk_level = params.risk_level;
      }
    }

    if (params.need_review !== undefined) {
      where.need_review = params.need_review;
    }

    if (params.org_id) {
      where.org_id = params.org_id;
    }

    if (params.operator_id) {
      where.operator_id = params.operator_id;
    }

    if (params.reviewer_id) {
      where.reviewer_id = params.reviewer_id;
    }

    if (params.device_id) {
      where.device_id = params.device_id;
    }

    if (params.client_ip) {
      where.client_ip = params.client_ip;
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

    if (params.min_amount !== undefined && params.max_amount !== undefined) {
      where.amount = { [Op.between]: [params.min_amount, params.max_amount] };
    } else if (params.min_amount !== undefined) {
      where.amount = { [Op.gte]: params.min_amount };
    } else if (params.max_amount !== undefined) {
      where.amount = { [Op.lte]: params.max_amount };
    }

    if (params.pay_time_start) {
      where.pay_time = {
        ...(where.pay_time || {}),
        [Op.gte]: dayjs(params.pay_time_start).startOf('day').toDate()
      };
    }

    if (params.pay_time_end) {
      where.pay_time = {
        ...(where.pay_time || {}),
        [Op.lte]: dayjs(params.pay_time_end).endOf('day').toDate()
      };
    }

    return where;
  }

  buildInclude(scopes?: string[]): Includeable[] {
    const includes: Includeable[] = [];

    if (!scopes || scopes.includes('merchant')) {
      includes.push(this.getMerchantInclude());
    }
    if (!scopes || scopes.includes('account')) {
      includes.push(this.getPayerAccountInclude());
    }
    if (!scopes || scopes.includes('customer')) {
      includes.push(this.getPayerCustomerInclude());
    }
    if (!scopes || scopes.includes('organization')) {
      includes.push(this.getOrganizationInclude());
    }
    if (!scopes || scopes.includes('operator')) {
      includes.push(this.getOperatorInclude());
    }

    return includes;
  }

  getMerchantInclude(): Includeable {
    return {
      model: Merchant,
      required: false,
      attributes: ['id', 'merchant_no', 'business_name', 'mcc', 'status', 'risk_level']
    };
  }

  getPayerAccountInclude(): Includeable {
    return {
      model: Account,
      as: 'payer_account',
      required: false,
      attributes: ['id', 'account_no', 'account_type', 'balance', 'available_balance', 'frozen_amount', 'status']
    };
  }

  getPayerCustomerInclude(): Includeable {
    return {
      model: Customer,
      as: 'payer_customer',
      required: false,
      attributes: ['id', 'customer_no', 'customer_name', 'id_card_no', 'mobile', 'risk_level', 'customer_level']
    };
  }

  getOrganizationInclude(): Includeable {
    return {
      model: Organization,
      required: false,
      attributes: ['id', 'name']
    };
  }

  getOperatorInclude(): Includeable {
    return {
      model: User,
      as: 'operator',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  getReviewerInclude(): Includeable {
    return {
      model: User,
      as: 'reviewer',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }
}
