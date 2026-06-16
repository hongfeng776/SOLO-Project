const BaseController = require('./BaseController');
const businessTravelService = require('../services/BusinessTravelService');
const { success } = require('../utils/result');

class BusinessTravelController extends BaseController {
  constructor() {
    super(businessTravelService);
  }

  async confirm(req, res, next) {
    try {
      const { id } = req.params;
      const result = await businessTravelService.confirm(id);
      res.json(success(result, '确认成功'));
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const { id } = req.params;
      const result = await businessTravelService.cancel(id);
      res.json(success(result, '取消成功'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BusinessTravelController();
