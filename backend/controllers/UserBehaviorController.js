const BaseController = require('./BaseController');
const userBehaviorService = require('../services/UserBehaviorService');
const { success } = require('../utils/result');

class UserBehaviorController extends BaseController {
  constructor() {
    super(userBehaviorService);
  }

  async list(req, res, next) {
    try {
      const result = await userBehaviorService.getBehaviorList({ ...req.query, pageNum: req.query.pageNum, pageSize: req.query.pageSize });
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async stats(req, res, next) {
    try {
      const result = await userBehaviorService.getAggregatedStats(req.query);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async trace(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await userBehaviorService.getUserBehaviorTrace(userId, req.query);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async detectRisk(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await userBehaviorService.detectUserRisk(userId);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async riskList(req, res, next) {
    try {
      const result = await userBehaviorService.getRiskUsers({ ...req.query, pageNum: req.query.pageNum, pageSize: req.query.pageSize });
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  async batchMark(req, res, next) {
    try {
      const { userIds, riskLevel, remark } = req.body;
      const operator = req.user;
      const result = await userBehaviorService.batchMarkRisk(userIds, riskLevel, operator, remark);
      res.json(success(result, `批量标记完成：成功${result.success}个，失败${result.failed}个`));
    } catch (error) {
      next(error);
    }
  }

  async batchWarning(req, res, next) {
    try {
      const { userIds, content } = req.body;
      const operator = req.user;
      const result = await userBehaviorService.batchSendWarning(userIds, operator, content);
      res.json(success(result, `批量发送提醒完成：成功${result.success}个，失败${result.failed}个`));
    } catch (error) {
      next(error);
    }
  }

  async batchRestrict(req, res, next) {
    try {
      const { userIds, restrictType, reason } = req.body;
      const operator = req.user;
      const result = await userBehaviorService.batchRestrict(userIds, restrictType, operator, reason);
      res.json(success(result, `批量限制操作完成：成功${result.success}个，失败${result.failed}个`));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserBehaviorController();
