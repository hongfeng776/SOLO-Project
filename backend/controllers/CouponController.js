const BaseController = require('./BaseController');
const couponService = require('../services/CouponService');
const { success } = require('../utils/result');

class CouponController extends BaseController {
  constructor() {
    super(couponService);
  }

  async issue(req, res, next) {
    try {
      const { id } = req.params;
      const result = await couponService.issue(id, req.body);
      res.json(success(result, '发放成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchIssue(req, res, next) {
    try {
      const { couponId, count } = req.body;
      const result = await couponService.batchIssue(couponId, count);
      res.json(success(result, '批量发放成功'));
    } catch (error) {
      next(error);
    }
  }

  async revoke(req, res, next) {
    try {
      const { id } = req.params;
      const result = await couponService.revoke(id);
      res.json(success(result, '作废成功'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CouponController();
