import { daos } from '../dao';
import { Op, Transaction } from 'sequelize';
import sequelize from '../config/sequelize';
import { LogisticsTrack } from '../models/LogisticsTrack';
import { AbnormalLogisticsLog } from '../models/AbnormalLogisticsLog';

const {
  shipmentRecordDao,
  logisticsTrackDao,
  abnormalLogisticsLogDao,
  logisticsLinkWorkOrderDao,
  orderDao,
  logisticsProviderDao,
  userPermissionDao,
} = daos;

export enum BatchOperationType {
  MARK_ABNORMAL = 'mark_abnormal',
  LAUNCH_VERIFY = 'launch_verify',
  SYNC_STATUS = 'sync_status',
  UPDATE_TRACK = 'update_track',
  RESEND_NOTIFICATION = 'resend_notification',
}

export interface BatchOperationPermission {
  can_mark_abnormal: boolean;
  can_launch_verify: boolean;
  can_sync_status: boolean;
  can_update_track: boolean;
  can_resend_notification: boolean;
}

export interface BatchOperationResult {
  total: number;
  success: number;
  failed: number;
  results: Array<{
    id: number;
    success: boolean;
    error?: string;
    data?: any;
  }>;
}

export class LogisticsLinkBatchService {
  async getUserPermissions(adminId: number): Promise<BatchOperationPermission> {
    const permissions = {
      can_mark_abnormal: true,
      can_launch_verify: true,
      can_sync_status: true,
      can_update_track: true,
      can_resend_notification: true,
    };

    try {
      const userPermissions = await userPermissionDao.findByCondition({
        admin_id: adminId,
        permission_type: 'logistics_batch',
      });

      if (userPermissions.length > 0) {
        for (const perm of userPermissions) {
          const permValue = perm.permission_value;
          if (permValue === 'logistics:batch:mark_abnormal') permissions.can_mark_abnormal = true;
          if (permValue === 'logistics:batch:launch_verify') permissions.can_launch_verify = true;
          if (permValue === 'logistics:batch:sync_status') permissions.can_sync_status = true;
          if (permValue === 'logistics:batch:update_track') permissions.can_update_track = true;
          if (permValue === 'logistics:batch:resend_notification') permissions.can_resend_notification = true;
        }
      }
    } catch (error) {
      console.error('获取批量操作权限失败:', error);
    }

    return permissions;
  }

  async getRefreshListData(shipmentIds: number[]): Promise<any[]> {
    const shipments = await shipmentRecordDao.findByIds(shipmentIds);

    return await Promise.all(
      shipments.map(async (shipment) => {
        const latestTrack = await logisticsTrackDao.findByCondition(
          { shipment_id: shipment.id },
          { order: [['track_time', 'DESC']], limit: 1 }
        );

        const abnormalCount = await abnormalLogisticsLogDao.count({
          shipment_id: shipment.id,
          is_processed: 0,
        });

        const workOrderCount = await logisticsLinkWorkOrderDao.count({
          shipment_id: shipment.id,
          status: { [Op.in]: [0, 1, 2] },
        });

        return {
          ...shipment.toJSON(),
          latest_track: latestTrack[0] || null,
          abnormal_count: abnormalCount,
          work_order_count: workOrderCount,
        };
      })
    );
  }

  async batchMarkAbnormal(
    shipmentIds: number[],
    abnormalType: string,
    abnormalDesc: string,
    operatorId: number,
    operatorName: string
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      total: shipmentIds.length,
      success: 0,
      failed: 0,
      results: [],
    };

    await Promise.all(
      shipmentIds.map(async (shipmentId) => {
        const t = await sequelize.transaction();
        try {
          const shipment = await shipmentRecordDao.findById(shipmentId, { transaction: t });
          if (!shipment) {
            throw new Error('发货记录不存在');
          }

          const abnormalLog = await abnormalLogisticsLogDao.create({
            shipment_id: shipmentId,
            logistics_no: shipment.logistics_no,
            abnormal_type: abnormalType,
            abnormal_desc: abnormalDesc,
            alert_level: 2,
            detected_by: 'manual',
            detected_at: new Date(),
            suggestion: '已人工标记异常，请尽快处理',
            is_processed: 0,
            created_by: operatorId,
            created_by_name: operatorName,
          }, { transaction: t });

          const tracks = await logisticsTrackDao.findByCondition(
            { shipment_id: shipmentId },
            { order: [['track_time', 'DESC']], limit: 1, transaction: t }
          );

          if (tracks.length > 0) {
            await logisticsTrackDao.update(tracks[0].id, {
              is_abnormal: 1,
              abnormal_type: abnormalType,
              abnormal_desc: abnormalDesc,
            }, { transaction: t });
          }

          const workOrderNo = `WO${Date.now()}${Math.floor(Math.random() * 10000)}`;
          const order = await orderDao.findById(shipment.order_id, { transaction: t });

          await logisticsLinkWorkOrderDao.create({
            work_order_no: workOrderNo,
            shipment_id: shipmentId,
            shipment_no: shipment.shipment_no,
            order_id: shipment.order_id,
            order_no: order?.order_no || '',
            abnormal_log_id: abnormalLog.id,
            type: 1,
            title: `人工标记异常 - ${shipment.logistics_no}`,
            description: abnormalDesc,
            priority: 2,
            status: 0,
            sla_expire_at: new Date(Date.now() + 60 * 60 * 1000),
            created_by: operatorId,
            created_by_name: operatorName,
            source: 'manual',
          }, { transaction: t });

          await t.commit();

          result.success++;
          result.results.push({
            id: shipmentId,
            success: true,
            data: { abnormal_log_id: abnormalLog.id },
          });
        } catch (error: any) {
          await t.rollback();
          result.failed++;
          result.results.push({
            id: shipmentId,
            success: false,
            error: error.message,
          });
        }
      })
    );

    return result;
  }

  async batchLaunchVerify(
    shipmentIds: number[],
    verifyReason: string,
    operatorId: number,
    operatorName: string
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      total: shipmentIds.length,
      success: 0,
      failed: 0,
      results: [],
    };

    await Promise.all(
      shipmentIds.map(async (shipmentId) => {
        const t = await sequelize.transaction();
        try {
          const shipment = await shipmentRecordDao.findById(shipmentId, { transaction: t });
          if (!shipment) {
            throw new Error('发货记录不存在');
          }

          const workOrderNo = `WO${Date.now()}${Math.floor(Math.random() * 10000)}`;
          const order = await orderDao.findById(shipment.order_id, { transaction: t });

          const workOrder = await logisticsLinkWorkOrderDao.create({
            work_order_no: workOrderNo,
            shipment_id: shipmentId,
            shipment_no: shipment.shipment_no,
            order_id: shipment.order_id,
            order_no: order?.order_no || '',
            type: 2,
            title: `物流核查 - ${shipment.logistics_no}`,
            description: verifyReason,
            priority: 2,
            status: 0,
            sla_expire_at: new Date(Date.now() + 120 * 60 * 1000),
            created_by: operatorId,
            created_by_name: operatorName,
            source: 'manual',
          }, { transaction: t });

          await t.commit();

          result.success++;
          result.results.push({
            id: shipmentId,
            success: true,
            data: { work_order_id: workOrder.id, work_order_no: workOrderNo },
          });
        } catch (error: any) {
          await t.rollback();
          result.failed++;
          result.results.push({
            id: shipmentId,
            success: false,
            error: error.message,
          });
        }
      })
    );

    return result;
  }

  async batchSyncLogisticsStatus(
    shipmentIds: number[],
    operatorId: number,
    operatorName: string
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      total: shipmentIds.length,
      success: 0,
      failed: 0,
      results: [],
    };

    await Promise.all(
      shipmentIds.map(async (shipmentId) => {
        try {
          const shipment = await shipmentRecordDao.findById(shipmentId);
          if (!shipment) {
            throw new Error('发货记录不存在');
          }

          const mockTrackData = this.generateMockTrackData(shipment);

          const latestTrack = await logisticsTrackDao.findByCondition(
            { shipment_id: shipmentId },
            { order: [['track_time', 'DESC']], limit: 1 }
          );

          if (latestTrack.length === 0 || latestTrack[0].track_content !== mockTrackData.track_content) {
            await logisticsTrackDao.create({
              shipment_id: shipmentId,
              logistics_no: shipment.logistics_no,
              provider_id: shipment.provider_id,
              track_status: mockTrackData.track_status,
              track_content: mockTrackData.track_content,
              track_time: new Date(),
              is_abnormal: 0,
              created_by: operatorId,
              created_by_name: operatorName,
              source: 'sync',
            });
          }

          result.success++;
          result.results.push({
            id: shipmentId,
            success: true,
            data: { synced: true, new_status: mockTrackData.track_status },
          });
        } catch (error: any) {
          result.failed++;
          result.results.push({
            id: shipmentId,
            success: false,
            error: error.message,
          });
        }
      })
    );

    return result;
  }

  private generateMockTrackData(shipment: any): { track_status: number; track_content: string } {
    const shipTime = new Date(shipment.ship_time || shipment.created_at);
    const now = new Date();
    const daysElapsed = (now.getTime() - shipTime.getTime()) / (1000 * 60 * 60 * 24);

    if (daysElapsed < 0.5) {
      return { track_status: 1, track_content: '快件已揽收' };
    } else if (daysElapsed < 1.5) {
      return { track_status: 2, track_content: '快件正在运输中，已到达【北京转运中心】' };
    } else if (daysElapsed < 2.5) {
      return { track_status: 2, track_content: '快件正在运输中，已到达【上海转运中心】' };
    } else if (daysElapsed < 3) {
      return { track_status: 3, track_content: '快件正在派送中，快递员：张三 13800138000' };
    } else {
      return { track_status: 4, track_content: '快件已签收，签收人：本人' };
    }
  }

  async batchQueryShipments(params: {
    track_status?: number;
    provider_id?: number;
    sign_start_time?: string;
    sign_end_time?: string;
    logistics_no?: string;
    order_no?: string;
    is_abnormal?: number;
    page?: number;
    page_size?: number;
  }): Promise<{ list: any[]; total: number; page: number; page_size: number }> {
    const {
      track_status,
      provider_id,
      sign_start_time,
      sign_end_time,
      logistics_no,
      order_no,
      is_abnormal,
      page = 1,
      page_size = 20,
    } = params;

    const where: any = {};

    if (provider_id) {
      where.provider_id = provider_id;
    }

    if (logistics_no) {
      where.logistics_no = { [Op.like]: `%${logistics_no}%` };
    }

    if (order_no) {
      const orders = await orderDao.findByCondition({
        order_no: { [Op.like]: `%${order_no}%` },
      });
      const orderIds = orders.map(o => o.id);
      if (orderIds.length > 0) {
        where.order_id = { [Op.in]: orderIds };
      } else {
        return { list: [], total: 0, page, page_size };
      }
    }

    if (sign_start_time && sign_end_time) {
      where.sign_time = {
        [Op.between]: [new Date(sign_start_time), new Date(sign_end_time + ' 23:59:59')],
      };
    }

    if (is_abnormal !== undefined && is_abnormal !== null) {
      where.is_abnormal = is_abnormal;
    }

    const { count, rows } = await shipmentRecordDao.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset: (page - 1) * page_size,
      limit: page_size,
    });

    const list = await Promise.all(
      rows.map(async (shipment) => {
        const latestTrack = await logisticsTrackDao.findByCondition(
          { shipment_id: shipment.id },
          { order: [['track_time', 'DESC']], limit: 1 }
        );

        if (track_status !== undefined && track_status !== null) {
          if (!latestTrack.length || latestTrack[0].track_status !== track_status) {
            return null;
          }
        }

        const abnormalCount = await abnormalLogisticsLogDao.count({
          shipment_id: shipment.id,
          is_processed: 0,
        });

        const workOrderCount = await logisticsLinkWorkOrderDao.count({
          shipment_id: shipment.id,
          status: { [Op.in]: [0, 1, 2] },
        });

        const order = await orderDao.findById(shipment.order_id);
        const provider = await logisticsProviderDao.findById(shipment.provider_id);

        return {
          ...shipment.toJSON(),
          latest_track: latestTrack[0] || null,
          abnormal_count: abnormalCount,
          work_order_count: workOrderCount,
          order_info: order ? {
            id: order.id,
            order_no: order.order_no,
            user_name: order.user_name,
            receiver_name: order.receiver_name,
            receiver_phone: order.receiver_phone,
            receiver_address: `${order.receiver_province}${order.receiver_city}${order.receiver_district}${order.receiver_address}`,
          } : null,
          provider_info: provider ? {
            id: provider.id,
            provider_code: provider.provider_code,
            company_name: provider.company_name,
            service_phone: provider.service_phone,
          } : null,
        };
      })
    );

    const filteredList = list.filter(item => item !== null);

    return {
      list: filteredList,
      total: count,
      page,
      page_size,
    };
  }
}

export default new LogisticsLinkBatchService();
