const BaseService = require('./BaseService');
const Order = require('../models/Order');
const User = require('../models/User');
const Merchant = require('../models/Merchant');

class OrderService extends BaseService {
  constructor() {
    super(Order);
  }

  async getList(params = {}) {
    return super.getList(params, {
      searchFields: ['orderNo', 'productName'],
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'nickname'] },
        { model: Merchant, as: 'merchant', attributes: ['id', 'name'] }
      ]
    });
  }

  async getById(id) {
    return super.getById(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'nickname'] },
        { model: Merchant, as: 'merchant', attributes: ['id', 'name'] }
      ]
    });
  }
}

module.exports = new OrderService();
