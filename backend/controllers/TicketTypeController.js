const BaseController = require('./BaseController');
const ticketTypeService = require('../services/TicketTypeService');
const { success, pagination } = require('../utils/result');

class TicketTypeController extends BaseController {
  constructor() {
    super(ticketTypeService);
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

  async get(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.service.getById(id);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const operator = {
        id: req.user?.id,
        name: req.user?.username || req.user?.name,
        roles: req.user?.roles || [],
        ip: req.ip,
        ua: req.headers['user-agent']
      };
      const result = await this.service.create(req.body, operator);
      res.json(success(result, '票种创建成功', 201));
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const operator = {
        id: req.user?.id,
        name: req.user?.username || req.user?.name,
        roles: req.user?.roles || [],
        ip: req.ip,
        ua: req.headers['user-agent']
      };
      const result = await this.service.update(id, req.body, operator);
      res.json(success(result, '票种规则更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const { id } = req.params;
      const operator = {
        id: req.user?.id,
        name: req.user?.username || req.user?.name,
        roles: req.user?.roles || []
      };
      if (!this.service.checkPermission(req.user?.roles, ['admin'])) {
        return res.status(403).json({ code: 403, message: '仅管理员可删除票种，建议使用下架/停用' });
      }
      await this.service.setEnabled(id, 0, '已删除-停用', operator);
      res.json(success(null, '已停用票种配置（保留历史数据）'));
    } catch (error) {
      next(error);
    }
  }

  async changeStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const operator = {
        id: req.user?.id,
        name: req.user?.username || req.user?.name,
        roles: req.user?.roles || [],
        ip: req.ip,
        ua: req.headers['user-agent']
      };
      const result = await this.service.changeStatus(id, status, reason, operator);
      res.json(success(result, '上下架成功'));
    } catch (error) {
      next(error);
    }
  }

  async setEnabled(req, res, next) {
    try {
      const { id } = req.params;
      const { enabled, reason } = req.body;
      const operator = {
        id: req.user?.id,
        name: req.user?.username || req.user?.name,
        roles: req.user?.roles || [],
        ip: req.ip,
        ua: req.headers['user-agent']
      };
      const result = await this.service.setEnabled(id, enabled, reason, operator);
      res.json(success(result, '启用状态变更成功'));
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
      res.json(success(result, '批量操作执行完成'));
    } catch (error) {
      next(error);
    }
  }

  async verifyTicket(req, res, next) {
    try {
      const { id } = req.params;
      const { verifyType, reason } = req.body;
      const operator = {
        id: req.user?.id,
        name: req.user?.username || req.user?.name,
        roles: req.user?.roles || [],
        ip: req.ip,
        ua: req.headers['user-agent']
      };
      const result = await this.service.verifyTicket(id, verifyType, reason, operator);
      res.json(success(result, '审核完成'));
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
      const user = {
        id: req.user?.id,
        roles: req.user?.roles || []
      };
      const result = await this.service.checkPermissionEndpoint(type, user);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TicketTypeController();
