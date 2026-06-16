const BaseService = require('./BaseService');
const Ticket = require('../models/Ticket');
const Merchant = require('../models/Merchant');

class TicketService extends BaseService {
  constructor() {
    super(Ticket);
  }

  async getList(params = {}) {
    return super.getList(params, {
      searchFields: ['name', 'scenicSpot'],
      include: [{ model: Merchant, as: 'merchant', attributes: ['id', 'name'] }]
    });
  }

  async getById(id) {
    return super.getById(id, {
      include: [{ model: Merchant, as: 'merchant', attributes: ['id', 'name'] }]
    });
  }
}

module.exports = new TicketService();
