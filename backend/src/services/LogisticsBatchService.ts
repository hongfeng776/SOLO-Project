import { Op, WhereOptions } from 'sequelize';
import { daos } from '../dao';
import { ShipmentRecord } from '../models/ShipmentRecord';
import { PageResult } from '../types';

export interface LogisticsQueryParams {
  pageNum?: number;
  pageSize?: number;
  orderNo?: string;
  logisticsNo?: string;
  logisticsProviderId?: number;
  logisticsStatus?: number;
  shippingStatus?: number;
  abnormalFlag?: number;
  startTime?: string;
  endTime?: string;
  startShippedAt?: string;
  endShippedAt?: string;
  merchantId?: number;
  userId?: number;
  receiverProvince?: string;
  receiverCity?: string;
  isAbnormal?: number;
  isSigned?: number;
}

export interface BatchShipItem {
  orderId: number;
  logisticsProviderId: number;
  logisticsNo: string;
  logisticsCompany?: string;
}

export interface BatchOperationResult {
  success: boolean;
  total: number;
  successCount: number;
  failCount: number;
  messages?: string[];
}

const LOGISTICS_PROVIDER_NAME_MAP: Record<string, string> = {
  '顺丰': '顺丰速运',
  '顺丰速运': '顺丰速运',
  'SF': '顺丰速运',
  '圆通': '圆通速递',
  '圆通速递': '圆通速递',
  'YT': '圆通速递',
  '中通': '中通快递',
  '中通快递': '中通快递',
  'ZTO': '中通快递',
  '申通': '申通快递',
  '申通快递': '申通快递',
  'STO': '申通快递',
  '韵达': '韵达快递',
  '韵达快递': '韵达快递',
  'YD': '韵达快递',
  '百世': '百世快递',
  '百世快递': '百世快递',
  'HTKY': '百世快递',
  '邮政': '中国邮政',
  '中国邮政': '中国邮政',
  'EMS': 'EMS',
  '京东': '京东物流',
  '京东物流': '京东物流',
  '德邦': '德邦快递',
  '德邦快递': '德邦快递',
};

class LogisticsBatchService {
  private readonly shipmentRecordDao = daos.shipmentRecordDao;
  private readonly logisticsProviderDao = daos.logisticsProviderDao;
  private readonly orderDao = daos.orderDao;
  private readonly orderLogDao = daos.orderLogDao;
  private readonly messageDao = daos.messageDao;
  private readonly abnormalLogisticsLogDao = daos.abnormalLogisticsLogDao;

  buildQueryConditions(params: LogisticsQueryParams): WhereOptions<ShipmentRecord> {
    const where: WhereOptions<ShipmentRecord> = {};

    if (params.orderNo) {
      where.order_no = { [Op.like]: `%${params.orderNo}%` };
    }
    if (params.logisticsNo) {
      where.tracking_no = { [Op.like]: `%${params.logisticsNo}%` };
    }
    if (params.logisticsProviderId !== undefined) {
      where.provider_id = params.logisticsProviderId;
    }
    if (params.logisticsStatus !== undefined) {
      where.status = params.logisticsStatus;
    }

    if (params.startTime || params.endTime) {
      where.created_at = {};
      if (params.startTime) {
        (where.created_at as any)[Op.gte] = new Date(params.startTime);
      }
      if (params.endTime) {
        (where.created_at as any)[Op.lte] = new Date(params.endTime);
      }
    }

    if (params.startShippedAt || params.endShippedAt) {
      where.ship_time = {};
      if (params.startShippedAt) {
        (where.ship_time as any)[Op.gte] = new Date(params.startShippedAt);
      }
      if (params.endShippedAt) {
        (where.ship_time as any)[Op.lte] = new Date(params.endShippedAt);
      }
    }

    if (params.isAbnormal === 1) {
      (where as any).order = { logistics_abnormal_flag: { [Op.gt]: 0 } };
    } else if (params.isAbnormal === 0) {
      (where as any).order = { logistics_abnormal_flag: 0 };
    }

    if (params.isSigned === 1) {
      where.status = 3;
    } else if (params.isSigned === 0) {
      where.status = { [Op.ne]: 3 };
    }

    if (params.merchantId !== undefined) {
      (where as any).order = { ...((where as any).order || {}), merchant_id: params.merchantId };
    }
    if (params.userId !== undefined) {
      (where as any).order = { ...((where as any).order || {}), user_id: params.userId };
    }
    if (params.receiverProvince) {
      (where as any).order = { ...((where as any).order || {}), receiver_province: params.receiverProvince };
    }
    if (params.receiverCity) {
      (where as any).order = { ...((where as any).order || {}), receiver_city: params.receiverCity };
    }

    return where;
  }

  async getShipmentList(params: LogisticsQueryParams): Promise<PageResult<ShipmentRecord>> {
    const { pageNum = 1, pageSize = 10, ...queryParams } = params;
    const where = this.buildQueryConditions(queryParams);

    const result = await this.shipmentRecordDao.findPage({
      page: pageNum,
      pageSize,
      where,
      order: [['ship_time', 'DESC']],
    });

    return result;
  }

  async getIdsByQuery(params: LogisticsQueryParams): Promise<{ ids: number[]; count: number }> {
    const where = this.buildQueryConditions(params);
    const result = await this.shipmentRecordDao.findAndCountAll({
      where,
      attributes: ['id'],
    });
    return {
      ids: result.rows.map(r => r.id),
      count: result.count,
    };
  }

  private async validateShipItem(item: BatchShipItem): Promise<{ valid: boolean; reason?: string; order?: any; provider?: any }> {
    const order = await this.orderDao.findById(item.orderId);
    if (!order) {
      return { valid: false, reason: '订单不存在' };
    }

    if (order.shipping_status === 1) {
      return { valid: false, reason: '订单已发货' };
    }

    const provider = await this.logisticsProviderDao.findById(item.logisticsProviderId);
    if (!provider || provider.status !== 1) {
      return { valid: false, reason: '物流服务商无效或已禁用' };
    }

    if (!item.logisticsNo || item.logisticsNo.trim().length < 5) {
      return { valid: false, reason: '物流单号格式无效' };
    }

    const existingShipment = await this.shipmentRecordDao.findOne({
      where: { tracking_no: item.logisticsNo.trim() },
    });
    if (existingShipment) {
      return { valid: false, reason: '物流单号已存在' };
    }

    return { valid: true, order, provider };
  }

  private async processShip(item: BatchShipItem, order: any, provider: any, operatorId: number, operatorName: string): Promise<void> {
    const shipmentNo = 'FH' + Date.now() + Math.floor(Math.random() * 1000);
    const now = new Date();

    const fullAddress = [order.receiver_province, order.receiver_city, order.receiver_district, order.receiver_address]
      .filter(Boolean)
      .join('');

    await this.shipmentRecordDao.create({
      shipment_no: shipmentNo,
      order_id: order.id,
      order_no: order.order_no,
      provider_id: provider.id,
      provider_name: provider.provider_name,
      tracking_no: item.logisticsNo.trim(),
      to_address: fullAddress,
      receiver_name: order.receiver_name,
      receiver_phone: order.receiver_phone,
      status: 1,
      ship_time: now,
      operator_id: operatorId,
      operator_name: operatorName,
    });

    await this.orderDao.update(order.id, {
      shipping_status: 1,
      shipped_at: now,
      logistics_provider_id: provider.id,
      logistics_company: provider.provider_name,
      logistics_no: item.logisticsNo.trim(),
      logistics_status: 1,
      logistics_abnormal_flag: 0,
      logistics_abnormal_reason: '',
    });

    await this.orderLogDao.create({
      order_id: order.id,
      operator_id: operatorId,
      operator_type: 1,
      action: '发货',
      remark: `操作人员：${operatorName}，物流公司：${provider.provider_name}，物流单号：${item.logisticsNo.trim()}`,
    });

    await this.messageDao.create({
      user_type: 1,
      user_id: order.user_id,
      type: 2,
      title: '订单已发货',
      content: `您的订单${order.order_no}已通过${provider.provider_name}发货，物流单号：${item.logisticsNo.trim()}，请注意查收。`,
      is_read: 0,
    });
  }

  async batchShip(items: BatchShipItem[], operatorId: number, operatorName: string): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: true,
      total: items.length,
      successCount: 0,
      failCount: 0,
      messages: [],
    };

    for (const item of items) {
      try {
        const validation = await this.validateShipItem(item);
        if (!validation.valid) {
          result.failCount++;
          result.messages?.push(`订单ID:${item.orderId} ${validation.reason}`);
          continue;
        }

        await this.processShip(item, validation.order!, validation.provider!, operatorId, operatorName);
        result.successCount++;
      } catch (error) {
        result.failCount++;
        result.messages?.push(`订单ID:${item.orderId} 发货失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    return result;
  }

  async batchUpdateAbnormalStatus(
    ids: number[],
    abnormalFlag: number,
    abnormalReason: string,
    operatorId: number,
    operatorName: string
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: true,
      total: ids.length,
      successCount: 0,
      failCount: 0,
      messages: [],
    };

    for (const id of ids) {
      try {
        const shipment = await this.shipmentRecordDao.findById(id);
        if (!shipment) {
          result.failCount++;
          result.messages?.push(`发货记录ID:${id} 不存在`);
          continue;
        }

        await this.orderDao.update(shipment.order_id, {
          logistics_abnormal_flag: abnormalFlag,
          logistics_abnormal_reason: abnormalReason,
        });

        if (abnormalFlag > 0) {
          const logNo = 'ABN' + Date.now() + Math.floor(Math.random() * 1000);
          await this.abnormalLogisticsLogDao.create({
            log_no: logNo,
            shipment_id: shipment.id,
            shipment_no: shipment.shipment_no,
            order_id: shipment.order_id,
            order_no: shipment.order_no,
            logistics_no: shipment.tracking_no,
            abnormal_type: abnormalFlag,
            abnormal_level: abnormalFlag >= 3 ? 3 : abnormalFlag >= 2 ? 2 : 1,
            abnormal_desc: abnormalReason,
            status: 0,
            operator_id: operatorId,
            operator_name: operatorName,
            reported_at: new Date(),
          });
        }

        await this.orderLogDao.create({
          order_id: shipment.order_id,
          operator_id: operatorId,
          operator_type: 1,
          action: '物流异常标记',
          remark: `操作人员：${operatorName}，异常标记：${abnormalFlag}，异常原因：${abnormalReason}`,
        });

        result.successCount++;
      } catch (error) {
        result.failCount++;
        result.messages?.push(`发货记录ID:${id} 更新失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    return result;
  }

  async batchResendNotification(ids: number[], operatorId: number, operatorName: string): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: true,
      total: ids.length,
      successCount: 0,
      failCount: 0,
      messages: [],
    };

    for (const id of ids) {
      try {
        const shipment = await this.shipmentRecordDao.findById(id);
        if (!shipment) {
          result.failCount++;
          result.messages?.push(`发货记录ID:${id} 不存在`);
          continue;
        }

        const order = await this.orderDao.findById(shipment.order_id);
        if (!order) {
          result.failCount++;
          result.messages?.push(`发货记录ID:${id} 关联订单不存在`);
          continue;
        }

        await this.messageDao.create({
          user_type: 1,
          user_id: order.user_id,
          type: 2,
          title: '物流通知补发',
          content: `您的订单${order.order_no}物流信息：${shipment.provider_name}，物流单号：${shipment.tracking_no}，当前状态：${this.getShipmentStatusName(shipment.status)}。`,
          is_read: 0,
        });

        await this.orderLogDao.create({
          order_id: shipment.order_id,
          operator_id: operatorId,
          operator_type: 1,
          action: '补发物流通知',
          remark: `操作人员：${operatorName}，物流单号：${shipment.tracking_no}`,
        });

        result.successCount++;
      } catch (error) {
        result.failCount++;
        result.messages?.push(`发货记录ID:${id} 补发失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    return result;
  }

  private normalizeLogisticsCompany(name?: string): string {
    if (!name) return '';
    const cleaned = name.trim().toUpperCase().replace(/\s+/g, '');
    for (const [key, value] of Object.entries(LOGISTICS_PROVIDER_NAME_MAP)) {
      if (cleaned.includes(key.toUpperCase()) || key.toUpperCase().includes(cleaned)) {
        return value;
      }
    }
    return name.trim();
  }

  private normalizeLogisticsNo(no: string): string {
    return no.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  private async matchLogisticsProvider(companyName: string): Promise<any | null> {
    const normalizedName = this.normalizeLogisticsCompany(companyName);
    if (!normalizedName) return null;

    const provider = await this.logisticsProviderDao.findOne({
      where: {
        provider_name: { [Op.like]: `%${normalizedName}%` },
        status: 1,
      },
    });

    if (provider) return provider;

    const allProviders = await this.logisticsProviderDao.findAll({ where: { status: 1 } });
    for (const p of allProviders) {
      if (normalizedName.includes(p.provider_name) || p.provider_name.includes(normalizedName)) {
        return p;
      }
    }

    return null;
  }

  async batchImportShipment(
    items: BatchShipItem[],
    operatorId: number,
    operatorName: string
  ): Promise<BatchOperationResult & { errors?: Array<{ row: number; orderId: number; reason: string }> }> {
    const result: BatchOperationResult & { errors?: Array<{ row: number; orderId: number; reason: string }> } = {
      success: true,
      total: items.length,
      successCount: 0,
      failCount: 0,
      messages: [],
      errors: [],
    };

    for (let i = 0; i < items.length; i++) {
      const row = i + 1;
      const item = items[i];
      try {
        let providerId = item.logisticsProviderId;
        let logisticsCompany = item.logisticsCompany;

        if (!providerId && logisticsCompany) {
          const matchedProvider = await this.matchLogisticsProvider(logisticsCompany);
          if (matchedProvider) {
            providerId = matchedProvider.id;
            logisticsCompany = matchedProvider.provider_name;
          }
        }

        const normalizedNo = this.normalizeLogisticsNo(item.logisticsNo);

        const processItem: BatchShipItem = {
          ...item,
          logisticsProviderId: providerId,
          logisticsNo: normalizedNo,
          logisticsCompany,
        };

        const validation = await this.validateShipItem(processItem);
        if (!validation.valid) {
          result.failCount++;
          result.errors?.push({ row, orderId: item.orderId, reason: validation.reason || '验证失败' });
          result.messages?.push(`第${row}行: 订单ID:${item.orderId} ${validation.reason}`);
          continue;
        }

        await this.processShip(processItem, validation.order!, validation.provider!, operatorId, operatorName);
        result.successCount++;
      } catch (error) {
        result.failCount++;
        const reason = error instanceof Error ? error.message : '未知错误';
        result.errors?.push({ row, orderId: item.orderId, reason });
        result.messages?.push(`第${row}行: 订单ID:${item.orderId} 发货失败: ${reason}`);
      }
    }

    return result;
  }

  getShipmentStatusName(status?: number): string {
    const names: Record<number, string> = {
      0: '待发货',
      1: '已发货',
      2: '运输中',
      3: '已签收',
      4: '已拒收',
      5: '已退回',
    };
    return names[status || 0] || '未知';
  }
}

export const logisticsBatchService = new LogisticsBatchService();
export default logisticsBatchService;
