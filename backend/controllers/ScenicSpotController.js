const BaseController = require('./BaseController');
const scenicSpotService = require('../services/ScenicSpotService');
const { success, pagination } = require('../utils/result');

class ScenicSpotController extends BaseController {
  constructor() {
    super(scenicSpotService);
  }

  async list(req, res, next) {
    try {
      const { pageNum, pageSize } = req.pagination;
      const params = { ...req.query, pageNum, pageSize };
      const userRoles = req.user?.roles || [];
      const result = await this.service.getList(params, userRoles);
      res.json(pagination(result.list, result.total, result.pageNum, result.pageSize));
    } catch (error) {
      next(error);
    }
  }

  async get(req, res, next) {
    try {
      const { id } = req.params;
      const userRoles = req.user?.roles || [];
      const result = await this.service.getById(id, userRoles);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const operator = {
        id: req.user?.id,
        username: req.user?.username,
        roles: req.user?.roles || []
      };
      const result = await this.service.create(req.body, operator);
      res.json(success(result, '创建成功', 201));
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const operator = {
        id: req.user?.id,
        username: req.user?.username,
        roles: req.user?.roles || []
      };
      const result = await this.service.update(id, req.body, operator);
      res.json(success(result, '更新成功'));
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
        username: req.user?.username,
        roles: req.user?.roles || []
      };
      const result = await this.service.changeStatus(id, status, reason, operator);
      res.json(success(result, '状态变更成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchOperation(req, res, next) {
    try {
      const operator = {
        id: req.user?.id,
        username: req.user?.username,
        roles: req.user?.roles || []
      };
      const result = await this.service.batchOperation(req.body, operator);
      res.json(success(result, '批量操作完成'));
    } catch (error) {
      next(error);
    }
  }

  async getLogs(req, res, next) {
    try {
      const { id } = req.params;
      const { pageNum, pageSize } = req.pagination;
      const params = { ...req.query, pageNum, pageSize };
      const userRoles = req.user?.roles || [];
      const result = await this.service.getLogs(id, params, userRoles);
      res.json(pagination(result.list, result.total, result.page, result.pageSize));
    } catch (error) {
      next(error);
    }
  }

  async getAllLogs(req, res, next) {
    try {
      const { pageNum, pageSize } = req.pagination;
      const params = { ...req.query, pageNum, pageSize };
      const userRoles = req.user?.roles || [];
      const result = await this.service.getLogs(null, params, userRoles);
      res.json(pagination(result.list, result.total, result.page, result.pageSize));
    } catch (error) {
      next(error);
    }
  }

  async verifySpot(req, res, next) {
    try {
      const { id } = req.params;
      const { verifyType } = req.body;
      const operator = {
        id: req.user?.id,
        username: req.user?.username,
        roles: req.user?.roles || []
      };
      const result = await this.service.verifySpot(id, verifyType, operator);
      res.json(success(result, '审核完成'));
    } catch (error) {
      next(error);
    }
  }

  async checkPermission(req, res, next) {
    try {
      const { type } = req.query;
      const userRoles = req.user?.roles || [];
      const result = await this.service.checkPermissionForUser(userRoles, type);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ScenicSpotController();
