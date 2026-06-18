const BaseController = require('./BaseController');
const permissionService = require('../services/PermissionService');
const { success } = require('../utils/result');

class PermissionController extends BaseController {
  constructor() {
    super(permissionService);
  }

  async getPermissionTree(req, res, next) {
    try {
      const tree = permissionService.getPermissionTree();
      res.json(success(tree));
    } catch (error) {
      next(error);
    }
  }

  async getTemplates(req, res, next) {
    try {
      const templates = permissionService.getTemplates();
      res.json(success(templates));
    } catch (error) {
      next(error);
    }
  }

  async getUserPermissions(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await permissionService.getUserPermissions(userId);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async savePermission(req, res, next) {
    try {
      const { userId } = req.params;
      const { permissionData } = req.body;
      const operator = req.user;
      const result = await permissionService.savePermission(userId, permissionData, operator);
      res.json(success(result, '权限配置保存成功'));
    } catch (error) {
      next(error);
    }
  }

  async validatePermissions(req, res, next) {
    try {
      const { userId, permissionMap } = req.body;
      const result = await permissionService.validatePermissions(userId, permissionMap);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async batchApplyTemplate(req, res, next) {
    try {
      const { userIds, templateKey, reason } = req.body;
      const operator = req.user;
      const result = await permissionService.batchApplyTemplate(userIds, templateKey, operator, reason);
      res.json(success(result, `批量配置完成：成功${result.success}个，失败${result.failed}个`));
    } catch (error) {
      next(error);
    }
  }

  async batchToggle(req, res, next) {
    try {
      const { userIds, permissionKeys, enable, reason } = req.body;
      const operator = req.user;
      const result = await permissionService.batchTogglePermissions(userIds, permissionKeys, enable, operator, reason);
      res.json(success(result, `批量操作完成：成功${result.success}个，失败${result.failed}个`));
    } catch (error) {
      next(error);
    }
  }

  async batchReset(req, res, next) {
    try {
      const { userIds, reason } = req.body;
      const operator = req.user;
      const result = await permissionService.batchResetPermissions(userIds, operator, reason);
      res.json(success(result, `批量重置完成：成功${result.success}个，失败${result.failed}个`));
    } catch (error) {
      next(error);
    }
  }

  async getLogs(req, res, next) {
    try {
      const result = await permissionService.getPermissionLogs(req.query);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async detectAbnormal(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await permissionService.detectPermissionAbnormal(userId);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async checkExpired(req, res, next) {
    try {
      const result = await permissionService.checkExpiredPermissions();
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PermissionController();
