const MemberOrderService = require('../services/MemberOrderService');
const { success, created, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class MemberOrderController {
  getOrderList = [
    validate(paginationSchema.keys({
      orderStatus: Joi.number().integer().valid(0, 1, 2, 3, 4).allow(null, ''),
      packageType: Joi.string().allow(null, ''),
      payChannel: Joi.string().allow(null, ''),
      isAbnormal: Joi.number().integer().valid(0, 1).allow(null, ''),
      isVerified: Joi.number().integer().valid(0, 1).allow(null, ''),
      uid: Joi.string().allow(null, ''),
      keyword: Joi.string().allow(null, ''),
      startTime: Joi.date().allow(null, ''),
      endTime: Joi.date().allow(null, ''),
      sortBy: Joi.string().valid('createdAt', 'payAmount', 'payTime').default('createdAt'),
      sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await MemberOrderService.getOrderList(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getOrderDetail = [
    async (req, res, next) => {
      try {
        const result = await MemberOrderService.getOrderDetail(parseInt(req.params.id));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getOrderStats = [
    async (req, res, next) => {
      try {
        const result = await MemberOrderService.getOrderStats();
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  verifyOrder = [
    validate(Joi.object({
      remark: Joi.string().max(500).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const operator = {
          userId: req.user?.userId,
          userName: req.user?.realName || req.user?.username,
        };
        const result = await MemberOrderService.verifyOrder(parseInt(req.params.id), operator);
        return success(res, result, '订单核验成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  cancelOrder = [
    async (req, res, next) => {
      try {
        const operator = {
          userId: req.user?.userId,
          userName: req.user?.realName || req.user?.username,
        };
        const result = await MemberOrderService.cancelOrder(parseInt(req.params.id), operator);
        return success(res, result, '订单已取消');
      } catch (error) {
        next(error);
      }
    },
  ];

  refundOrder = [
    validate(Joi.object({
      refundAmount: Joi.number().positive().allow(null),
      refundReason: Joi.string().min(1).max(500).required(),
    })),
    async (req, res, next) => {
      try {
        const operator = {
          userId: req.user?.userId,
          userName: req.user?.realName || req.user?.username,
        };
        const result = await MemberOrderService.refundOrder(
          parseInt(req.params.id),
          req.body,
          operator
        );
        return success(res, result, '退款处理成功');
      } catch (error) {
        next(error);
      }
    },
  ];

  appealOrder = [
    validate(Joi.object({
      appealReason: Joi.string().min(1).max(500).required(),
    })),
    async (req, res, next) => {
      try {
        const operator = {
          userId: req.user?.userId,
          userName: req.user?.realName || req.user?.username,
        };
        const result = await MemberOrderService.appealOrder(
          parseInt(req.params.id),
          req.body,
          operator
        );
        return success(res, result, '异常申诉已提交');
      } catch (error) {
        next(error);
      }
    },
  ];

  resolveAbnormal = [
    validate(Joi.object({
      resolveRemark: Joi.string().max(500).allow(null, ''),
    })),
    async (req, res, next) => {
      try {
        const operator = {
          userId: req.user?.userId,
          userName: req.user?.realName || req.user?.username,
        };
        const result = await MemberOrderService.resolveAbnormal(
          parseInt(req.params.id),
          req.body,
          operator
        );
        return success(res, result, '异常已处理');
      } catch (error) {
        next(error);
      }
    },
  ];

  batchAction = [
    validate(Joi.object({
      action: Joi.string().valid('batch_close', 'batch_verify').required(),
      ids: Joi.array().items(Joi.number().integer()).min(1).required(),
    })),
    async (req, res, next) => {
      try {
        const operator = {
          userId: req.user?.userId,
          userName: req.user?.realName || req.user?.username,
        };
        const result = await MemberOrderService.batchAction(
          req.body.action,
          req.body.ids,
          operator
        );
        const actionMap = { batch_close: '批量关闭', batch_verify: '批量核验' };
        return success(
          res,
          result,
          `${actionMap[req.body.action]}完成：成功${result.successCount}条，失败${result.failCount}条，跳过${result.skippedCount}条`
        );
      } catch (error) {
        next(error);
      }
    },
  ];

  getOrderLogs = [
    validate(paginationSchema.keys({
      logType: Joi.string().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await MemberOrderService.getOrderLogs(
          parseInt(req.params.orderId),
          req.query
        );
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  getTraceInfo = [
    validate(Joi.object({
      traceType: Joi.string().valid('orderNo', 'uid', 'payBatch').required(),
      traceValue: Joi.string().required(),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await MemberOrderService.getTraceInfo(
          req.query.traceType,
          req.query.traceValue
        );
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];

  checkConsistency = [
    async (req, res, next) => {
      try {
        const result = await MemberOrderService.checkConsistency(parseInt(req.params.id));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    },
  ];
}

module.exports = new MemberOrderController();
