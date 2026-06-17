import { Op } from 'sequelize';
import { daos } from '../dao';

export enum OrderStatus {
  PENDING_PAYMENT = 0,
  PENDING_SHIPMENT = 1,
  SHIPPED = 2,
  COMPLETED = 3,
  CANCELLED = 4,
}

export enum PayType {
  UNKNOWN = 0,
  WECHAT = 1,
  ALIPAY = 2,
  BANK_CARD = 3,
}

export enum ExceptionType {
  PAY_STATUS = 1,
  STOCK_INSUFFICIENT = 2,
  MERCHANT_NO_PERMISSION = 3,
  LOGISTICS_UNSUPPORTED = 4,
  DUPLICATE_ORDER = 5,
  AMOUNT_ABNORMAL = 6,
  OTHER = 7,
}

export interface ValidationResult {
  valid: boolean;
  exceptionType?: ExceptionType;
  reason?: string;
  fields?: string[];
}

export interface OrderItemData {
  goodsId: number;
  goodsName: string;
  goodsImage?: string;
  specInfo?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface CreateOrderData {
  orderNo: string;
  userId: number;
  merchantId: number;
  items: OrderItemData[];
  totalAmount: number;
  payAmount: number;
  freightAmount?: number;
  discountAmount?: number;
  payType: PayType;
  receiverName: string;
  receiverPhone: string;
  receiverProvince: string;
  receiverCity: string;
  receiverDistrict: string;
  receiverAddress: string;
  remark?: string;
}

const SHIPPING_PROVINCES = ['北京市', '上海市', '广东省', '江苏省', '浙江省', '山东省', '四川省', '湖北省', '河南省', '福建省'];

class OrderValidateService {
  private readonly orderDao = daos.orderDao;
  private readonly goodsDao = daos.goodsDao;
  private readonly userDao = daos.userDao;
  private readonly merchantDao = daos.merchantDao;
  private readonly orderExceptionDao = daos.orderExceptionDao;
  private readonly orderLogDao = daos.orderLogDao;

  async validatePaymentStatus(userId: number): Promise<ValidationResult> {
    const user = await this.userDao.findById(userId);
    if (!user) {
      return {
        valid: false,
        exceptionType: ExceptionType.PAY_STATUS,
        reason: '用户不存在',
        fields: ['userId'],
      };
    }
    if (user.status !== 1) {
      return {
        valid: false,
        exceptionType: ExceptionType.PAY_STATUS,
        reason: '用户账户已被禁用，无法下单',
        fields: ['userId', 'status'],
      };
    }
    return { valid: true };
  }

  async validateStock(items: OrderItemData[]): Promise<ValidationResult> {
    const goodsIds = items.map(item => item.goodsId);
    const goodsList = await this.goodsDao.findAll({
      where: { id: { [Op.in]: goodsIds } },
    });

    const goodsMap = new Map(goodsList.map(g => [g.id, g]));
    const insufficientFields: string[] = [];
    const insufficientReasons: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const goods = goodsMap.get(item.goodsId);
      if (!goods) {
        insufficientFields.push(`items[${i}].goodsId`);
        insufficientReasons.push(`商品ID ${item.goodsId} 不存在`);
        continue;
      }
      if (goods.status !== 1) {
        insufficientFields.push(`items[${i}].goodsId`);
        insufficientReasons.push(`商品 "${item.goodsName}" 已下架`);
        continue;
      }
      if ((goods.stock || 0) < item.quantity) {
        insufficientFields.push(`items[${i}].quantity`);
        insufficientReasons.push(`商品 "${item.goodsName}" 库存不足，当前库存 ${goods.stock || 0}，需要 ${item.quantity}`);
      }
    }

    if (insufficientFields.length > 0) {
      return {
        valid: false,
        exceptionType: ExceptionType.STOCK_INSUFFICIENT,
        reason: insufficientReasons.join('；'),
        fields: insufficientFields,
      };
    }

    return { valid: true };
  }

  async validateMerchantPermission(merchantId: number): Promise<ValidationResult> {
    const merchant = await this.merchantDao.findById(merchantId);
    if (!merchant) {
      return {
        valid: false,
        exceptionType: ExceptionType.MERCHANT_NO_PERMISSION,
        reason: '商家不存在',
        fields: ['merchantId'],
      };
    }
    if (merchant.status !== 1) {
      return {
        valid: false,
        exceptionType: ExceptionType.MERCHANT_NO_PERMISSION,
        reason: '商家已被禁用，无法接单',
        fields: ['merchantId', 'status'],
      };
    }
    const creditScore = merchant.credit_score || 0;
    if (creditScore < 60) {
      return {
        valid: false,
        exceptionType: ExceptionType.MERCHANT_NO_PERMISSION,
        reason: `商家信用分不足（当前 ${creditScore} 分），低于60分无法接单`,
        fields: ['merchantId', 'creditScore'],
      };
    }
    return { valid: true };
  }

  validateLogisticsArea(province: string): ValidationResult {
    if (!SHIPPING_PROVINCES.includes(province)) {
      return {
        valid: false,
        exceptionType: ExceptionType.LOGISTICS_UNSUPPORTED,
        reason: `收货地址 "${province}" 暂未开通物流配送服务`,
        fields: ['receiverProvince'],
      };
    }
    return { valid: true };
  }

  async validateDuplicateOrder(orderNo: string): Promise<ValidationResult> {
    const existingOrder = await this.orderDao.findAll({
      where: { order_no: orderNo },
    });
    if (existingOrder.length > 0) {
      return {
        valid: false,
        exceptionType: ExceptionType.DUPLICATE_ORDER,
        reason: `订单号 "${orderNo}" 已存在，请勿重复提交`,
        fields: ['orderNo'],
      };
    }
    return { valid: true };
  }

  validateAmount(data: CreateOrderData): ValidationResult {
    const itemsTotal = data.items.reduce((sum, item) => sum + Number(item.subtotal), 0);
    const calculatedTotal = itemsTotal + (data.freightAmount || 0) - (data.discountAmount || 0);

    if (Math.abs(Number(data.totalAmount) - itemsTotal) > 0.01) {
      return {
        valid: false,
        exceptionType: ExceptionType.AMOUNT_ABNORMAL,
        reason: `订单总金额异常，商品小计总和 ${itemsTotal.toFixed(2)} 与订单总金额 ${data.totalAmount.toFixed(2)} 不一致`,
        fields: ['totalAmount', 'items'],
      };
    }

    if (Math.abs(Number(data.payAmount) - calculatedTotal) > 0.01) {
      return {
        valid: false,
        exceptionType: ExceptionType.AMOUNT_ABNORMAL,
        reason: `实付金额异常，应付金额 ${calculatedTotal.toFixed(2)} 与实付金额 ${data.payAmount.toFixed(2)} 不一致`,
        fields: ['payAmount', 'totalAmount', 'freightAmount', 'discountAmount'],
      };
    }

    if (data.payAmount < 0 || data.totalAmount < 0) {
      return {
        valid: false,
        exceptionType: ExceptionType.AMOUNT_ABNORMAL,
        reason: '金额不能为负数',
        fields: ['payAmount', 'totalAmount'],
      };
    }

    return { valid: true };
  }

  async validateOrderFields(data: CreateOrderData): Promise<ValidationResult> {
    const requiredFields: Array<keyof CreateOrderData> = [
      'orderNo', 'userId', 'merchantId', 'items',
      'totalAmount', 'payAmount', 'payType',
      'receiverName', 'receiverPhone',
      'receiverProvince', 'receiverCity', 'receiverDistrict', 'receiverAddress',
    ];

    const missingFields: string[] = [];
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return {
        valid: false,
        exceptionType: ExceptionType.OTHER,
        reason: `缺少必填字段：${missingFields.join('、')}`,
        fields: missingFields,
      };
    }

    if (data.items.length === 0) {
      return {
        valid: false,
        exceptionType: ExceptionType.OTHER,
        reason: '订单商品列表不能为空',
        fields: ['items'],
      };
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(data.receiverPhone)) {
      return {
        valid: false,
        exceptionType: ExceptionType.OTHER,
        reason: '收货人手机号格式不正确',
        fields: ['receiverPhone'],
      };
    }

    return { valid: true };
  }

  async validateAll(data: CreateOrderData): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    results.push(await this.validateOrderFields(data));
    results.push(await this.validateDuplicateOrder(data.orderNo));
    results.push(await this.validatePaymentStatus(data.userId));
    results.push(await this.validateStock(data.items));
    results.push(await this.validateMerchantPermission(data.merchantId));
    results.push(this.validateLogisticsArea(data.receiverProvince));
    results.push(this.validateAmount(data));

    return results.filter(r => !r.valid);
  }

  validateStatusTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): ValidationResult {
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING_PAYMENT]: [OrderStatus.CANCELLED, OrderStatus.PENDING_SHIPMENT],
      [OrderStatus.PENDING_SHIPMENT]: [OrderStatus.CANCELLED, OrderStatus.SHIPPED],
      [OrderStatus.SHIPPED]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      const statusNames: Record<OrderStatus, string> = {
        [OrderStatus.PENDING_PAYMENT]: '待支付',
        [OrderStatus.PENDING_SHIPMENT]: '待发货',
        [OrderStatus.SHIPPED]: '已发货',
        [OrderStatus.COMPLETED]: '已完成',
        [OrderStatus.CANCELLED]: '已取消',
      };
      return {
        valid: false,
        reason: `订单状态 [${statusNames[currentStatus]}] 不允许变更为 [${statusNames[targetStatus]}]`,
        fields: ['status'],
      };
    }
    return { valid: true };
  }

  canEditShippingInfo(status: OrderStatus): ValidationResult {
    if (status >= OrderStatus.SHIPPED) {
      return {
        valid: false,
        reason: '订单已发货及后续状态禁止修改核心收货信息',
        fields: ['receiverName', 'receiverPhone', 'receiverProvince', 'receiverCity', 'receiverDistrict', 'receiverAddress'],
      };
    }
    return { valid: true };
  }

  canEditRemark(status: OrderStatus): ValidationResult {
    if (status === OrderStatus.CANCELLED || status === OrderStatus.COMPLETED) {
      return {
        valid: false,
        reason: '订单已完成或已取消，禁止修改备注',
        fields: ['remark'],
      };
    }
    return { valid: true };
  }

  async createExceptionOrder(
    orderId: number,
    orderNo: string,
    validationResults: ValidationResult[]
  ): Promise<void> {
    const primaryError = validationResults[0];
    const exceptionType = primaryError.exceptionType || ExceptionType.OTHER;
    const reason = validationResults.map(r => r.reason).join('；');
    const fields = Array.from(new Set(validationResults.flatMap(r => r.fields || [])));

    await this.orderDao.update(orderId, {
      status: OrderStatus.CANCELLED,
      is_exception: 1,
      exception_reason: reason,
      exception_fields: fields as any,
    });

    await this.orderExceptionDao.create({
      order_id: orderId,
      order_no: orderNo,
      type: exceptionType,
      reason,
      fields: fields as any,
      status: 0,
    });

    await this.orderLogDao.create({
      order_id: orderId,
      operator_id: 0,
      operator_type: 2,
      action: '订单自动终止',
      remark: `校验失败：${reason}`,
    });
  }
}

export const orderValidateService = new OrderValidateService();
export default OrderValidateService;
