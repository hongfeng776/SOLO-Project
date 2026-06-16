const BaseService = require('./BaseService');
const Car = require('../models/Car');
const Merchant = require('../models/Merchant');

class CarService extends BaseService {
  constructor() {
    super(Car);
  }

  async getList(params = {}) {
    return super.getList(params, {
      searchFields: ['brand', 'model', 'plateNo'],
      include: [{ model: Merchant, as: 'merchant', attributes: ['id', 'name'] }]
    });
  }

  async getById(id) {
    return super.getById(id, {
      include: [{ model: Merchant, as: 'merchant', attributes: ['id', 'name'] }]
    });
  }
}

module.exports = new CarService();
