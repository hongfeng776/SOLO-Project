const BaseController = require('./BaseController');
const userService = require('../services/UserService');
const { success } = require('../utils/result');

class UserController extends BaseController {
  constructor() {
    super(userService);
  }

  async create(req, res, next) {
    try {
      const operator = req.user;
      const result = await this.service.create(req.body, operator);
      res.json(success(result, '创建成功', 201));
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const operator = req.user;
      const result = await this.service.update(id, req.body, operator);
      res.json(success(result, '更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async trace(req, res, next) {
    try {
      const result = await userService.traceUser(req.query);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async validateUniqueness(req, res, next) {
    try {
      const result = await userService.validateUniqueness(req.query);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const operator = req.user;
      const result = await userService.updateStatus(id, status, reason, operator);
      res.json(success(result, '状态更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchUpdateStatus(req, res, next) {
    try {
      const { ids, status, reason } = req.body;
      const operator = req.user;
      const result = await userService.batchUpdateStatus(ids, status, reason, operator);
      res.json(success(result, `批量操作完成：成功${result.success}个，失败${result.failed}个`));
    } catch (error) {
      next(error);
    }
  }

  async batchUpdateInfo(req, res, next) {
    try {
      const { ids, updateData } = req.body;
      const operator = req.user;
      const result = await userService.batchUpdateInfo(ids, updateData, operator);
      res.json(success(result, `批量更新完成：成功${result.success}个，失败${result.failed}个`));
    } catch (error) {
      next(error);
    }
  }

  async batchFreeze(req, res, next) {
    try {
      const { ids, reason } = req.body;
      const operator = req.user;
      const result = await userService.batchFreeze(ids, reason, operator);
      res.json(success(result, `批量冻结完成：成功${result.success}个，失败${result.failed}个`));
    } catch (error) {
      next(error);
    }
  }

  async batchUnfreeze(req, res, next) {
    try {
      const { ids } = req.body;
      const operator = req.user;
      const result = await userService.batchUnfreeze(ids, operator);
      res.json(success(result, `批量解冻完成：成功${result.success}个，失败${result.failed}个`));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
