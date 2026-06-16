const BaseController = require('./BaseController');
const hotelService = require('../services/HotelService');

class HotelController extends BaseController {
  constructor() {
    super(hotelService);
  }
}

module.exports = new HotelController();
