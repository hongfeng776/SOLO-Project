const BaseService = require('./BaseService');
const Flight = require('../models/Flight');

class FlightService extends BaseService {
  constructor() {
    super(Flight);
  }

  async getList(params = {}) {
    return super.getList(params, {
      searchFields: ['flightNo', 'airline', 'departure', 'arrival']
    });
  }
}

module.exports = new FlightService();
