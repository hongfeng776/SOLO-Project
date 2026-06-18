import { Op } from 'sequelize';
import { daos } from '../dao';

export enum OrderStatus {
  PENDING_PAYMENT = 0,
  PENDING_SHIPMENT = 1,
  SHIPPED = 2,
  COMPLETED = 3,
  CANCELLED = 4,
}

export enum ShippingValidateCode {
  SUCCESS = 'SUCCESS',
  ORDER_NOT_PAID = 'ORDER_NOT_PAID',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  DUPLICATE_LOGISTICS_NO = 'DUPLICATE_LOGISTICS_NO',
  INVALID_LOGISTICS_NO_FORMAT = 'INVALID_LOGISTICS_NO_FORMAT',
  INVALID_LOGISTICS_PROVIDER = 'INVALID_LOGISTICS_PROVIDER',
  ORDER_STATUS_ERROR = 'ORDER_STATUS_ERROR',
}

export interface ShippingValidateResult {
  valid: boolean;
  errorCode?: ShippingValidateCode;
  errorMessage?: string;
  field?: string;
}

export interface ShippingVerifyData {
  orderId: number;
  logisticsProviderId: number;
  logisticsNo: string;
  logisticsCompany?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverProvince?: string;
  receiverCity?: string;
  receiverDistrict?: string;
  receiverAddress?: string;
}

class ShippingValidateService {
  readonly orderDao = daos.orderDao;
  readonly orderItemDao = daos.orderItemDao;
  readonly goodsDao = daos.goodsDao;
  readonly logisticsProviderDao = daos.logisticsProviderDao;
  readonly shipmentRecordDao = daos.shipmentRecordDao;

  async validatePaymentStatus(order: any): Promise<ShippingValidateResult> {
    if (!order) {
      return {
        valid: false,
        errorCode: ShippingValidateCode.ORDER_NOT_PAID,
        errorMessage: '订单不存在',
      };
    }

    if (order.pay_status !== 1) {
      return {
        valid: false,
        errorCode: ShippingValidateCode.ORDER_NOT_PAID,
        errorMessage: '订单尚未完成支付',
      };
    }

    return { valid: true };
  }

  async validateStock(orderId: number): Promise<ShippingValidateResult> {
    const orderItems = await this.orderItemDao.findAll({
      where: { order_id: orderId },
    });

    if (!orderItems || orderItems.length === 0) {
      return { valid: true };
    }

    for (const item of orderItems) {
      const goods = await this.goodsDao.findById(item.goods_id);
      if (!goods) {
        return {
          valid: false,
          errorCode: ShippingValidateCode.INSUFFICIENT_STOCK,
          errorMessage: `商品ID:${item.goods_id} 不存在`,
          field: 'goodsId',
        };
      }

      const stock = Number(goods.stock || 0);
      const quantity = Number(item.quantity || 0);
      if (stock < quantity) {
        return {
          valid: false,
          errorCode: ShippingValidateCode.INSUFFICIENT_STOCK,
          errorMessage: `商品"${item.goods_name}"库存不足，当前库存：${stock}，需要：${quantity}`,
          field: 'goodsId',
        };
      }
    }

    return { valid: true };
  }

  async validateLogisticsProvider(providerId: number): Promise<ShippingValidateResult> {
    if (!providerId) {
      return {
        valid: false,
        errorCode: ShippingValidateCode.INVALID_LOGISTICS_PROVIDER,
        errorMessage: '请选择物流服务商',
      };
    }

    const provider = await this.logisticsProviderDao.findById(providerId);
    if (!provider) {
      return {
        valid: false,
        errorCode: ShippingValidateCode.INVALID_LOGISTICS_PROVIDER,
        errorMessage: '物流服务商不存在',
      };
    }

    if (provider.status !== 1) {
      return {
        valid: false,
        errorCode: ShippingValidateCode.PROVIDER_UNAVAILABLE,
        errorMessage: '该物流服务商已停用，请选择其他服务商',
      };
    }

    return { valid: true };
  }

  validateAddress(data: {
    receiverProvince?: string;
    receiverCity?: string;
    receiverDistrict?: string;
    receiverAddress?: string;
    receiverPhone?: string;
    receiverName?: string;
  }): ShippingValidateResult {
    if (!data.receiverName || !data.receiverName.trim()) {
      return {
        valid: false,
        errorCode: ShippingValidateCode.INVALID_ADDRESS,
        errorMessage: '收货人姓名不能为空',
        field: 'receiverName',
      };
    }

    if (!data.receiverPhone || !data.receiverPhone.trim()) {
      return {
        valid: false,
        errorCode: ShippingValidateCode.INVALID_ADDRESS,
        errorMessage: '收货人电话不能为空',
        field: 'receiverPhone',
      };
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(data.receiverPhone.trim())) {
      return {
        valid: false,
        errorCode: ShippingValidateCode.INVALID_ADDRESS,
        errorMessage: '手机号格式不正确，请输入有效的11位手机号',
        field: 'receiverPhone',
      };
    }

    if (!data.receiverProvince || !data.receiverProvince.trim()) {
      return {
        valid: false,
        errorCode: ShippingValidateCode.INVALID_ADDRESS,
        errorMessage: '收货省份不能为空',
        field: 'receiverProvince',
      };
    }

    if (!data.receiverCity || !data.receiverCity.trim()) {
      return {
        valid: false,
        errorCode: ShippingValidateCode.INVALID_ADDRESS,
        errorMessage: '收货城市不能为空',
        field: 'receiverCity',
      };
    }

    if (!data.receiverDistrict || !data.receiverDistrict.trim()) {
      return {
        valid: false,
        errorCode: ShippingValidateCode.INVALID_ADDRESS,
        errorMessage: '收货区县不能为空',
        field: 'receiverDistrict',
      };
    }

    if (!data.receiverAddress || !data.receiverAddress.trim()) {
      return {
        valid: false,
        errorCode: ShippingValidateCode.INVALID_ADDRESS,
        errorMessage: '详细收货地址不能为空',
        field: 'receiverAddress',
      };
    }

    return { valid: true };
  }

  validateLogisticsNoFormat(logisticsNo: string, providerId?: number): ShippingValidateResult {
    if (!logisticsNo || !logisticsNo.trim()) {
      return {
        valid: false,
        errorCode: ShippingValidateCode.INVALID_LOGISTICS_NO_FORMAT,
        errorMessage: '物流单号不能为空',
        field: 'logisticsNo',
      };
    }

    const trimmedNo = logisticsNo.trim();

    if (trimmedNo.length < 8 || trimmedNo.length > 32) {
      return {
        valid: false,
        errorCode: ShippingValidateCode.INVALID_LOGISTICS_NO_FORMAT,
        errorMessage: '物流单号长度必须在8-32位之间',
        field: 'logisticsNo',
      };
    }

    const alphanumericRegex = /^[A-Za-z0-9]+$/;
    if (!alphanumericRegex.test(trimmedNo)) {
      return {
        valid: false,
        errorCode: ShippingValidateCode.INVALID_LOGISTICS_NO_FORMAT,
        errorMessage: '物流单号只能包含字母和数字',
        field: 'logisticsNo',
      };
    }

    if (providerId) {
      const providerRules: Record<number, { regex: RegExp; message: string }> = {
        1: { regex: /^SF\d{10,12}$/i, message: '顺丰速运单号应为SF开头加10-12位数字' },
        2: { regex: /^YT\d{10,14}$/i, message: '圆通速递单号应为YT开头加10-14位数字' },
        3: { regex: /^ZT\d{10,14}$/i, message: '中通快递单号应为ZT开头加10-14位数字' },
        4: { regex: /^YD\d{10,14}$/i, message: '韵达快递单号应为YD开头加10-14位数字' },
        5: { regex: /^JD\d{10,14}$/i, message: '京东物流单号应为JD开头加10-14位数字' },
        6: { regex: /^EMS[A-Z0-9]{9,13}$/i, message: 'EMS单号格式不正确' },
        7: { regex: /^STO\d{10,14}$/i, message: '申通快递单号应为STO开头加10-14位数字' },
      };

      const rule = providerRules[providerId];
      if (rule && !rule.regex.test(trimmedNo)) {
        return {
          valid: false,
          errorCode: ShippingValidateCode.INVALID_LOGISTICS_NO_FORMAT,
          errorMessage: rule.message,
          field: 'logisticsNo',
        };
      }
    }

    return { valid: true };
  }

  async checkDuplicateLogisticsNo(logisticsNo: string, excludeOrderId?: number): Promise<ShippingValidateResult> {
    if (!logisticsNo) return { valid: true };

    const where: any = { tracking_no: logisticsNo.trim() };
    if (excludeOrderId) {
      where.order_id = { [Op.ne]: excludeOrderId };
    }

    const existingRecord = await this.shipmentRecordDao.findOne({ where });

    if (existingRecord) {
      return {
        valid: false,
        errorCode: ShippingValidateCode.DUPLICATE_LOGISTICS_NO,
        errorMessage: '该物流单号已被其他订单使用',
        field: 'logisticsNo',
      };
    }

    return { valid: true };
  }

  validateOrderStatus(order: any): ShippingValidateResult {
    if (!order) {
      return {
        valid: false,
        errorCode: ShippingValidateCode.ORDER_STATUS_ERROR,
        errorMessage: '订单不存在',
      };
    }

    if (order.status !== OrderStatus.PENDING_SHIPMENT) {
      const statusNames: Record<number, string> = {
        [OrderStatus.PENDING_PAYMENT]: '待支付',
        [OrderStatus.PENDING_SHIPMENT]: '待发货',
        [OrderStatus.SHIPPED]: '已发货',
        [OrderStatus.COMPLETED]: '已完成',
        [OrderStatus.CANCELLED]: '已取消',
      };
      return {
        valid: false,
        errorCode: ShippingValidateCode.ORDER_STATUS_ERROR,
        errorMessage: `订单状态不正确，当前状态：${statusNames[order.status] || '未知'}，需要状态：待发货`,
      };
    }

    return { valid: true };
  }

  async verifyShipping(data: ShippingVerifyData): Promise<ShippingValidateResult[]> {
    const results: ShippingValidateResult[] = [];

    const order = await this.orderDao.findById(data.orderId);

    const orderStatusResult = this.validateOrderStatus(order);
    results.push(orderStatusResult);

    const paymentResult = await this.validatePaymentStatus(order);
    results.push(paymentResult);

    const stockResult = await this.validateStock(data.orderId);
    results.push(stockResult);

    const providerResult = await this.validateLogisticsProvider(data.logisticsProviderId);
    results.push(providerResult);

    const addressData = {
      receiverProvince: data.receiverProvince || order?.receiver_province,
      receiverCity: data.receiverCity || order?.receiver_city,
      receiverDistrict: data.receiverDistrict || order?.receiver_district,
      receiverAddress: data.receiverAddress || order?.receiver_address,
      receiverPhone: data.receiverPhone || order?.receiver_phone,
      receiverName: data.receiverName || order?.receiver_name,
    };
    const addressResult = this.validateAddress(addressData);
    results.push(addressResult);

    const formatResult = this.validateLogisticsNoFormat(data.logisticsNo, data.logisticsProviderId);
    results.push(formatResult);

    if (formatResult.valid) {
      const duplicateResult = await this.checkDuplicateLogisticsNo(data.logisticsNo, data.orderId);
      results.push(duplicateResult);
    }

    return results;
  }
}

export const shippingValidateService = new ShippingValidateService();
export default shippingValidateService;
