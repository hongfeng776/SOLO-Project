const BaseController = require('./BaseController');
const ticketService = require('../services/TicketService');

class TicketController extends BaseController {
  constructor() {
    super(ticketService);
  }
}

module.exports = new TicketController();
