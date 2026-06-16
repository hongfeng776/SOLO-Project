const BaseController = require('./BaseController');
const merchantService = require('../services/MerchantService');

class MerchantController extends BaseController {
  constructor() {
    super(merchantService);
  }
}

module.exports = new MerchantController();
