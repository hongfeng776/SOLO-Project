const BaseController = require('./BaseController');
const ticketInventoryService = require('../services/TicketInventoryService');
const { success, pagination } = require('../utils/result');

class TicketInventoryController extends BaseController {
  constructor() {
    super(ticketInventoryService);
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
      res.json(success(result, result.blocked ? '库存配置已拦截，请检查错误信息' : '库存创建成功', 201));
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
      res.json(success(result, result.blocked ? '库存调整已拦截，请检查错误信息' : '库存更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      if (!req.user?.roles?.includes('admin')) {
        return res.status(403).json({ code: 403, message: '仅管理员可删除库存记录' });
      }
      const { id } = req.params;
      await this.service.update(id, { status: 'expired' }, {
        id: req.user?.id, name: req.user?.username, roles: req.user?.roles,
        ip: req.ip, ua: req.headers['user-agent']
      });
      res.json(success(null, '库存记录已标记为过期'));
    } catch (error) {
      next(error);
    }
  }

  async setStatus(req, res, next) {
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
      const result = await this.service.setStatus(id, status, reason, operator);
      res.json(success(result, '状态更新成功'));
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

  async verifyInventory(req, res, next) {
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
      const result = await this.service.verifyInventory(id, verifyType, reason, operator);
      res.json(success(result, '审核完成'));
    } catch (error) {
      next(error);
    }
  }

  async checkExpired(req, res, next) {
    try {
      const result = await this.service.checkExpired();
      res.json(success(result, `已处理 ${result.updatedCount} 条过期场次`));
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

module.exports = new TicketInventoryController();
