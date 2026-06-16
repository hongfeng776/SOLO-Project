const Order = require('../models/Order');
const Merchant = require('../models/Merchant');
const { Op } = require('sequelize');

class RiskControlService {
  async detectAbnormalOrder(userId, orderData) {
    const reasons = [];
    let riskLevel = 'low';

    if (userId) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentCount = await Order.count({
        where: {
          userId,
          createdAt: { [Op.gte]: fiveMinutesAgo }
        }
      });
      if (recentCount >= 3) {
        reasons.push('同一用户短时间内高频下单(5分钟内超过3单)');
        riskLevel = 'high';
      }
    }

    if (orderData.category && orderData.amount) {
      const avgResult = await Order.findAll({
        where: { category: orderData.category, status: { [Op.ne]: 2 } },
        attributes: [
          [Order.sequelize.fn('AVG', Order.sequelize.col('amount')), 'avgAmount']
        ],
        raw: true
      });
      const avgAmount = parseFloat(avgResult[0]?.avgAmount || 0);
      if (avgAmount > 0 && parseFloat(orderData.amount) > avgAmount * 3) {
        reasons.push('订单金额异常(超过品类平均金额3倍)');
        riskLevel = riskLevel === 'high' ? 'high' : 'medium';
      }
    }

    if (userId && orderData.productId && orderData.amount) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const duplicate = await Order.count({
        where: {
          userId,
          productId: orderData.productId,
          amount: orderData.amount,
          createdAt: { [Op.gte]: fiveMinutesAgo }
        }
      });
      if (duplicate > 0) {
        reasons.push('疑似重复下单(相同用户+商品+金额+5分钟内)');
        riskLevel = 'high';
      }
    }

    if (orderData.merchantId) {
      const merchant = await Merchant.findByPk(orderData.merchantId);
      if (merchant && merchant.violationLevel >= 3) {
        reasons.push('违规商家订单拦截(违规等级>=3)');
        riskLevel = 'high';
      }
    }

    return { riskLevel, reasons };
  }

  async getMerchantRiskLevel(merchantId) {
    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) return { riskLevel: 'low', violationLevel: 0 };
    const levelMap = { 0: 'low', 1: 'low', 2: 'medium', 3: 'high' };
    return {
      riskLevel: levelMap[merchant.violationLevel] || 'low',
      violationLevel: merchant.violationLevel,
      violationCount: merchant.violationCount,
      lastViolationTime: merchant.lastViolationTime
    };
  }

  async recordViolation(merchantId, type, description) {
    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) return null;
    const newCount = merchant.violationCount + 1;
    const updateData = {
      violationCount: newCount,
      lastViolationTime: new Date()
    };
    if (newCount >= 10) {
      updateData.violationLevel = 3;
    } else if (newCount >= 5) {
      updateData.violationLevel = 2;
    } else if (newCount >= 2) {
      updateData.violationLevel = 1;
    }
    await merchant.update(updateData);
    if (updateData.violationLevel >= 3) {
      await this.autoBanMerchant(merchantId);
    }
    return merchant;
  }

  async autoBanMerchant(merchantId) {
    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) return null;
    return await merchant.update({ status: 0 });
  }

  checkCouponCompliance(couponData) {
    const reasons = [];
    if (!couponData.name) reasons.push('优惠券名称不能为空');
    if (!couponData.type) reasons.push('优惠券类型不能为空');
    if (!couponData.category) reasons.push('适用品类不能为空');
    if (!couponData.amount || couponData.amount <= 0) reasons.push('面额必须大于0');
    if (couponData.totalStock !== undefined && couponData.totalStock < 0) reasons.push('库存不能为负');
    if (couponData.startTime && couponData.endTime) {
      if (new Date(couponData.startTime) >= new Date(couponData.endTime)) {
        reasons.push('有效期开始必须早于结束');
      }
    }
    if (couponData.type === 2 && (couponData.amount <= 0 || couponData.amount >= 1)) {
      reasons.push('折扣类型面额必须在0-1之间');
    }
    return {
      compliant: reasons.length === 0,
      reasons
    };
  }

  async checkOrderStatusPermission(orderId, action) {
    const order = await Order.findByPk(orderId);
    if (!order) return { allowed: false, reason: '订单不存在' };

    const actionStatusMap = {
      pay: [0],
      cancel: [0, 1],
      refund: [1, 3, 4],
      complete: [1, 4]
    };

    const allowedStatuses = actionStatusMap[action];
    if (!allowedStatuses) return { allowed: false, reason: '不支持的操作' };
    if (!allowedStatuses.includes(order.status)) {
      return { allowed: false, reason: `当前订单状态不允许${action}操作` };
    }
    return { allowed: true, reason: '' };
  }
}

module.exports = new RiskControlService();
