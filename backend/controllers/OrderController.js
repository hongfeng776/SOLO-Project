const BaseController = require('./BaseController');
const orderService = require('../services/OrderService');

class OrderController extends BaseController {
  constructor() {
    super(orderService);
  }
}

module.exports = new OrderController();
