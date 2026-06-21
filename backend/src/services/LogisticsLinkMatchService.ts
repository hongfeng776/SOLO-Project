import { daos } from '../dao';
import { LogisticsProvider, CooperationStatus, LogisticsProviderStatus } from '../models/LogisticsProvider';
import { LogisticsLinkMatchRecord, LinkMatchStatus, MatchStepStatus } from '../models/LogisticsLinkMatchRecord';
import { Op } from 'sequelize';

interface MatchStep {
  step: string;
  name: string;
  status: MatchStepStatus;
  progress: number;
  message: string;
  started_at?: Date;
  completed_at?: Date;
  data?: any;
}

interface AddressInfo {
  province: string;
  city: string;
  district: string;
  address: string;
  longitude?: number;
  latitude?: number;
  is_remote?: boolean;
}

interface ProductInfo {
  product_id: number;
  product_name: string;
  category_id: number;
  category_name: string;
  weight: number;
  volume: number;
  is_forbidden?: boolean;
  forbidden_reason?: string;
}

interface TimelinessRequirement {
  required_delivery_days: number;
  latest_delivery_time?: Date;
  is_urgent: boolean;
}

interface MatchResult {
  success: boolean;
  status: number;
  block_reason?: string;
  matched_providers: Array<{
    provider_id: number;
    provider_name: string;
    provider_code: string;
    score: number;
    estimated_days: number;
    cost: number;
    coverage_area: string;
  }>;
  alternative_solutions?: Array<{
    type: string;
    title: string;
    description: string;
    extra_cost?: number;
    extra_days?: number;
  }>;
}

const {
  logisticsLinkMatchRecordDao,
  logisticsProviderDao,
  logisticsBranchNetworkDao,
  logisticsFeeStandardDao,
  orderDao,
  orderItemDao,
  goodsDao,
} = daos;

export class LogisticsLinkMatchService {
  async runLinkMatch(
    orderId: number,
    userId?: number,
    userName?: string
  ): Promise<{ match_no: string; status: number; steps: MatchStep[] }> {
    const startTime = Date.now();
    const order = await orderDao.findById(orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    const steps: MatchStep[] = [
      { step: 'address', name: '地址校验', status: MatchStepStatus.PENDING, progress: 0, message: '准备校验收货地址...' },
      { step: 'product', name: '商品校验', status: MatchStepStatus.PENDING, progress: 0, message: '准备校验商品类型...' },
      { step: 'provider', name: '服务商匹配', status: MatchStepStatus.PENDING, progress: 0, message: '准备匹配物流服务商...' },
      { step: 'timeliness', name: '时效校验', status: MatchStepStatus.PENDING, progress: 0, message: '准备校验配送时效...' },
      { step: 'result', name: '结果生成', status: MatchStepStatus.PENDING, progress: 0, message: '生成匹配结果...' },
    ];

    const matchNo = `LM${Date.now()}${Math.floor(Math.random() * 10000)}`;

    const matchRecord = await logisticsLinkMatchRecordDao.create({
      match_no: matchNo,
      order_id: orderId,
      order_no: order.order_no,
      status: LinkMatchStatus.PENDING,
      created_by: userId,
      created_by_name: userName,
    });

    let finalStatus = LinkMatchStatus.MATCHED;
    let blockReason = '';

    try {
      steps[0].status = MatchStepStatus.RUNNING;
      steps[0].progress = 30;
      steps[0].started_at = new Date();
      steps[0].message = '正在校验地址是否在配送范围内...';

      const addressInfo = await this.validateAddress(order, steps[0]);

      if (addressInfo.is_remote) {
        finalStatus = LinkMatchStatus.ADDRESS_REMOTE;
        blockReason = '收货地址属于偏远地区，常规配送无法覆盖';
      }

      steps[0].status = MatchStepStatus.COMPLETED;
      steps[0].progress = 100;
      steps[0].completed_at = new Date();
      steps[0].message = '地址校验完成';
      steps[0].data = addressInfo;

      steps[1].status = MatchStepStatus.RUNNING;
      steps[1].progress = 30;
      steps[1].started_at = new Date();
      steps[1].message = '正在校验商品是否支持运输...';

      const productInfo = await this.validateProducts(orderId, steps[1]);

      if (productInfo.some(p => p.is_forbidden)) {
        finalStatus = LinkMatchStatus.PRODUCT_FORBIDDEN;
        const forbiddenProducts = productInfo.filter(p => p.is_forbidden).map(p => p.product_name).join('、');
        blockReason = `以下商品为禁运品：${forbiddenProducts}`;
      }

      steps[1].status = MatchStepStatus.COMPLETED;
      steps[1].progress = 100;
      steps[1].completed_at = new Date();
      steps[1].message = '商品校验完成';
      steps[1].data = productInfo;

      steps[2].status = MatchStepStatus.RUNNING;
      steps[2].progress = 30;
      steps[2].started_at = new Date();
      steps[2].message = '正在匹配可用的物流服务商...';

      const matchedProviders = await this.matchProviders(addressInfo, productInfo, steps[2]);

      if (matchedProviders.length === 0) {
        finalStatus = LinkMatchStatus.NO_PROVIDER;
        blockReason = '当前无可用的物流服务商支持此配送';
      }

      steps[2].status = MatchStepStatus.COMPLETED;
      steps[2].progress = 100;
      steps[2].completed_at = new Date();
      steps[2].message = `成功匹配${matchedProviders.length}家服务商`;
      steps[2].data = matchedProviders;

      steps[3].status = MatchStepStatus.RUNNING;
      steps[3].progress = 30;
      steps[3].started_at = new Date();
      steps[3].message = '正在校验配送时效是否满足要求...';

      const timelinessResult = await this.validateTimeliness(addressInfo, matchedProviders, steps[3]);

      if (!timelinessResult.is_met && matchedProviders.length > 0) {
        finalStatus = LinkMatchStatus.TIMEOUT_UNMET;
        blockReason = '所有匹配服务商的配送时效均不满足要求';
      }

      steps[3].status = MatchStepStatus.COMPLETED;
      steps[3].progress = 100;
      steps[3].completed_at = new Date();
      steps[3].message = '时效校验完成';
      steps[3].data = timelinessResult;

      steps[4].status = MatchStepStatus.RUNNING;
      steps[4].progress = 50;
      steps[4].started_at = new Date();
      steps[4].message = '正在生成匹配结果和备选方案...';

      const alternativeSolutions = await this.generateAlternativeSolutions(
        finalStatus,
        addressInfo,
        productInfo,
        matchedProviders
      );

      steps[4].status = MatchStepStatus.COMPLETED;
      steps[4].progress = 100;
      steps[4].completed_at = new Date();
      steps[4].message = '匹配结果生成完成';
      steps[4].data = alternativeSolutions;

      const costTime = Date.now() - startTime;

      await logisticsLinkMatchRecordDao.update(matchRecord.id, {
        status: finalStatus,
        block_reason: blockReason,
        match_steps: JSON.stringify(steps),
        address_info: addressInfo,
        product_info: productInfo,
        timeliness_requirement: timelinessResult,
        matched_providers: matchedProviders,
        alternative_solutions: alternativeSolutions,
        cost_time_ms: costTime,
      });

      return {
        match_no: matchNo,
        status: finalStatus,
        steps,
      };
    } catch (error: any) {
      const failedStep = steps.find(s => s.status === MatchStepStatus.RUNNING);
      if (failedStep) {
        failedStep.status = MatchStepStatus.FAILED;
        failedStep.message = error.message;
        failedStep.completed_at = new Date();
      }

      await logisticsLinkMatchRecordDao.update(matchRecord.id, {
        status: LinkMatchStatus.NO_PROVIDER,
        block_reason: error.message,
        match_steps: JSON.stringify(steps),
        cost_time_ms: Date.now() - startTime,
      });

      throw error;
    }
  }

  private async validateAddress(order: any, step: MatchStep): Promise<AddressInfo> {
    step.progress = 50;
    step.message = '正在解析地址信息...';

    const addressInfo: AddressInfo = {
      province: order.receiver_province || '',
      city: order.receiver_city || '',
      district: order.receiver_district || '',
      address: order.receiver_address || '',
      longitude: order.receiver_longitude,
      latitude: order.receiver_latitude,
    };

    await new Promise(resolve => setTimeout(resolve, 200));
    step.progress = 75;
    step.message = '正在判断是否为偏远地区...';

    const remoteKeywords = ['偏远', '山区', '牧区', '海岛', '边境', '自治旗', '自治州'];
    const fullAddress = `${addressInfo.province}${addressInfo.city}${addressInfo.district}${addressInfo.address}`;
    addressInfo.is_remote = remoteKeywords.some(keyword => fullAddress.includes(keyword));

    await new Promise(resolve => setTimeout(resolve, 200));
    return addressInfo;
  }

  private async validateProducts(orderId: number, step: MatchStep): Promise<ProductInfo[]> {
    step.progress = 40;
    step.message = '正在获取订单商品列表...';

    const orderItems = await orderItemDao.findByCondition({ order_id: orderId });
    const productIds = orderItems.map(item => item.goods_id);
    const goodsList = await goodsDao.findByIds(productIds);

    await new Promise(resolve => setTimeout(resolve, 200));
    step.progress = 70;
    step.message = '正在校验商品禁运属性...';

    const forbiddenCategories = ['烟花爆竹', '管制刀具', '易燃易爆', '有毒有害', '放射性'];

    const productInfo: ProductInfo[] = await Promise.all(
      orderItems.map(async item => {
        const goods = goodsList.find(g => g.id === item.goods_id);
        const isForbidden = forbiddenCategories.some(cat =>
          (goods?.category_name || '').includes(cat) || (goods?.name || '').includes(cat)
        );

        await new Promise(resolve => setTimeout(resolve, 50));

        return {
          product_id: item.goods_id,
          product_name: goods?.name || item.goods_name || '未知商品',
          category_id: goods?.category_id || 0,
          category_name: goods?.category_name || '未知分类',
          weight: goods?.weight || item.goods_weight || 0,
          volume: goods?.volume || 0,
          is_forbidden: isForbidden,
          forbidden_reason: isForbidden ? '商品属于禁运品类' : undefined,
        };
      })
    );

    await new Promise(resolve => setTimeout(resolve, 100));
    return productInfo;
  }

  private async matchProviders(
    addressInfo: AddressInfo,
    productInfo: ProductInfo[],
    step: MatchStep
  ): Promise<MatchResult['matched_providers']> {
    step.progress = 40;
    step.message = '正在筛选可用服务商...';

    const totalWeight = productInfo.reduce((sum, p) => sum + p.weight, 0);
    const totalVolume = productInfo.reduce((sum, p) => sum + p.volume, 0);

    const providers = await logisticsProviderDao.findByCondition({
      status: LogisticsProviderStatus.ENABLED,
      cooperation_status: CooperationStatus.COOPERATING,
    });

    await new Promise(resolve => setTimeout(resolve, 200));
    step.progress = 70;
    step.message = '正在校验服务商配送范围...';

    const matched: MatchResult['matched_providers'] = [];

    for (const provider of providers) {
      const branchNetworks = await logisticsBranchNetworkDao.findByCondition({
        provider_id: provider.id,
        city: { [Op.like]: `%${addressInfo.city}%` },
        status: 1,
      });

      if (branchNetworks.length === 0 && !addressInfo.is_remote) {
        continue;
      }

      const feeStandards = await logisticsFeeStandardDao.findByCondition({
        provider_id: provider.id,
        is_active: 1,
      });

      let estimatedCost = 0;
      if (feeStandards.length > 0) {
        const firstWeightFee = feeStandards[0].first_weight_fee || 10;
        const continueWeightFee = feeStandards[0].continue_weight_fee || 3;
        estimatedCost = firstWeightFee + Math.max(0, totalWeight - 1) * continueWeightFee;
      }

      const baseScore = provider.service_score || 80;
      const coverageBonus = branchNetworks.length > 0 ? 10 : 0;
      const costPenalty = estimatedCost > 50 ? -5 : 0;
      const finalScore = Math.min(100, Math.max(0, baseScore + coverageBonus + costPenalty));

      if (finalScore >= 60 || addressInfo.is_remote) {
        matched.push({
          provider_id: provider.id,
          provider_name: provider.company_name,
          provider_code: provider.provider_code,
          score: finalScore,
          estimated_days: provider.standard_delivery_days || 3,
          cost: estimatedCost,
          coverage_area: branchNetworks.length > 0 ? addressInfo.city : '特殊配送',
        });
      }

      await new Promise(resolve => setTimeout(resolve, 30));
    }

    matched.sort((a, b) => b.score - a.score);

    await new Promise(resolve => setTimeout(resolve, 100));
    return matched;
  }

  private async validateTimeliness(
    addressInfo: AddressInfo,
    providers: MatchResult['matched_providers'],
    step: MatchStep
  ): Promise<{ is_met: boolean; requirement: TimelinessRequirement; details: any[] }> {
    step.progress = 50;
    step.message = '正在校验时效要求...';

    const requirement: TimelinessRequirement = {
      required_delivery_days: 3,
      is_urgent: false,
    };

    await new Promise(resolve => setTimeout(resolve, 200));
    step.progress = 80;
    step.message = '正在比对服务商承诺时效...';

    const remoteAddressBonus = addressInfo.is_remote ? 2 : 0;

    const details = providers.map(provider => {
      const adjustedDays = provider.estimated_days + remoteAddressBonus;
      return {
        ...provider,
        adjusted_days: adjustedDays,
        is_met: adjustedDays <= requirement.required_delivery_days,
      };
    });

    const isMet = details.some(d => d.is_met);

    await new Promise(resolve => setTimeout(resolve, 100));
    return { is_met, requirement, details };
  }

  private async generateAlternativeSolutions(
    status: LinkMatchStatus,
    addressInfo: AddressInfo,
    productInfo: ProductInfo[],
    providers: MatchResult['matched_providers']
  ): Promise<MatchResult['alternative_solutions']> {
    const solutions: MatchResult['alternative_solutions'] = [];

    if (status === LinkMatchStatus.ADDRESS_REMOTE) {
      solutions.push({
        type: 'premium_delivery',
        title: '升级为偏远地区配送',
        description: '选择支持偏远地区配送的服务商，需额外支付偏远地区配送费',
        extra_cost: 20,
        extra_days: 2,
      });
      solutions.push({
        type: 'self_pickup',
        title: '改为网点自提',
        description: '选择最近的物流网点自提，无需额外费用',
        extra_cost: 0,
        extra_days: 0,
      });
      solutions.push({
        type: 'address_change',
        title: '修改收货地址',
        description: '修改为非偏远地区的收货地址，恢复标准配送',
      });
    }

    if (status === LinkMatchStatus.PRODUCT_FORBIDDEN) {
      solutions.push({
        type: 'special_carrier',
        title: '使用特种物流服务商',
        description: '选择具备特殊商品运输资质的服务商',
        extra_cost: 50,
        extra_days: 3,
      });
      solutions.push({
        type: 'product_split',
        title: '拆分订单',
        description: '将禁运商品从订单中拆分，单独处理或取消',
      });
    }

    if (status === LinkMatchStatus.NO_PROVIDER) {
      solutions.push({
        type: 'delay_delivery',
        title: '延后配送',
        description: '等待服务商运力恢复后再进行配送',
        extra_days: 2,
      });
      solutions.push({
        type: 'multi_provider',
        title: '多服务商组合配送',
        description: '使用多家服务商分段配送',
        extra_cost: 30,
        extra_days: 1,
      });
    }

    if (status === LinkMatchStatus.TIMEOUT_UNMET) {
      solutions.push({
        type: 'express_upgrade',
        title: '升级为加急配送',
        description: '选择时效更快的加急配送服务',
        extra_cost: 40,
        extra_days: -1,
      });
      solutions.push({
        type: 'negotiate_delivery',
        title: '与客户协商延长时效',
        description: '联系客户沟通是否可以接受稍长的配送时间',
      });
    }

    if (status === LinkMatchStatus.MATCHED && providers.length > 0) {
      solutions.push({
        type: 'recommended_provider',
        title: `推荐选择：${providers[0].provider_name}`,
        description: `综合评分最高：${providers[0].score}分，预计${providers[0].estimated_days}天送达，费用¥${providers[0].cost.toFixed(2)}`,
      });
    }

    return solutions;
  }

  async getMatchProgress(matchNo: string): Promise<{ steps: MatchStep[]; status: number }> {
    const record = await logisticsLinkMatchRecordDao.findByCondition({ match_no: matchNo });
    if (!record || record.length === 0) {
      throw new Error('匹配记录不存在');
    }

    const matchRecord = record[0];
    const steps = matchRecord.match_steps ? JSON.parse(matchRecord.match_steps) : [];

    return {
      steps,
      status: matchRecord.status,
    };
  }

  async getMatchResult(matchNo: string): Promise<any> {
    const record = await logisticsLinkMatchRecordDao.findByCondition({ match_no: matchNo });
    if (!record || record.length === 0) {
      throw new Error('匹配记录不存在');
    }
    return record[0];
  }

  async selectProvider(matchNo: string, providerId: number, userId?: number, userName?: string): Promise<void> {
    const records = await logisticsLinkMatchRecordDao.findByCondition({ match_no: matchNo });
    if (!records || records.length === 0) {
      throw new Error('匹配记录不存在');
    }

    const matchRecord = records[0];
    const providers = matchRecord.matched_providers || [];
    const selectedProvider = providers.find((p: any) => p.provider_id === providerId);

    if (!selectedProvider) {
      throw new Error('选择的服务商不在匹配列表中');
    }

    await logisticsLinkMatchRecordDao.update(matchRecord.id, {
      selected_provider_id: providerId,
      selected_provider_name: selectedProvider.provider_name,
    });
  }
}

export default new LogisticsLinkMatchService();
