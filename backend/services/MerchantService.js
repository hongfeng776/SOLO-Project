const BaseService = require('./BaseService');
const Merchant = require('../models/Merchant');

class MerchantService extends BaseService {
  constructor() {
    super(Merchant);
  }

  async getList(params = {}) {
    return super.getList(params, {
      searchFields: ['name', 'contact', 'phone', 'address', 'email']
    });
  }
}

module.exports = new MerchantService();
