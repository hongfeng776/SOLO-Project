const BaseController = require('./BaseController');
const carService = require('../services/CarService');

class CarController extends BaseController {
  constructor() {
    super(carService);
  }
}

module.exports = new CarController();
