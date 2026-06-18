import { Transaction } from 'sequelize';
import { daos } from '../dao';
import database from '../config/database';
import { OrderStatus } from './ShippingValidateService';

export interface ShipOrderData {
  orderId: number;
  logisticsProviderId: number;
  logisticsProviderName: string;
  logisticsNo: string;
  logisticsCompany: string;
  freightAmount?: number;
  packageCount?: number;
  packageWeight?: number;
  insuranceAmount?: number;
  remark?: string;
  operatorId: number;
  operatorName: string;
  location?: string;
}

export interface UpdateLogisticsStatusData {
  orderId: number;
  shipmentId?: number;
  logisticsStatus: number;
  description?: string;
  location?: string;
  trackTime?: Date;
  operatorId?: number;
  operatorName?: string;
}

export interface ShippingSyncResult {
  success: boolean;
  orderStatus?: number;
  shipmentId?: number;
  errorMessage?: string;
}

const LOGISTICS_STATUS_SIGNED = 4;
const LOGISTICS_STATUS_ABNORMAL = 5;
const LOGISTICS_STATUS_PICKED_UP = 1;

class ShippingSyncService {
  readonly orderDao = daos.orderDao;
  readonly orderItemDao = daos.orderItemDao;
  readonly shipmentRecordDao = daos.shipmentRecordDao;
  readonly logisticsTrackDao = daos.logisticsTrackDao;
  readonly messageDao = daos.messageDao;
  readonly orderLogDao = daos.orderLogDao;

  async shipOrder(data: ShipOrderData): Promise<ShippingSyncResult> {
    const transaction = await database.transaction();

    try {
      const order = await this.orderDao.findById(data.orderId);
      if (!order) {
        await transaction.rollback();
        return { success: false, errorMessage: '订单不存在' };
      }

      if (order.status !== OrderStatus.PENDING_SHIPMENT) {
        await transaction.rollback();
        return { success: false, errorMessage: '订单状态不正确，无法发货' };
      }

      const shipmentRecord = await this.createShipmentRecord(data, transaction);

      const now = new Date();
      await this.orderDao.update(
        data.orderId,
        {
          status: OrderStatus.SHIPPED,
          shipping_status: 1,
          logistics_provider_id: data.logisticsProviderId,
          logistics_company: data.logisticsCompany,
          logistics_no: data.logisticsNo,
          logistics_status: LOGISTICS_STATUS_PICKED_UP,
          shipped_at: now,
          actual_freight: data.freightAmount,
        },
        { transaction }
      );

      const trackNo = 'TR' + Date.now() + Math.floor(Math.random() * 10000);
      await this.logisticsTrackDao.create(
        {
          track_no: trackNo,
          shipment_id: shipmentRecord.id,
          shipment_no: shipmentRecord.shipment_no,
          order_id: data.orderId,
          order_no: order.order_no,
          logistics_provider_id: data.logisticsProviderId,
          logistics_no: data.logisticsNo,
          track_status: LOGISTICS_STATUS_PICKED_UP,
          location: data.location || '仓库',
          description: '包裹已揽收，等待运输',
          operator: data.operatorName,
          track_time: now,
          is_abnormal: 0,
          source: 1,
        },
        { transaction }
      );

      await this.orderLogDao.create(
        {
          order_id: data.orderId,
          operator_id: data.operatorId || 0,
          operator_type: data.operatorId ? 1 : 2,
          action: '发货',
          old_status: OrderStatus.PENDING_SHIPMENT,
          new_status: OrderStatus.SHIPPED,
          remark: `物流公司：${data.logisticsCompany}，物流单号：${data.logisticsNo}`,
        },
        { transaction }
      );

      const shipContent = `您的订单（${order.order_no}）已发货，物流公司：${data.logisticsCompany}，物流单号：${data.logisticsNo}`;
      await this.pushLogisticsNotification(data.orderId, 'ship', shipContent, transaction);

      await transaction.commit();

      return {
        success: true,
        orderStatus: OrderStatus.SHIPPED,
        shipmentId: shipmentRecord.id,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateLogisticsStatus(data: UpdateLogisticsStatusData): Promise<ShippingSyncResult> {
    const transaction = await database.transaction();

    try {
      const order = await this.orderDao.findById(data.orderId);
      if (!order) {
        await transaction.rollback();
        return { success: false, errorMessage: '订单不存在' };
      }

      let shipmentId = data.shipmentId;
      if (!shipmentId) {
        const shipmentRecord = await this.shipmentRecordDao.findOne({
          where: { order_id: data.orderId },
        });
        if (shipmentRecord) {
          shipmentId = shipmentRecord.id;
        }
      }

      const trackTime = data.trackTime || new Date();
      const trackNo = 'TR' + Date.now() + Math.floor(Math.random() * 10000);

      const trackData: any = {
        track_no: trackNo,
        shipment_id: shipmentId || 0,
        shipment_no: order.shipped_at ? 'SH' + order.id : '',
        order_id: data.orderId,
        order_no: order.order_no,
        logistics_provider_id: order.logistics_provider_id || 0,
        logistics_no: order.logistics_no || '',
        track_status: data.logisticsStatus,
        location: data.location || '',
        description: data.description || this.getStatusDescription(data.logisticsStatus),
        operator: data.operatorName || '系统',
        track_time: trackTime,
        is_abnormal: data.logisticsStatus === LOGISTICS_STATUS_ABNORMAL ? 1 : 0,
        source: 1,
      };

      if (data.logisticsStatus === LOGISTICS_STATUS_ABNORMAL) {
        trackData.abnormal_type = '物流异常';
        trackData.abnormal_desc = data.description || '物流状态异常';
      }

      await this.logisticsTrackDao.create(trackData, { transaction });

      const orderUpdateData: any = {
        logistics_status: data.logisticsStatus,
      };

      if (data.logisticsStatus === LOGISTICS_STATUS_SIGNED) {
        orderUpdateData.status = OrderStatus.COMPLETED;
        orderUpdateData.signed_at = trackTime;
        orderUpdateData.signer_name = data.operatorName || '用户';
      }

      if (data.logisticsStatus === LOGISTICS_STATUS_ABNORMAL) {
        orderUpdateData.logistics_abnormal_flag = 1;
        orderUpdateData.logistics_abnormal_reason = data.description || '物流异常';
      }

      await this.orderDao.update(data.orderId, orderUpdateData, { transaction });

      const logRemark = `物流状态更新：${this.getStatusDescription(data.logisticsStatus)}`;
      await this.orderLogDao.create(
        {
          order_id: data.orderId,
          operator_id: data.operatorId || 0,
          operator_type: data.operatorId ? 1 : 2,
          action: '物流状态更新',
          old_status: order.logistics_status,
          new_status: data.logisticsStatus,
          remark: data.location ? `${logRemark}，当前位置：${data.location}` : logRemark,
        },
        { transaction }
      );

      if (data.logisticsStatus === LOGISTICS_STATUS_SIGNED) {
        const signedContent = `您的订单（${order.order_no}）已签收，感谢您的购买！`;
        await this.pushLogisticsNotification(data.orderId, 'signed', signedContent, transaction);
      } else if (data.logisticsStatus === LOGISTICS_STATUS_ABNORMAL) {
        const abnormalContent = `您的订单（${order.order_no}）物流出现异常：${data.description || '物流状态异常'}`;
        await this.pushLogisticsNotification(data.orderId, 'abnormal', abnormalContent, transaction);
      }

      await transaction.commit();

      return {
        success: true,
        orderStatus: data.logisticsStatus === LOGISTICS_STATUS_SIGNED ? OrderStatus.COMPLETED : order.status,
        shipmentId,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async createShipmentRecord(data: ShipOrderData, transaction: Transaction): Promise<any> {
    const order = await this.orderDao.findById(data.orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    const orderItems = await this.orderItemDao.findAll({
      where: { order_id: data.orderId },
    });

    const goodsList = orderItems
      .map((item: any) => `${item.goods_name} x${item.quantity}`)
      .join(', ');

    const toAddress = [
      order.receiver_province,
      order.receiver_city,
      order.receiver_district,
      order.receiver_address,
    ]
      .filter(Boolean)
      .join('');

    const shipmentNo = 'SH' + Date.now() + Math.floor(Math.random() * 10000);

    const shipmentRecord = await this.shipmentRecordDao.create(
      {
        shipment_no: shipmentNo,
        order_id: data.orderId,
        order_no: order.order_no,
        provider_id: data.logisticsProviderId,
        provider_name: data.logisticsProviderName,
        tracking_no: data.logisticsNo,
        to_address: toAddress,
        receiver_name: order.receiver_name || '',
        receiver_phone: order.receiver_phone || '',
        freight: data.freightAmount,
        status: 1,
        ship_time: new Date(),
        operator_id: data.operatorId,
        operator_name: data.operatorName,
        remark: data.remark
          ? `${data.remark}，商品：${goodsList}`
          : `商品：${goodsList}`,
      },
      { transaction }
    );

    return shipmentRecord;
  }

  async pushLogisticsNotification(
    orderId: number,
    type: string,
    content: string,
    transaction: Transaction
  ): Promise<void> {
    const order = await this.orderDao.findById(orderId);
    if (!order) return;

    const titleMap: Record<string, string> = {
      ship: '订单发货通知',
      signed: '订单签收通知',
      abnormal: '订单物流异常通知',
    };

    const title = titleMap[type] || '物流通知';

    await this.messageDao.create(
      {
        user_type: 1,
        user_id: order.user_id,
        type: 2,
        title,
        content,
        is_read: 0,
      },
      { transaction }
    );

    if (order.merchant_id) {
      await this.messageDao.create(
        {
          user_type: 2,
          user_id: order.merchant_id,
          type: 2,
          title,
          content,
          is_read: 0,
        },
        { transaction }
      );
    }
  }

  getStatusDescription(status: number): string {
    const descriptions: Record<number, string> = {
      1: '已揽收',
      2: '运输中',
      3: '派送中',
      4: '已签收',
      5: '签收异常',
      6: '已退回',
    };
    return descriptions[status] || '物流状态更新';
  }
}

export const shippingSyncService = new ShippingSyncService();
export default shippingSyncService;
