const BaseService = require('./BaseService');
const OrderLog = require('../models/OrderLog');

class OrderLogService extends BaseService {
  constructor() {
    super(OrderLog);
  }

  async createLog(data) {
    return await OrderLog.create(data);
  }

  async getByOrderId(orderId) {
    return await OrderLog.findAll({
      where: { orderId },
      order: [['createdAt', 'ASC']]
    });
  }
}

module.exports = new OrderLogService();
