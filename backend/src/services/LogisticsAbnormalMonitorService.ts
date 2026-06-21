import { daos } from '../dao';
import { LogisticsAbnormalDetectionRule, AbnormalDetectionType, DetectionScene } from '../models/LogisticsAbnormalDetectionRule';
import { LogisticsLinkWorkOrder, WorkOrderType, WorkOrderPriority, WorkOrderStatus } from '../models/LogisticsLinkWorkOrder';
import { Op } from 'sequelize';
import { LogisticsTrack } from '../models/LogisticsTrack';
import { AbnormalLogisticsLog } from '../models/AbnormalLogisticsLog';

const {
  logisticsAbnormalDetectionRuleDao,
  logisticsLinkWorkOrderDao,
  logisticsTrackDao,
  abnormalLogisticsLogDao,
  shipmentRecordDao,
  orderDao,
  logisticsProviderDao,
  messageDao,
} = daos;

interface AbnormalDetectionParams {
  stagnant_hours?: number;
  timeout_hours?: number;
  misroute_distance_threshold?: number;
  repeat_track_window_hours?: number;
}

interface DetectionResult {
  has_abnormal: boolean;
  abnormal_type: string;
  abnormal_desc: string;
  alert_level: number;
  suggestion: string;
  auto_create_work_order: boolean;
  auto_notify_user: boolean;
  auto_sync_order_status: boolean;
}

export class LogisticsAbnormalMonitorService {
  async runAbnormalDetection(
    shipmentId: number,
    trackId: number,
    operatorId?: number,
    operatorName?: string
  ): Promise<{ abnormal_detected: boolean; abnormal_log?: any; work_order?: any }> {
    const track = await logisticsTrackDao.findById(trackId);
    if (!track) {
      throw new Error('物流轨迹不存在');
    }

    const shipment = await shipmentRecordDao.findById(shipmentId);
    if (!shipment) {
      throw new Error('发货记录不存在');
    }

    const order = await orderDao.findById(shipment.order_id);

    const rules = await logisticsAbnormalDetectionRuleDao.findByCondition(
      { status: 1 },
      { order: [['priority', 'DESC']] }
    );

    let detectedAbnormal: AbnormalDetectionRule | null = null;
    let detectionResult: DetectionResult | null = null;

    for (const rule of rules) {
      const result = await this.checkSingleRule(rule, track, shipment, order);
      if (result && result.has_abnormal) {
        detectedAbnormal = rule;
        detectionResult = result;
        break;
      }
    }

    if (!detectedAbnormal || !detectionResult) {
      return { abnormal_detected: false };
    }

    const abnormalLog = await abnormalLogisticsLogDao.create({
      shipment_id: shipmentId,
      logistics_no: shipment.logistics_no,
      track_id: trackId,
      abnormal_type: detectionResult.abnormal_type,
      abnormal_desc: detectionResult.abnormal_desc,
      alert_level: detectionResult.alert_level,
      detected_by: 'system_auto',
      detected_at: new Date(),
      suggestion: detectionResult.suggestion,
      is_processed: 0,
      created_by: operatorId,
      created_by_name: operatorName || '系统自动检测',
    });

    let workOrder;
    if (detectionResult.auto_create_work_order) {
      workOrder = await this.createWorkOrderFromAbnormal(
        abnormalLog,
        shipment,
        order,
        detectedAbnormal,
        operatorId,
        operatorName
      );
    }

    if (detectionResult.auto_notify_user) {
      await this.sendAbnormalNotification(abnormalLog, shipment, order, detectedAbnormal);
    }

    if (detectionResult.auto_sync_order_status) {
      await this.syncOrderLogisticsStatus(shipment, order, detectedAbnormal);
    }

    await logisticsTrackDao.update(trackId, {
      is_abnormal: 1,
      abnormal_type: detectionResult.abnormal_type,
      abnormal_desc: detectionResult.abnormal_desc,
    });

    return {
      abnormal_detected: true,
      abnormal_log: abnormalLog,
      work_order: workOrder,
    };
  }

  private async checkSingleRule(
    rule: LogisticsAbnormalDetectionRule,
    track: LogisticsTrack,
    shipment: any,
    order: any
  ): Promise<DetectionResult | null> {
    const detectionParams: AbnormalDetectionParams = rule.detection_params || {};

    if (rule.scene !== DetectionScene.ALL) {
      const isInTransit = track.track_status === 2;
      const isDelivering = track.track_status === 3;
      const isSigned = track.track_status === 4;

      if (rule.scene === DetectionScene.IN_TRANSIT && !isInTransit) return null;
      if (rule.scene === DetectionScene.DELIVERING && !isDelivering) return null;
      if (rule.scene === DetectionScene.SIGNED && !isSigned) return null;
    }

    let hasAbnormal = false;
    let abnormalDesc = '';
    let suggestion = '';

    switch (rule.detection_type) {
      case AbnormalDetectionType.STAGNANT:
        const stagnantResult = await this.checkStagnant(track, shipment, detectionParams.stagnant_hours || 24);
        hasAbnormal = stagnantResult.has_abnormal;
        abnormalDesc = stagnantResult.desc;
        suggestion = stagnantResult.suggestion;
        break;

      case AbnormalDetectionType.MISROUTE:
        const misrouteResult = await this.checkMisroute(track, shipment, order, detectionParams.misroute_distance_threshold || 100);
        hasAbnormal = misrouteResult.has_abnormal;
        abnormalDesc = misrouteResult.desc;
        suggestion = misrouteResult.suggestion;
        break;

      case AbnormalDetectionType.TIMEOUT:
        const timeoutResult = await this.checkTimeout(track, shipment, order, detectionParams.timeout_hours || 72);
        hasAbnormal = timeoutResult.has_abnormal;
        abnormalDesc = timeoutResult.desc;
        suggestion = timeoutResult.suggestion;
        break;

      case AbnormalDetectionType.REPEAT_TRACK:
        const repeatResult = await this.checkRepeatTrack(track, shipment, detectionParams.repeat_track_window_hours || 6);
        hasAbnormal = repeatResult.has_abnormal;
        abnormalDesc = repeatResult.desc;
        suggestion = repeatResult.suggestion;
        break;

      case AbnormalDetectionType.FAKE_TRACK:
        const fakeResult = await this.checkFakeTrack(track, shipment);
        hasAbnormal = fakeResult.has_abnormal;
        abnormalDesc = fakeResult.desc;
        suggestion = fakeResult.suggestion;
        break;

      case AbnormalDetectionType.NODE_MISSING:
        const missingResult = await this.checkNodeMissing(track, shipment);
        hasAbnormal = missingResult.has_abnormal;
        abnormalDesc = missingResult.desc;
        suggestion = missingResult.suggestion;
        break;

      default:
        return null;
    }

    if (!hasAbnormal) {
      return null;
    }

    return {
      has_abnormal: true,
      abnormal_type: rule.detection_type,
      abnormal_desc: abnormalDesc,
      alert_level: rule.alert_level,
      suggestion: suggestion,
      auto_create_work_order: rule.auto_create_work_order || false,
      auto_notify_user: rule.auto_notify_user || false,
      auto_sync_order_status: rule.auto_sync_order_status || false,
    };
  }

  private async checkStagnant(
    track: LogisticsTrack,
    shipment: any,
    thresholdHours: number
  ): Promise<{ has_abnormal: boolean; desc: string; suggestion: string }> {
    const tracks = await logisticsTrackDao.findByCondition(
      { shipment_id: shipment.id },
      { order: [['track_time', 'DESC']] }
    );

    if (tracks.length < 2) {
      return { has_abnormal: false, desc: '', suggestion: '' };
    }

    const latestTrack = tracks[0];
    const now = new Date();
    const trackTime = new Date(latestTrack.track_time || latestTrack.created_at);
    const stagnantHours = (now.getTime() - trackTime.getTime()) / (1000 * 60 * 60);

    if (stagnantHours >= thresholdHours && latestTrack.track_status !== 4) {
      return {
        has_abnormal: true,
        desc: `物流信息已停滞${stagnantHours.toFixed(1)}小时，超过${thresholdHours}小时阈值`,
        suggestion: '建议联系物流服务商核实货物状态，如遇异常及时启动追货流程',
      };
    }

    return { has_abnormal: false, desc: '', suggestion: '' };
  }

  private async checkMisroute(
    track: LogisticsTrack,
    shipment: any,
    order: any,
    thresholdKm: number
  ): Promise<{ has_abnormal: boolean; desc: string; suggestion: string }> {
    const trackAddress = track.track_content || '';
    const receiverCity = order?.receiver_city || '';
    const receiverProvince = order?.receiver_province || '';

    if (!trackAddress || !receiverCity) {
      return { has_abnormal: false, desc: '', suggestion: '' };
    }

    const keywords = ['中转', '转运', '转', '发错', '错发', '返回', '退回', '逆向'];
    const hasMisrouteKeyword = keywords.some(kw => trackAddress.includes(kw));

    const targetDirection = `${receiverProvince}${receiverCity}`;
    const isWrongDirection = hasMisrouteKeyword && !trackAddress.includes(receiverCity);

    if (isWrongDirection || hasMisrouteKeyword) {
      return {
        has_abnormal: true,
        desc: `疑似错发：当前轨迹"${trackAddress}"与目的地"${targetDirection}"方向不符`,
        suggestion: '立即联系物流服务商确认配送路线，如确实错发需启动改址或退回流程',
      };
    }

    return { has_abnormal: false, desc: '', suggestion: '' };
  }

  private async checkTimeout(
    track: LogisticsTrack,
    shipment: any,
    order: any,
    thresholdHours: number
  ): Promise<{ has_abnormal: boolean; desc: string; suggestion: string }> {
    const shipTime = new Date(shipment.ship_time || shipment.created_at);
    const now = new Date();
    const elapsedHours = (now.getTime() - shipTime.getTime()) / (1000 * 60 * 60);

    const isDelivering = track.track_status === 3;
    const isTransit = track.track_status === 2;

    if (isTransit && elapsedHours > thresholdHours) {
      return {
        has_abnormal: true,
        desc: `运输超时：已发货${elapsedHours.toFixed(1)}小时仍未派送，超过${thresholdHours}小时阈值`,
        suggestion: '催促物流服务商加快派送，必要时升级为加急处理',
      };
    }

    if (isDelivering && elapsedHours > thresholdHours + 24) {
      return {
        has_abnormal: true,
        desc: `派送超时：已开始派送${(elapsedHours - thresholdHours).toFixed(1)}小时仍未签收`,
        suggestion: '联系快递员确认派送时间，如无法联系请联系网点协调',
      };
    }

    return { has_abnormal: false, desc: '', suggestion: '' };
  }

  private async checkRepeatTrack(
    track: LogisticsTrack,
    shipment: any,
    windowHours: number
  ): Promise<{ has_abnormal: boolean; desc: string; suggestion: string }> {
    const tracks = await logisticsTrackDao.findByCondition({
      shipment_id: shipment.id,
      track_status: track.track_status,
      id: { [Op.ne]: track.id },
    });

    const now = new Date();
    const currentTrackTime = new Date(track.track_time || track.created_at);

    for (const existingTrack of tracks) {
      const existingTime = new Date(existingTrack.track_time || existingTrack.created_at);
      const hourDiff = Math.abs((currentTrackTime.getTime() - existingTime.getTime()) / (1000 * 60 * 60));

      if (hourDiff < windowHours && existingTrack.track_content === track.track_content) {
        return {
          has_abnormal: true,
          desc: `检测到重复节点：${windowHours}小时内已存在相同内容的轨迹记录`,
          suggestion: '核实是否为重复上报，如为误报可删除重复记录',
        };
      }
    }

    return { has_abnormal: false, desc: '', suggestion: '' };
  }

  private async checkFakeTrack(
    track: LogisticsTrack,
    shipment: any
  ): Promise<{ has_abnormal: boolean; desc: string; suggestion: string }> {
    const trackContent = track.track_content || '';
    const fakeKeywords = ['测试', '虚假', '模拟', '演示', '样例', '示例'];
    const hasFakeKeyword = fakeKeywords.some(kw => trackContent.includes(kw));

    if (hasFakeKeyword) {
      return {
        has_abnormal: true,
        desc: `疑似虚假轨迹：轨迹内容包含可疑关键词`,
        suggestion: '立即核实轨迹真实性，如确认为虚假物流需追究服务商责任',
      };
    }

    const trackTime = new Date(track.track_time || track.created_at);
    const now = new Date();
    if (trackTime > now) {
      return {
        has_abnormal: true,
        desc: `疑似虚假轨迹：轨迹时间晚于当前时间，存在预录入嫌疑`,
        suggestion: '核实轨迹上报时间是否正确，如为伪造需严肃处理',
      };
    }

    return { has_abnormal: false, desc: '', suggestion: '' };
  }

  private async checkNodeMissing(
    track: LogisticsTrack,
    shipment: any
  ): Promise<{ has_abnormal: boolean; desc: string; suggestion: string }> {
    const tracks = await logisticsTrackDao.findByCondition(
      { shipment_id: shipment.id },
      { order: [['track_time', 'ASC']] }
    );

    const statusSequence = tracks.map(t => t.track_status);
    const expectedSequence = [1, 2, 3, 4];

    let currentExpectedIndex = 0;
    const missingNodes: string[] = [];

    for (const actualStatus of statusSequence) {
      while (currentExpectedIndex < expectedSequence.length && expectedSequence[currentExpectedIndex] < actualStatus) {
        const statusNames = ['', '已揽收', '运输中', '派送中', '已签收'];
        missingNodes.push(statusNames[expectedSequence[currentExpectedIndex]]);
        currentExpectedIndex++;
      }
      if (expectedSequence[currentExpectedIndex] === actualStatus) {
        currentExpectedIndex++;
      }
    }

    if (missingNodes.length > 0) {
      return {
        has_abnormal: true,
        desc: `链路节点缺失：缺少${missingNodes.join('、')}节点`,
        suggestion: '联系物流服务商补全缺失的轨迹节点，确保链路完整性',
      };
    }

    return { has_abnormal: false, desc: '', suggestion: '' };
  }

  private async createWorkOrderFromAbnormal(
    abnormalLog: AbnormalLogisticsLog,
    shipment: any,
    order: any,
    rule: LogisticsAbnormalDetectionRule,
    operatorId?: number,
    operatorName?: string
  ): Promise<LogisticsLinkWorkOrder> {
    const workOrderNo = `WO${Date.now()}${Math.floor(Math.random() * 10000)}`;

    const priorityMap: { [key: number]: number } = {
      1: WorkOrderPriority.LOW,
      2: WorkOrderPriority.MEDIUM,
      3: WorkOrderPriority.HIGH,
    };

    const slaMinutes = rule.sla_response_minutes || 60;
    const slaExpireAt = new Date(Date.now() + slaMinutes * 60 * 1000);

    return await logisticsLinkWorkOrderDao.create({
      work_order_no: workOrderNo,
      shipment_id: shipment.id,
      shipment_no: shipment.shipment_no,
      order_id: shipment.order_id,
      order_no: order?.order_no || '',
      abnormal_log_id: abnormalLog.id,
      type: WorkOrderType.ABNORMAL,
      title: `${this.getAbnormalTypeName(abnormalLog.abnormal_type)} - ${shipment.logistics_no}`,
      description: abnormalLog.abnormal_desc,
      priority: priorityMap[abnormalLog.alert_level] || WorkOrderPriority.MEDIUM,
      status: WorkOrderStatus.PENDING,
      sla_expire_at: slaExpireAt,
      created_by: operatorId,
      created_by_name: operatorName || '系统自动创建',
      source: 'system',
      remark: `根据规则【${rule.rule_name}】自动创建`,
    });
  }

  private async sendAbnormalNotification(
    abnormalLog: AbnormalLogisticsLog,
    shipment: any,
    order: any,
    rule: LogisticsAbnormalDetectionRule
  ): Promise<void> {
    const levelText = ['', '轻微', '一般', '严重'][abnormalLog.alert_level] || '一般';
    const content = `【物流异常提醒】您的订单${order?.order_no || ''}物流${this.getAbnormalTypeName(abnormalLog.abnormal_type)}，${levelText}级别：${abnormalLog.abnormal_desc}。${abnormalLog.suggestion || ''}`;

    if (order?.user_id) {
      await messageDao.create({
        user_id: order.user_id,
        title: '物流异常提醒',
        content: content,
        type: 2,
        is_read: 0,
      });
    }
  }

  private async syncOrderLogisticsStatus(
    shipment: any,
    order: any,
    rule: LogisticsAbnormalDetectionRule
  ): Promise<void> {
    if (!order) return;

    await orderDao.update(order.id, {
      logistics_status: 5,
      logistics_remark: `物流异常：${this.getAbnormalTypeName(rule.detection_type)}`,
      updated_at: new Date(),
    });
  }

  private getAbnormalTypeName(type: string): string {
    const nameMap: { [key: string]: string } = {
      [AbnormalDetectionType.STAGNANT]: '物流停滞',
      [AbnormalDetectionType.MISROUTE]: '错发',
      [AbnormalDetectionType.TIMEOUT]: '超时',
      [AbnormalDetectionType.DELAYED_DELIVERY]: '派送延迟',
      [AbnormalDetectionType.REPEAT_TRACK]: '重复节点',
      [AbnormalDetectionType.FAKE_TRACK]: '虚假轨迹',
      [AbnormalDetectionType.NODE_MISSING]: '节点缺失',
    };
    return nameMap[type] || type;
  }

  async processAbnormalManually(
    abnormalLogId: number,
    processType: string,
    processRemark: string,
    operatorId: number,
    operatorName: string
  ): Promise<void> {
    const abnormalLog = await abnormalLogisticsLogDao.findById(abnormalLogId);
    if (!abnormalLog) {
      throw new Error('异常记录不存在');
    }

    await abnormalLogisticsLogDao.update(abnormalLogId, {
      is_processed: 1,
      processed_by: operatorId,
      processed_by_name: operatorName,
      processed_at: new Date(),
      process_result: processType,
      process_remark: processRemark,
    });

    const workOrders = await logisticsLinkWorkOrderDao.findByCondition({
      abnormal_log_id: abnormalLogId,
    });

    for (const workOrder of workOrders) {
      let status = WorkOrderStatus.PROCESSING;
      let resolution = '';

      switch (processType) {
        case 'resolved':
          status = WorkOrderStatus.RESOLVED;
          resolution = `异常已处理：${processRemark}`;
          break;
        case 'pending_confirm':
          status = WorkOrderStatus.PENDING_USER_CONFIRM;
          resolution = `待用户确认：${processRemark}`;
          break;
        case 'escalated':
          status = WorkOrderStatus.ESCALATED;
          resolution = `已升级处理：${processRemark}`;
          break;
        case 'false_alarm':
          status = WorkOrderStatus.CLOSED;
          resolution = `误报解除：${processRemark}`;
          break;
      }

      await logisticsLinkWorkOrderDao.update(workOrder.id, {
        status,
        resolution,
        handled_by: operatorId,
        handled_by_name: operatorName,
        resolved_at: processType === 'resolved' || processType === 'closed' || processType === 'false_alarm' ? new Date() : undefined,
      });
    }
  }

  async batchDetectAbnormal(shipmentIds: number[], operatorId?: number, operatorName?: string): Promise<any[]> {
    const results: any[] = [];

    for (const shipmentId of shipmentIds) {
      try {
        const tracks = await logisticsTrackDao.findByCondition(
          { shipment_id: shipmentId },
          { order: [['track_time', 'DESC'], ['id', 'DESC']], limit: 1 }
        );

        if (tracks.length > 0) {
          const result = await this.runAbnormalDetection(shipmentId, tracks[0].id, operatorId, operatorName);
          results.push({
            shipment_id: shipmentId,
            success: true,
            ...result,
          });
        } else {
          results.push({
            shipment_id: shipmentId,
            success: false,
            error: '无轨迹记录',
          });
        }
      } catch (error: any) {
        results.push({
          shipment_id: shipmentId,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}

export default new LogisticsAbnormalMonitorService();
