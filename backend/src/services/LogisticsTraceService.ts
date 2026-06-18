import { Op } from 'sequelize';
import { daos } from '../dao';
import { ShipmentRecord } from '../models/ShipmentRecord';
import { LogisticsTrack } from '../models/LogisticsTrack';

export interface LogisticsTraceData {
  shipmentRecord: any | null;
  orderInfo: any | null;
  userInfo: any | null;
  merchantInfo: any | null;
  logisticsProvider: any | null;
  logisticsTracks: any[];
  abnormalLogs: any[];
  orderLogs: any[];
}

export interface LogisticsValidationReport {
  orderMatch: boolean;
  logisticsNoValid: boolean;
  providerValid: boolean;
  trackContinuity: boolean;
  noDuplicate: boolean;
  addressMatch: boolean;
  overallScore: number;
  issues: string[];
}

class LogisticsTraceService {
  private readonly shipmentRecordDao = daos.shipmentRecordDao;
  private readonly logisticsProviderDao = daos.logisticsProviderDao;
  private readonly logisticsTrackDao = daos.logisticsTrackDao;
  private readonly abnormalLogisticsLogDao = daos.abnormalLogisticsLogDao;
  private readonly orderDao = daos.orderDao;
  private readonly orderLogDao = daos.orderLogDao;
  private readonly userDao = daos.userDao;
  private readonly merchantDao = daos.merchantDao;

  async getLogisticsTrace(orderId: number): Promise<LogisticsTraceData> {
    const shipment = await this.shipmentRecordDao.findOne({
      where: { order_id: orderId },
      order: [['created_at', 'DESC']],
    });

    if (!shipment) {
      return {
        shipmentRecord: null,
        orderInfo: null,
        userInfo: null,
        merchantInfo: null,
        logisticsProvider: null,
        logisticsTracks: [],
        abnormalLogs: [],
        orderLogs: [],
      };
    }

    return this.buildTraceData(shipment);
  }

  private async buildTraceData(shipment: ShipmentRecord): Promise<LogisticsTraceData> {
    const order = await this.orderDao.findById(shipment.order_id);
    const user = order?.user_id ? await this.userDao.findById(order.user_id) : null;
    const merchant = order?.merchant_id ? await this.merchantDao.findById(order.merchant_id) : null;
    const provider = shipment.provider_id ? await this.logisticsProviderDao.findById(shipment.provider_id) : null;

    const logisticsTracks = await this.logisticsTrackDao.findAll({
      where: { shipment_id: shipment.id },
      order: [['track_time', 'ASC']],
    });

    const abnormalLogs = await this.abnormalLogisticsLogDao.findAll({
      where: { shipment_id: shipment.id },
      order: [['created_at', 'DESC']],
    });

    const orderLogs = await this.orderLogDao.findAll({
      where: { order_id: shipment.order_id },
      order: [['created_at', 'DESC']],
    });

    return {
      shipmentRecord: shipment,
      orderInfo: order,
      userInfo: user,
      merchantInfo: merchant,
      logisticsProvider: provider,
      logisticsTracks,
      abnormalLogs,
      orderLogs,
    };
  }

  private validateLogisticsNoFormat(logisticsNo: string): boolean {
    if (!logisticsNo || logisticsNo.trim().length < 5) {
      return false;
    }
    const cleaned = logisticsNo.trim().toUpperCase();
    const pattern = /^[A-Z0-9]{5,}$/;
    return pattern.test(cleaned);
  }

  private checkTrackContinuity(tracks: LogisticsTrack[]): { continuous: boolean; issues: string[] } {
    const issues: string[] = [];
    let continuous = true;

    if (tracks.length === 0) {
      return { continuous: false, issues: ['暂无物流轨迹数据'] };
    }

    const sortedTracks = [...tracks].sort((a, b) => {
      return new Date(a.track_time).getTime() - new Date(b.track_time).getTime();
    });

    const statusOrder = [1, 2, 3, 4];
    let lastValidStatus = 0;

    for (let i = 0; i < sortedTracks.length; i++) {
      const track = sortedTracks[i];
      const statusIdx = statusOrder.indexOf(track.track_status);

      if (statusIdx !== -1 && statusIdx < lastValidStatus) {
        continuous = false;
        issues.push(`轨迹时间顺序异常：第${i + 1}条轨迹状态早于前一条`);
      }

      if (statusIdx > lastValidStatus) {
        for (let j = lastValidStatus + 1; j < statusIdx; j++) {
          continuous = false;
          const missingStatusName = this.getTrackStatusName(statusOrder[j]);
          issues.push(`缺少${missingStatusName}环节的轨迹记录`);
        }
        lastValidStatus = statusIdx;
      }
    }

    return { continuous, issues };
  }

  async validateLogisticsData(orderId: number): Promise<LogisticsValidationReport> {
    const report: LogisticsValidationReport = {
      orderMatch: true,
      logisticsNoValid: true,
      providerValid: true,
      trackContinuity: true,
      noDuplicate: true,
      addressMatch: true,
      overallScore: 100,
      issues: [],
    };

    const shipment = await this.shipmentRecordDao.findOne({
      where: { order_id: orderId },
      order: [['created_at', 'DESC']],
    });

    if (!shipment) {
      report.orderMatch = false;
      report.logisticsNoValid = false;
      report.providerValid = false;
      report.trackContinuity = false;
      report.noDuplicate = false;
      report.addressMatch = false;
      report.overallScore = 0;
      report.issues.push('该订单暂无发货记录');
      return report;
    }

    const order = await this.orderDao.findById(orderId);
    if (!order) {
      report.orderMatch = false;
      report.overallScore = 10;
      report.issues.push('关联订单不存在');
      return report;
    }

    if (shipment.order_id !== order.id || shipment.order_no !== order.order_no) {
      report.orderMatch = false;
      report.overallScore -= 17;
      report.issues.push('物流记录与订单ID或订单号不匹配');
    }

    if (shipment.receiver_name !== order.receiver_name) {
      report.orderMatch = false;
      report.overallScore -= 5;
      report.issues.push('收货人姓名不一致');
    }

    if (shipment.receiver_phone !== order.receiver_phone) {
      report.orderMatch = false;
      report.overallScore -= 5;
      report.issues.push('收货人电话不一致');
    }

    if (!this.validateLogisticsNoFormat(shipment.tracking_no)) {
      report.logisticsNoValid = false;
      report.overallScore -= 17;
      report.issues.push('物流单号格式无效');
    }

    const provider = shipment.provider_id ? await this.logisticsProviderDao.findById(shipment.provider_id) : null;
    if (!provider) {
      report.providerValid = false;
      report.overallScore -= 17;
      report.issues.push('物流服务商不存在');
    } else if (provider.status !== 1) {
      report.providerValid = false;
      report.overallScore -= 10;
      report.issues.push('物流服务商已被禁用');
    } else if (provider.provider_name !== shipment.provider_name) {
      report.providerValid = false;
      report.overallScore -= 5;
      report.issues.push('物流服务商名称不一致');
    }

    const tracks = await this.logisticsTrackDao.findAll({
      where: { shipment_id: shipment.id },
    });

    const trackCheck = this.checkTrackContinuity(tracks);
    if (!trackCheck.continuous) {
      report.trackContinuity = false;
      report.overallScore -= 16;
      report.issues.push(...trackCheck.issues);
    }

    if (shipment.tracking_no) {
      const duplicateShipments = await this.shipmentRecordDao.findAll({
        where: {
          tracking_no: shipment.tracking_no,
          id: { [Op.ne]: shipment.id },
        },
      });

      if (duplicateShipments.length > 0) {
        report.noDuplicate = false;
        report.overallScore -= 16;
        report.issues.push(`物流单号存在${duplicateShipments.length}条重复记录`);
      }
    }

    const orderAddress = [order.receiver_province, order.receiver_city, order.receiver_district, order.receiver_address]
      .filter(Boolean)
      .join('')
      .replace(/\s+/g, '');
    const shipmentAddress = (shipment.to_address || '').replace(/\s+/g, '');

    if (orderAddress && shipmentAddress) {
      const similarity = this.calculateAddressSimilarity(orderAddress, shipmentAddress);
      if (similarity < 0.7) {
        report.addressMatch = false;
        report.overallScore -= 17;
        report.issues.push('收货地址一致性较低');
      }
    } else if (!shipmentAddress) {
      report.addressMatch = false;
      report.overallScore -= 10;
      report.issues.push('发货记录缺少收货地址');
    }

    report.overallScore = Math.max(0, Math.min(100, report.overallScore));
    return report;
  }

  private calculateAddressSimilarity(addr1: string, addr2: string): number {
    if (!addr1 || !addr2) return 0;
    if (addr1 === addr2) return 1;

    let matches = 0;
    const set1 = new Set(addr1.split(''));
    const set2 = new Set(addr2.split(''));

    for (const char of set1) {
      if (set2.has(char)) {
        matches++;
      }
    }

    const totalChars = Math.max(set1.size, set2.size);
    return totalChars > 0 ? matches / totalChars : 0;
  }

  async checkLogisticsMatch(orderId: number): Promise<boolean> {
    const shipment = await this.shipmentRecordDao.findOne({
      where: { order_id: orderId },
      order: [['created_at', 'DESC']],
    });

    if (!shipment) return false;

    const order = await this.orderDao.findById(orderId);
    if (!order) return false;

    if (shipment.order_id !== order.id) return false;
    if (shipment.order_no !== order.order_no) return false;

    if (shipment.receiver_name && order.receiver_name && shipment.receiver_name !== order.receiver_name) {
      return false;
    }

    if (shipment.receiver_phone && order.receiver_phone && shipment.receiver_phone !== order.receiver_phone) {
      return false;
    }

    return true;
  }

  async getLogisticsTraceByShipmentId(shipmentId: number): Promise<LogisticsTraceData> {
    const shipment = await this.shipmentRecordDao.findById(shipmentId);

    if (!shipment) {
      return {
        shipmentRecord: null,
        orderInfo: null,
        userInfo: null,
        merchantInfo: null,
        logisticsProvider: null,
        logisticsTracks: [],
        abnormalLogs: [],
        orderLogs: [],
      };
    }

    return this.buildTraceData(shipment);
  }

  async getLogisticsTraceByLogisticsNo(logisticsNo: string): Promise<LogisticsTraceData> {
    const shipment = await this.shipmentRecordDao.findOne({
      where: { tracking_no: logisticsNo },
      order: [['created_at', 'DESC']],
    });

    if (!shipment) {
      return {
        shipmentRecord: null,
        orderInfo: null,
        userInfo: null,
        merchantInfo: null,
        logisticsProvider: null,
        logisticsTracks: [],
        abnormalLogs: [],
        orderLogs: [],
      };
    }

    return this.buildTraceData(shipment);
  }

  getTrackStatusName(status?: number): string {
    const names: Record<number, string> = {
      1: '已揽收',
      2: '运输中',
      3: '派送中',
      4: '已签收',
      5: '异常',
      6: '退回',
    };
    return names[status || 0] || '未知';
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

  getAbnormalTypeName(type?: number): string {
    const names: Record<number, string> = {
      1: '地址异常',
      2: '物流停滞',
      3: '拒收',
      4: '破损',
      5: '丢件',
    };
    return names[type || 0] || '未知';
  }

  getAbnormalLevelName(level?: number): string {
    const names: Record<number, string> = {
      1: '轻微',
      2: '一般',
      3: '严重',
    };
    return names[level || 0] || '未知';
  }
}

export const logisticsTraceService = new LogisticsTraceService();
export default logisticsTraceService;
