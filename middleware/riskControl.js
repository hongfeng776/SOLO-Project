const Order = require('../models/Order');
const Merchant = require('../models/Merchant');
const Flight = require('../models/Flight');
const Hotel = require('../models/Hotel');
const Car = require('../models/Car');
const Ticket = require('../models/Ticket');
const { Op } = require('sequelize');
const { ValidationError } = require('../utils/error');

const checkOrderRisk = async (req, res, next) => {
  try {
    const { userId, category, productId, amount } = req.body;
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

    if (category && amount) {
      const avgResult = await Order.findAll({
        where: { category, status: { [Op.ne]: 2 } },
        attributes: [
          [Order.sequelize.fn('AVG', Order.sequelize.col('amount')), 'avgAmount']
        ],
        raw: true
      });
      const avgAmount = parseFloat(avgResult[0]?.avgAmount || 0);
      if (avgAmount > 0 && parseFloat(amount) > avgAmount * 3) {
        reasons.push('订单金额异常(超过品类平均金额3倍)');
        riskLevel = riskLevel === 'high' ? 'high' : 'medium';
      }
    }

    if (userId && productId && amount) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const duplicate = await Order.count({
        where: {
          userId,
          productId,
          amount,
          createdAt: { [Op.gte]: fiveMinutesAgo }
        }
      });
      if (duplicate > 0) {
        reasons.push('疑似重复下单(相同用户+商品+金额+5分钟内)');
        riskLevel = 'high';
      }
    }

    if (req.body.merchantId) {
      const merchant = await Merchant.findByPk(req.body.merchantId);
      if (merchant && merchant.violationLevel >= 3) {
        reasons.push('违规商家订单拦截(违规等级>=3)');
        riskLevel = 'high';
      }
    }

    req.riskResult = { riskLevel, reasons };

    if (riskLevel === 'high') {
      throw new ValidationError(`风控拦截: ${reasons.join('; ')}`, { riskLevel, reasons });
    }

    next();
  } catch (error) {
    next(error);
  }
};

const checkMerchantCompliance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const merchant = id ? await Merchant.findByPk(id) : null;
    if (merchant) {
      const reasons = [];
      if (!merchant.businessLicense) {
        reasons.push('营业执照必须上传');
      }
      if (!merchant.phone || !merchant.contact) {
        reasons.push('联系方式不完整');
      }
      if (merchant.violationLevel >= 3) {
        await merchant.update({ status: 0 });
        reasons.push('违规等级超限，已自动禁用');
      }
      if (reasons.length > 0 && req.body._complianceStrict) {
        throw new ValidationError(`商家合规校验失败: ${reasons.join('; ')}`);
      }
      req.complianceResult = { compliant: reasons.length === 0, reasons };
    }
    next();
  } catch (error) {
    next(error);
  }
};

const checkInventoryBeforeOrder = async (req, res, next) => {
  try {
    const { category, productId, quantity } = req.body;
    const qty = quantity || 1;

    switch (category) {
      case 'flight': {
        const flight = await Flight.findByPk(productId);
        if (!flight || flight.seats < qty) {
          throw new ValidationError('机票余座不足');
        }
        break;
      }
      case 'hotel': {
        const hotel = await Hotel.findByPk(productId);
        if (!hotel || hotel.rooms < qty) {
          throw new ValidationError('酒店房间不足');
        }
        break;
      }
      case 'car': {
        const car = await Car.findByPk(productId);
        if (!car || car.status !== 1) {
          throw new ValidationError('车辆不可用');
        }
        break;
      }
      case 'ticket': {
        const ticket = await Ticket.findByPk(productId);
        if (!ticket || ticket.stock < qty) {
          throw new ValidationError('票务库存不足');
        }
        break;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkOrderRisk,
  checkMerchantCompliance,
  checkInventoryBeforeOrder
};
