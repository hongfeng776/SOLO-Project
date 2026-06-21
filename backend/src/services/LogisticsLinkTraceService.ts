import { daos } from '../dao';
import { Op } from 'sequelize';
import { LogisticsLinkNodeExtension, LinkNodeVerificationStatus } from '../models/LogisticsLinkNodeExtension';
import { LogisticsTrack } from '../models/LogisticsTrack';
import crypto from 'crypto';

const {
  logisticsTrackDao,
  logisticsLinkNodeExtensionDao,
  logisticsLinkWorkOrderDao,
  abnormalLogisticsLogDao,
  shipmentRecordDao,
  orderDao,
  orderLogDao,
  logisticsProviderDao,
  orderItemDao,
  goodsDao,
} = daos;

interface LinkIntegrityReport {
  total_nodes: number;
  expected_nodes: number;
  missing_nodes: string[];
  duplicate_nodes: number;
  fake_nodes: number;
  suspicious_nodes: number;
  integrity_score: number;
  is_complete: boolean;
  issues: string[];
  recommendations: string[];
}

interface TrackNodeDetail {
  id: number;
  track_id: number;
  track_time: Date;
  track_status: number;
  track_content: string;
  is_abnormal: boolean;
  abnormal_type?: string;
  abnormal_desc?: string;
  node_extension?: LogisticsLinkNodeExtension;
  operator_name?: string;
  operator_phone?: string;
  operator_id?: number;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  branch_name?: string;
  branch_code?: string;
  verification_status?: number;
  created_at: Date;
  created_by_name?: string;
  source?: string;
  is_backfilled?: boolean;
  hash?: string;
  time_gap_hours?: number;
  distance_from_last?: number;
  is_suspicious?: boolean;
  suspicious_reason?: string;
}

interface FullLinkTrace {
  shipment_info: any;
  order_info: any;
  provider_info: any;
  track_nodes: TrackNodeDetail[];
  abnormal_records: any[];
  work_orders: any[];
  operation_logs: any[];
  integrity_report: LinkIntegrityReport;
}

export class LogisticsLinkTraceService {
  async getFullLinkTrace(shipmentId: number): Promise<FullLinkTrace> {
    const shipment = await shipmentRecordDao.findById(shipmentId);
    if (!shipment) {
      throw new Error('发货记录不存在');
    }

    const order = await orderDao.findById(shipment.order_id);
    const provider = await logisticsProviderDao.findById(shipment.provider_id);

    const tracks = await logisticsTrackDao.findByCondition(
      { shipment_id: shipmentId },
      { order: [['track_time', 'ASC'], include: [{ model: LogisticsLinkNodeExtension, as: 'node_extension' }]
    );

    const abnormalRecords = await abnormalLogisticsLogDao.findByCondition(
      { shipment_id: shipmentId },
      { order: [['created_at', 'DESC']]
    );

    const workOrders = await logisticsLinkWorkOrderDao.findByCondition(
      { shipment_id: shipmentId },
      { order: [['created_at', 'DESC']]
    );

    const operationLogs = await orderLogDao.findByCondition(
      { order_id: shipment.order_id },
      { order: [['created_at', 'DESC']]
    );

    const orderItems = await orderItemDao.findByCondition({ order_id: shipment.order_id });
    const goodsIds = orderItems.map(item => item.goods_id);
    const goodsList = await goodsDao.findByIds(goodsIds);

    const trackNodes = await this.enrichTrackNodes(tracks, shipment);

    const integrityReport = await this.calculateLinkIntegrity(trackNodes, shipment, order);

    return {
      shipment_info: {
        ...shipment.toJSON(),
        goods_list: orderItems.map(item => ({
          ...item.toJSON(),
          goods_detail: goodsList.find(g => g.id === item.goods_id),
        })),
      },
      order_info: order ? {
        id: order.id,
        order_no: order.order_no,
        user_name: order.user_name,
        receiver_name: order.receiver_name,
        receiver_phone: order.receiver_phone,
        receiver_province: order.receiver_province,
        receiver_city: order.receiver_city,
        receiver_district: order.receiver_district,
        receiver_address: order.receiver_address,
        goods_amount: order.goods_amount,
        order_amount: order.order_amount,
        pay_time: order.pay_time,
        created_at: order.created_at,
      } : null,
      provider_info: provider ? {
        id: provider.id,
        provider_code: provider.provider_code,
        company_name: provider.company_name,
        service_phone: provider.service_phone,
        contact_person: provider.contact_person,
        contact_phone: provider.contact_phone,
      } : null,
      track_nodes: trackNodes,
      abnormal_records: abnormalRecords,
      work_orders: workOrders,
      operation_logs: operationLogs,
      integrity_report: integrityReport,
    };
  }

  private async enrichTrackNodes(
    tracks: LogisticsTrack[],
    shipment: any
  ): Promise<TrackNodeDetail[]> {
    const enriched: TrackNodeDetail[] = [];
    let lastNodeTime: TrackNodeDetail | null = null;

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      const nodeHash = this.generateNodeHash(track, shipment);

      let nodeExtension = await logisticsLinkNodeExtensionDao.findByCondition({
        track_id: track.id,
      });

      let extension = nodeExtension[0];

      if (!extension) {
        extension = await this.autoCreateNodeExtension(track, shipment, nodeHash);
      }

      const timeGapHours = lastNode
        ? (new Date(track.track_time || track.created_at).getTime() -
            new Date(lastNode.track_time).getTime()) /
          (1000 * 60 * 60)
        : 0;

      const isSuspicious = this.checkNodeSuspicious(track, extension, timeGapHours, lastNode);

      const node: TrackNodeDetail = {
        id: i + 1,
        track_id: track.id,
        track_time: new Date(track.track_time || track.created_at),
        track_status: track.track_status,
        track_content: track.track_content,
        is_abnormal: track.is_abnormal === 1,
        abnormal_type: track.abnormal_type,
        abnormal_desc: track.abnormal_desc,
        operator_name: extension?.operator_name,
        operator_phone: extension?.operator_phone,
        operator_id: extension?.operator_id,
        province: extension?.province,
        city: extension?.city,
        district: extension?.district,
        address: extension?.address,
        latitude: extension?.latitude,
        longitude: extension?.longitude,
        branch_name: extension?.branch_name,
        branch_code: extension?.branch_code,
        verification_status: extension?.verification_status,
        created_at: new Date(track.created_at),
        created_by_name: track.created_by_name,
        source: extension?.source,
        is_backfilled: extension?.is_backfilled,
        hash: nodeHash,
        time_gap_hours: parseFloat(timeGapHours.toFixed(2)),
        is_suspicious: isSuspicious.isSuspicious,
        suspicious_reason: isSuspicious.reason,
      };

      enriched.push(node);
      lastNode = node;
    }

    return enriched;
  }

  private generateNodeHash(track: LogisticsTrack, shipment: any): string {
    const content = `${shipment.id}-${track.track_status}-${track.track_content}-${track.track_time || track.created_at}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  private async autoCreateNodeExtension(
    track: LogisticsTrack,
    shipment: any,
    nodeHash: string
  ): Promise<LogisticsLinkNodeExtension> {
    const trackContent = track.track_content || '';
    let province = '';
    let city = '';
    let district = '';
    let address = '';
    let operatorName = '';
    let operatorPhone = '';
    let branchName = '';
    let branchCode = '';

    const statusMap: { [key: number]: string } = {
      1: '揽收网点',
      2: '运输中心',
      3: '派送网点',
      4: '收货地',
    };

    branchName = statusMap[track.track_status] || '未知节点';

    if (trackContent.includes('快递员') || trackContent.includes('派送')) {
      const nameMatch = trackContent.match(/快递员[：:]*([^，,。\s]+)/);
      const phoneMatch = trackContent.match(/1[3-9]\d{9}/);
      if (nameMatch) operatorName = nameMatch[1];
      if (phoneMatch) operatorPhone = phoneMatch[0];
    }

    const cityMatch = trackContent.match(/【([^】]+)】/);
    if (cityMatch) {
      const location = cityMatch[1];
      if (location.includes('转运中心') || location.includes('中转')) {
        city = location.replace('转运中心', '').replace('中转', '');
        branchName = location;
      }
    }

    const isFake = this.checkFakeTrack(track, shipment);

    return await logisticsLinkNodeExtensionDao.create({
      track_id: track.id,
      shipment_id: shipment.id,
      logistics_no: shipment.logistics_no,
      node_hash: nodeHash,
      node_time: new Date(track.track_time || track.created_at),
      province,
      city,
      district,
      address,
      operator_name: operatorName,
      operator_phone: operatorPhone,
      branch_name: branchName,
      branch_code: branchCode,
      verification_status: isFake
        ? LinkNodeVerificationStatus.FAKE
        : LinkNodeVerificationStatus.PENDING,
      verification_remark: isFake ? '系统自动识别为虚假轨迹' : undefined,
      is_abnormal: track.is_abnormal === 1,
      abnormal_type: track.abnormal_type,
      abnormal_desc: track.abnormal_desc,
      source: track.source || 'system',
      is_backfilled: false,
    });
  }

  private checkNodeSuspicious(
    track: LogisticsTrack,
    extension: LogisticsLinkNodeExtension | undefined,
    timeGapHours: number,
    lastNode: TrackNodeDetail | null
  ): { isSuspicious: boolean; reason?: string } {
    const reasons: string[] = [];

    if (extension?.verification_status === LinkNodeVerificationStatus.SUSPICIOUS) {
      reasons.push('人工标记存疑');
    }

    if (extension?.verification_status === LinkNodeVerificationStatus.FAKE) {
      reasons.push('系统识别为虚假轨迹');
    }

    if (timeGapHours < 0) {
      reasons.push('轨迹时间倒退');
    }

    if (timeGapHours > 72 && track.track_status !== 4) {
      reasons.push(`节点间隔超过72小时');
    }

    if (lastNode && lastNode.track_status > track.track_status) {
      reasons.push('物流状态倒退');
    }

    if (lastNode && lastNode.track_content === track.track_content) {
      reasons.push('重复轨迹内容');
    }

    return {
      isSuspicious: reasons.length > 0,
      reason: reasons.join('；'),
    };
  }

  private checkFakeTrack(track: LogisticsTrack, shipment: any): boolean {
    const trackContent = track.track_content || '';
    const fakeKeywords = ['测试', '虚假', '模拟', '演示', '样例', '示例'];
    if (fakeKeywords.some(kw => trackContent.includes(kw))) {
      return true;
    }

    const trackTime = new Date(track.track_time || track.created_at);
    const now = new Date();
    if (trackTime > now) {
      return true;
    }

    return false;
  }

  async checkDuplicateNode(
    track: LogisticsTrack,
    shipment: any
  ): Promise<{ is_duplicate: boolean; existing_node?: any }> {
    const nodeHash = this.generateNodeHash(track, shipment);

    const existing = await logisticsLinkNodeExtensionDao.findByCondition({
      node_hash: nodeHash,
      shipment_id: shipment.id,
      id: { [Op.ne]: track.id },
    });

    if (existing.length > 0) {
      return {
        is_duplicate: true,
        existing_node: existing[0],
      };
    }

    const windowHours = 6;
    const trackTime = new Date(track.track_time || track.created_at);
    const startTime = new Date(trackTime.getTime() - windowHours * 60 * 60 * 1000);
    const endTime = new Date(trackTime.getTime() + windowHours * 60 * 60 * 1000);

    const similarNodes = await logisticsLinkNodeExtensionDao.findByCondition({
      shipment_id: shipment.id,
      track_id: { [Op.ne]: track.id },
      node_time: { [Op.between]: [startTime, endTime] },
    });

    for (const node of similarNodes) {
      const existingTrack = await logisticsTrackDao.findById(node.track_id);
      if (existingTrack && existingTrack.track_content === track.track_content) {
        return {
          is_duplicate: true,
          existing_node: node,
        };
      }
    }

    return { is_duplicate: false };
  }

  async checkFakeTrackAdvanced(
    track: LogisticsTrack,
    shipment: any
  ): Promise<{ is_fake: boolean; fake_type?: string; fake_reason?: string }> {
    const checkBasic = this.checkFakeTrack(track, shipment);
    if (checkBasic) {
      return {
        is_fake: true,
        fake_type: 'basic_check',
        fake_reason: '基础校验不通过',
      };
    }

    const tracks = await logisticsTrackDao.findByCondition(
      { shipment_id: shipment.id },
      { order: [['track_time', 'ASC']]
    );

    const currentIndex = tracks.findIndex(t => t.id === track.id);

    if (currentIndex > 0) {
      const prevTrack = tracks[currentIndex - 1];
      const prevTime = new Date(prevTrack.track_time || prevTrack.created_at);
      const currTime = new Date(track.track_time || track.created_at);
      const hoursDiff = (currTime.getTime() - prevTime.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < 0) {
        return {
          is_fake: true,
          fake_type: 'time_backwards',
          fake_reason: '轨迹时间倒退',
        };
      }

      if (hoursDiff < 0.5 && prevTrack.track_content === track.track_content) {
        return {
          is_fake: true,
          fake_type: 'rapid_update',
          fake_reason: '极短时间内重复更新',
        };
      }
    }

    if (track.track_status === 4 && tracks.length < 3) {
      return {
        is_fake: true,
        fake_type: 'premature_signature',
        fake_reason: '链路不完整情况下提前签收',
      };
    }

    const order = await orderDao.findById(shipment.order_id);
    if (order) {
      const payTime = new Date(order.pay_time || order.created_at);
      const trackTime = new Date(track.track_time || track.created_at);
      const hoursAfterPay = (trackTime.getTime() - payTime.getTime()) / (1000 * 60 * 60);

      if (hoursAfterPay < 1) {
        return {
          is_fake: true,
          fake_type: 'unrealistic_timing',
          fake_reason: '支付后1小时内出现物流轨迹',
        };
      }
    }

    return { is_fake: false };
  }

  private async calculateLinkIntegrity(
    trackNodes: TrackNodeDetail[],
    shipment: any,
    order: any
  ): Promise<LinkIntegrityReport> {
    const expectedStatusSequence = [1, 2, 3, 4];
    const actualStatuses = trackNodes.map(n => n.track_status);

    const missingNodes: string[] = [];
    const statusNames = ['', '已揽收', '运输中', '派送中', '已签收', '异常', '退回'];

    let lastExpectedIndex = 0;
    for (const actual of actualStatuses) {
      while (lastExpectedIndex < expectedStatusSequence.length && expectedStatusSequence[lastExpectedIndex] < actual) {
        missingNodes.push(statusNames[expectedStatusSequence[lastExpectedIndex]]);
        lastExpectedIndex++;
      }
      if (expectedStatusSequence[lastExpectedIndex] === actual) {
        lastExpectedIndex++;
      }
    }

    while (lastExpectedIndex < expectedStatusSequence.length) {
      missingNodes.push(statusNames[expectedStatusSequence[lastExpectedIndex]]);
      lastExpectedIndex++;
    }

    const duplicateNodes = trackNodes.filter(n => n.suspicious_reason?.includes('重复')).length;
    const fakeNodes = trackNodes.filter(n => n.verification_status === LinkNodeVerificationStatus.FAKE).length;
    const suspiciousNodes = trackNodes.filter(n => n.is_suspicious).length;

    const issues: string[] = [];
    const recommendations: string[] = [];

    if (missingNodes.length > 0) {
      issues.push(`缺失节点：${missingNodes.join('、')}`);
      recommendations.push('联系物流服务商补全缺失的轨迹节点');
    }

    if (duplicateNodes > 0) {
      issues.push(`存在${duplicateNodes}个重复节点`);
      recommendations.push('核实并删除重复的轨迹记录');
    }

    if (fakeNodes > 0) {
      issues.push(`检测到${fakeNodes}个虚假节点`);
      recommendations.push('严肃处理虚假物流轨迹，追究服务商责任');
    }

    if (suspiciousNodes > 0) {
      issues.push(`存在${suspiciousNodes}个存疑节点`);
      recommendations.push('人工核实存疑节点的真实性');
    }

    const hasAbnormal = trackNodes.some(n => n.is_abnormal);
    if (hasAbnormal) {
      issues.push('链路中存在异常记录');
      recommendations.push('及时处理链路中的异常问题');
    }

    let integrityScore = 100;
    integrityScore -= missingNodes.length * 15;
    integrityScore -= duplicateNodes * 10;
    integrityScore -= fakeNodes * 25;
    integrityScore -= suspiciousNodes * 5;
    integrityScore = Math.max(0, integrityScore);

    return {
      total_nodes: trackNodes.length,
      expected_nodes: 4,
      missing_nodes: missingNodes,
      duplicate_nodes: duplicateNodes,
      fake_nodes: fakeNodes,
      suspicious_nodes: suspiciousNodes,
      integrity_score: integrityScore,
      is_complete: missingNodes.length === 0 && fakeNodes === 0,
      issues: issues,
      recommendations: recommendations,
    };
  }

  async verifyNode(
    nodeExtensionId: number,
    verificationStatus: number,
    verificationRemark: string,
    operatorId: number,
    operatorName: string
  ): Promise<void> {
    const extension = await logisticsLinkNodeExtensionDao.findById(nodeExtensionId);
    if (!extension) {
      throw new Error('节点扩展记录不存在');
    }

    await logisticsLinkNodeExtensionDao.update(nodeExtensionId, {
      verification_status: verificationStatus,
      verification_remark: verificationRemark,
      verified_by: operatorId,
      verified_by_name: operatorName,
      verified_at: new Date(),
    });
  }

  async addNodeExtension(
    trackId: number,
    extensionData: Partial<LogisticsLinkNodeExtension>,
    operatorId: number,
    operatorName: string
  ): Promise<LogisticsLinkNodeExtension> {
    const track = await logisticsTrackDao.findById(trackId);
    if (!track) {
      throw new Error('轨迹记录不存在');
    }

    const existing = await logisticsLinkNodeExtensionDao.findByCondition({ track_id: trackId });

    if (existing.length > 0) {
      return await logisticsLinkNodeExtensionDao.update(existing[0].id, {
        ...extensionData,
        verified_by: operatorId,
        verified_by_name: operatorName,
        verified_at: new Date(),
      });
    } else {
      const shipment = await shipmentRecordDao.findById(track.shipment_id);
      const nodeHash = this.generateNodeHash(track, shipment);

      return await logisticsLinkNodeExtensionDao.create({
        track_id: trackId,
        shipment_id: track.shipment_id,
        logistics_no: track.logistics_no,
        node_hash: nodeHash,
        node_time: new Date(track.track_time || track.created_at),
        ...extensionData,
        verification_status: LinkNodeVerificationStatus.VERIFIED,
        verified_by: operatorId,
        verified_by_name: operatorName,
        verified_at: new Date(),
        is_backfilled: true,
        source: 'manual',
      });
    }
  }
}

export default new LogisticsLinkTraceService();
