const BaseController = require('./BaseController');
const orderLogService = require('../services/OrderLogService');
const { success } = require('../utils/result');

class OrderLogController extends BaseController {
  constructor() {
    super(orderLogService);
  }

  async getByOrderId(req, res, next) {
    try {
      const { orderId } = req.params;
      const result = await orderLogService.getByOrderId(orderId);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderLogController();
