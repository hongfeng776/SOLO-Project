const BaseController = require('./BaseController');
const flightService = require('../services/FlightService');

class FlightController extends BaseController {
  constructor() {
    super(flightService);
  }
}

module.exports = new FlightController();
