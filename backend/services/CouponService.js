const BaseService = require('./BaseService');
const Coupon = require('../models/Coupon');
const { ValidationError } = require('../utils/error');

class CouponService extends BaseService {
  constructor() {
    super(Coupon);
  }

  async getList(params = {}) {
    return super.getList(params, {
      searchFields: ['name', 'code']
    });
  }

  async create(data) {
    if (!data.code) {
      data.code = 'CPN' + Date.now() + Math.random().toString(36).substring(2, 6).toUpperCase();
    }
    data.remainStock = data.totalStock;
    const now = new Date();
    if (data.startTime && new Date(data.startTime) <= now && new Date(data.endTime) > now) {
      data.status = 1;
    }
    return await super.create(data);
  }

  async issue(couponId, data = {}) {
    const coupon = await this.getById(couponId);
    if (coupon.status === 3) {
      throw new ValidationError('优惠券已作废，无法发放');
    }
    if (coupon.remainStock <= 0) {
      throw new ValidationError('优惠券库存不足');
    }
    const now = new Date();
    if (coupon.endTime && new Date(coupon.endTime) < now) {
      throw new ValidationError('优惠券已过期');
    }
    await coupon.update({
      usedStock: coupon.usedStock + 1,
      remainStock: coupon.remainStock - 1
    });
    return coupon;
  }

  async batchIssue(couponId, count) {
    const coupon = await this.getById(couponId);
    if (coupon.status === 3) {
      throw new ValidationError('优惠券已作废，无法发放');
    }
    if (coupon.remainStock < count) {
      throw new ValidationError('优惠券库存不足');
    }
    await coupon.update({
      usedStock: coupon.usedStock + count,
      remainStock: coupon.remainStock - count
    });
    return coupon;
  }

  async revoke(couponId) {
    const coupon = await this.getById(couponId);
    return await coupon.update({ status: 3 });
  }

  async updateExpiredCoupons() {
    const now = new Date();
    await Coupon.update(
      { status: 2 },
      {
        where: {
          status: 1,
          endTime: { [require('sequelize').Op.lt]: now }
        }
      }
    );
    await Coupon.update(
      { status: 1 },
      {
        where: {
          status: 0,
          startTime: { [require('sequelize').Op.lte]: now },
          endTime: { [require('sequelize').Op.gt]: now }
        }
      }
    );
  }
}

module.exports = new CouponService();
