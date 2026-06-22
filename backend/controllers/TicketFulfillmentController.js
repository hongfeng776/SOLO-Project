const BaseController = require('./BaseController');
const ticketFulfillmentService = require('../services/TicketFulfillmentService');
const { success, pagination } = require('../utils/result');

class TicketFulfillmentController extends BaseController {
  constructor() {
    super(ticketFulfillmentService);
  }

  async list(req, res, next) {
    try {
      const { page, pageSize } = req.pagination;
      const result = await this.service.list({ ...req.query, page, pageSize });
      res.json(pagination(result.list, result.total, result.page, result.pageSize));
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const result = await this.service.getStats(req.query);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async get(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.service.getById(id);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async verifyTicket(req, res, next) {
    try {
      const { ticketCode, verifyData } = req.body;
      const operator = {
        id: req.user?.id,
        name: req.user?.username || req.user?.name,
        roles: req.user?.roles || [],
        ip: req.ip,
        ua: req.headers['user-agent'],
        device: req.body?.deviceId || req.headers['x-device-id']
      };
      const result = await this.service.verifyTicket(ticketCode, verifyData || {}, operator);
      res.json(success(result, result.success ? '核销成功' : '核销失败'));
    } catch (error) {
      next(error);
    }
  }

  async batchOperation(req, res, next) {
    try {
      const operator = {
        id: req.user?.id,
        name: req.user?.username || req.user?.name,
        roles: req.user?.roles || [],
        ip: req.ip,
        ua: req.headers['user-agent']
      };
      const result = await this.service.batchOperation(req.body, operator);
      res.json(success(result, `批量操作完成：成功 ${result.success} 条，失败 ${result.failed} 条`));
    } catch (error) {
      next(error);
    }
  }

  async checkIntegrity(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.service.checkFulfillmentIntegrity(id);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async checkExpired(req, res, next) {
    try {
      const result = await this.service.checkExpired();
      res.json(success(result, `已处理 ${result.expiredCount} 条过期票`));
    } catch (error) {
      next(error);
    }
  }

  async getLogs(req, res, next) {
    try {
      const { id } = req.params;
      const { page, pageSize } = req.pagination;
      const result = await this.service.getLogs(id, { ...req.query, page, pageSize });
      res.json(pagination(result.list, result.total, result.page, result.pageSize));
    } catch (error) {
      next(error);
    }
  }

  async getAllLogs(req, res, next) {
    try {
      const { page, pageSize } = req.pagination;
      const result = await this.service.getAllLogs({ ...req.query, page, pageSize });
      res.json(pagination(result.list, result.total, result.page, result.pageSize));
    } catch (error) {
      next(error);
    }
  }

  async checkPermission(req, res, next) {
    try {
      const { type } = req.query;
      const user = req.user || { roles: [] };
      const result = this.service.checkPermissionEndpoint(type, user);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TicketFulfillmentController();
