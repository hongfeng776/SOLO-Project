const BaseService = require('./BaseService');
const Hotel = require('../models/Hotel');
const Merchant = require('../models/Merchant');

class HotelService extends BaseService {
  constructor() {
    super(Hotel);
  }

  async getList(params = {}) {
    return super.getList(params, {
      searchFields: ['name', 'address'],
      include: [{ model: Merchant, as: 'merchant', attributes: ['id', 'name'] }]
    });
  }

  async getById(id) {
    return super.getById(id, {
      include: [{ model: Merchant, as: 'merchant', attributes: ['id', 'name'] }]
    });
  }
}

module.exports = new HotelService();
